"""Model providers.

- Describer: a vision LLM on OpenRouter that looks at an image *in character*
  and streams back a short description.
- Painters: turn a prompt into image bytes (Replicate Flux, any OpenRouter
  image model, or an offline mock for demos and tests).
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import logging
import math
import random
from io import BytesIO
from typing import AsyncIterator, Dict, List, Optional, Protocol

import httpx
from PIL import Image, ImageDraw, ImageFilter

from .config import Settings
from .drift import content_words

log = logging.getLogger("whispers")

OPENROUTER_URL = "https://openrouter.ai/api/v1"
APP_HEADERS = {"HTTP-Referer": "https://github.com/ImanolGo/Visual-Whispers", "X-Title": "Visual Whispers"}


class ProviderError(RuntimeError):
    """Something went wrong talking to a model. The message is safe to show users.

    ``retryable`` marks the hiccups worth one more try (a dropped or empty
    stream, a 5xx, a rate limit) as opposed to real errors like a bad key.
    """

    def __init__(self, message: str, *, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #

SYSTEM_TEMPLATE = """You are playing Visual Whispers, a game of telephone with pictures.
Your character: {voice}

Someone shows you a picture. Describe it in {words} words, as a single paragraph, in your character's own voice and vocabulary.
A painter who cannot see the picture will repaint it from your words alone, so mention the main subject, the setting, the colours, the light and the composition.
{imagination}
Write only the description: no preamble, no title, no quotation marks, no lists."""

IMAGINATION_LEVELS = [
    (0.35, "Be careful and literal: name what is really there and keep colours, positions and proportions accurate. Only your voice is in character."),
    (0.7, "Describe what is there, but the way your character would: name things with your own words and dwell on what you care about most."),
    (1.01, "Let your imagination run: misread ambiguous shapes the way your character would, add small details you are sure must be there, and exaggerate what fascinates you."),
]


def imagination_instruction(level: float) -> str:
    for threshold, text in IMAGINATION_LEVELS:
        if level < threshold:
            return text
    return IMAGINATION_LEVELS[-1][1]


def describe_temperature(level: float) -> float:
    return round(min(1.0, 0.2 + 0.8 * max(0.0, level)), 2)


def build_system_prompt(voice: str, imagination: float, words: str = "40 to 70") -> str:
    voice = voice.strip().rstrip(".")
    if voice.lower().startswith("as "):
        voice = "you are " + voice[3:]
    return SYSTEM_TEMPLATE.format(voice=voice + ".", words=words, imagination=imagination_instruction(imagination))


def next_prompt(description: str, persona_name: str, bleed: bool) -> str:
    """What the painter hears for the next round."""
    text = " ".join(description.split())
    if bleed and persona_name:
        text += f"\n\nPainted the way {persona_name} imagines it, with their obsessions exaggerated."
    return text


def to_data_url(img: Image.Image, max_side: int = 768) -> str:
    img = img.copy()
    img.thumbnail((max_side, max_side))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# --------------------------------------------------------------------------- #
# Interfaces
# --------------------------------------------------------------------------- #


class Describer(Protocol):
    name: str

    def stream(self, image: Image.Image, voice: str, imagination: float) -> AsyncIterator[str]: ...


class Painter(Protocol):
    name: str

    async def paint(self, prompt: str, aspect_ratio: str = "1:1") -> bytes: ...


# --------------------------------------------------------------------------- #
# OpenRouter describer
# --------------------------------------------------------------------------- #


class OpenRouterDescriber:
    # A stream can occasionally come back empty or die mid-flight; one quiet retry
    # keeps a five-round chain from collapsing on a single hiccup.
    ATTEMPTS = 2
    RETRY_DELAY = 0.6

    def __init__(self, settings: Settings, client: Optional[httpx.AsyncClient] = None):
        if not settings.openrouter_api_key:
            raise ProviderError("OPENROUTER_API_KEY is not set")
        self.name = settings.describe_model
        self.max_tokens = settings.describe_max_tokens
        # Models that turned down the reasoning flag are asked again without it.
        self._no_reasoning: set[str] = set()
        self.client = client or httpx.AsyncClient(
            base_url=OPENROUTER_URL,
            timeout=settings.request_timeout,
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}", **APP_HEADERS},
        )

    def _body(self, image: Image.Image, voice: str, imagination: float) -> dict:
        body = {
            "model": self.name,
            "stream": True,
            "max_tokens": self.max_tokens,
            "temperature": describe_temperature(imagination),
            "messages": [
                {"role": "system", "content": build_system_prompt(voice, imagination)},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": to_data_url(image)}},
                        {"type": "text", "text": "What do you see?"},
                    ],
                },
            ],
        }
        if self.name not in self._no_reasoning:
            # Reasoning models bill their thinking to max_tokens and can spend the
            # whole budget there, streaming nothing back. This is a 70-word look
            # at a picture, so we ask them not to think about it.
            body["reasoning"] = {"enabled": False}
        return body

    async def stream(self, image: Image.Image, voice: str, imagination: float) -> AsyncIterator[str]:
        last: Optional[ProviderError] = None
        finish_reason: Optional[str] = None
        for attempt in range(self.ATTEMPTS):
            got_text = False
            finish_reason = None
            try:
                async with self.client.stream("POST", "/chat/completions",
                                              json=self._body(image, voice, imagination)) as resp:
                    if resp.status_code != 200:
                        status = resp.status_code
                        message = _openrouter_error(await resp.aread(), status)
                        if status == 400 and "reasoning" in message.lower() and self.name not in self._no_reasoning:
                            self._no_reasoning.add(self.name)
                            log.warning("%s turned down the reasoning flag, asking again without it", self.name)
                            last = ProviderError(message, retryable=True)
                            continue
                        raise ProviderError(message, retryable=status == 429 or status >= 500)
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue  # SSE comments / keep-alives
                        payload = line[5:].strip()
                        if payload == "[DONE]":
                            break
                        chunk = _json(payload)
                        if chunk.get("error"):
                            raise ProviderError(str(chunk["error"].get("message", chunk["error"])),
                                                retryable=True)
                        for choice in chunk.get("choices", []):
                            finish_reason = choice.get("finish_reason") or finish_reason
                            text = (choice.get("delta") or {}).get("content")
                            if text:
                                got_text = True
                                yield text
            except ProviderError as e:
                if got_text:      # words already reached the client, so a retry would repeat them
                    raise
                if not e.retryable:
                    raise
                last = e
            if got_text:
                return
            if attempt + 1 < self.ATTEMPTS:
                log.warning("describer came back empty, retrying (%d/%d)", attempt + 1, self.ATTEMPTS)
                await asyncio.sleep(self.RETRY_DELAY)
        if last is not None:
            raise last
        if finish_reason == "length":
            raise ProviderError("The describer ran out of tokens before it wrote anything")
        raise ProviderError("The describer returned an empty whisper")


# --------------------------------------------------------------------------- #
# Painters
# --------------------------------------------------------------------------- #


class ReplicatePainter:
    def __init__(self, settings: Settings, client: Optional[httpx.AsyncClient] = None):
        if not settings.replicate_api_token:
            raise ProviderError("REPLICATE_API_TOKEN is not set")
        self.name = settings.replicate_model
        self.timeout = settings.request_timeout
        self.client = client or httpx.AsyncClient(
            timeout=settings.request_timeout,
            headers={"Authorization": f"Bearer {settings.replicate_api_token}"},
        )

    async def paint(self, prompt: str, aspect_ratio: str = "1:1") -> bytes:
        resp = await self.client.post(
            f"https://api.replicate.com/v1/models/{self.name}/predictions",
            headers={"Prefer": "wait=60"},
            json={"input": {"prompt": prompt, "aspect_ratio": aspect_ratio, "output_format": "webp",
                            "num_outputs": 1, "go_fast": True}},
        )
        if resp.status_code >= 400:
            raise ProviderError(f"Replicate error {resp.status_code}: {resp.text[:300]}")
        pred = resp.json()
        deadline = asyncio.get_event_loop().time() + self.timeout
        while not pred.get("output") and pred.get("status") in ("starting", "processing"):
            if asyncio.get_event_loop().time() > deadline:
                raise ProviderError("Replicate timed out")
            await asyncio.sleep(1.0)
            pred = (await self.client.get(pred["urls"]["get"])).json()
        if pred.get("status") == "failed" or pred.get("error"):
            raise ProviderError(f"Replicate failed: {pred.get('error')}")
        output = pred.get("output")
        url = output[0] if isinstance(output, list) and output else output
        if not isinstance(url, str):
            raise ProviderError("Replicate returned no image")
        img = await self.client.get(url)
        img.raise_for_status()
        return img.content


class OpenRouterPainter:
    """Any OpenRouter model with image output (Flux 2, Gemini image, GPT image, ...)."""

    _modalities_cache: Dict[str, List[str]] = {}

    def __init__(self, settings: Settings, client: Optional[httpx.AsyncClient] = None):
        if not settings.openrouter_api_key:
            raise ProviderError("OPENROUTER_API_KEY is not set")
        self.name = settings.openrouter_image_model
        self.client = client or httpx.AsyncClient(
            base_url=OPENROUTER_URL,
            timeout=settings.request_timeout,
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}", **APP_HEADERS},
        )

    async def _modalities(self) -> List[str]:
        """Image-only models need ["image"]; models that also write text need ["image", "text"]."""
        if self.name not in self._modalities_cache:
            mods = ["image"]
            try:
                resp = await self.client.get("/models", params={"output_modalities": "image"})
                for m in resp.json().get("data", []):
                    if m.get("id") == self.name:
                        out = m.get("architecture", {}).get("output_modalities", ["image"])
                        mods = ["image", "text"] if "text" in out else ["image"]
            except Exception as e:  # network hiccup: fall back to a heuristic
                log.warning("Could not look up %s modalities: %s", self.name, e)
                mods = ["image", "text"] if self.name.startswith(("google/", "openai/gpt-5")) else ["image"]
            self._modalities_cache[self.name] = mods
        return self._modalities_cache[self.name]

    async def paint(self, prompt: str, aspect_ratio: str = "1:1") -> bytes:
        body = {
            "model": self.name,
            "messages": [{"role": "user", "content": prompt}],
            "modalities": await self._modalities(),
            "image_config": {"aspect_ratio": aspect_ratio},
        }
        resp = await self.client.post("/chat/completions", json=body)
        if resp.status_code != 200:
            raise ProviderError(_openrouter_error(resp.content, resp.status_code))
        data = resp.json()
        try:
            url = data["choices"][0]["message"]["images"][0]["image_url"]["url"]
        except (KeyError, IndexError, TypeError):
            raise ProviderError("The image model returned no image (it may have refused the prompt)") from None
        if url.startswith("data:"):
            return base64.b64decode(url.split(",", 1)[1])
        img = await self.client.get(url)
        img.raise_for_status()
        return img.content


# --------------------------------------------------------------------------- #
# Offline mock providers (MOCK_PROVIDERS=1): no keys, instant, deterministic-ish
# --------------------------------------------------------------------------- #

COLOURS = {
    "red": (214, 64, 69), "orange": (240, 140, 50), "amber": (230, 160, 40), "gold": (222, 180, 60),
    "golden": (222, 180, 60), "yellow": (245, 215, 80), "green": (80, 160, 90), "emerald": (40, 150, 110),
    "teal": (40, 140, 140), "blue": (60, 110, 200), "azure": (80, 150, 230), "indigo": (75, 60, 160),
    "violet": (140, 90, 200), "purple": (130, 70, 170), "pink": (235, 130, 170), "white": (240, 238, 230),
    "silver": (190, 195, 205), "grey": (128, 128, 128), "gray": (128, 128, 128), "black": (25, 25, 30),
    "brown": (130, 90, 60), "sunset": (245, 120, 80), "night": (20, 25, 60), "ocean": (30, 90, 150),
    "sea": (40, 110, 160), "lake": (60, 120, 170), "forest": (40, 100, 60), "fire": (230, 90, 30),
    "snow": (235, 240, 250), "desert": (220, 180, 120), "moon": (220, 220, 200), "sky": (130, 180, 230),
}
FLAVOUR = ["luminous", "ancient", "humming", "spiral", "brass", "velvet", "trembling", "crystalline",
           "forgotten", "electric", "whispering", "molten", "gilded", "restless", "secret", "cosmic"]


class MockPainter:
    name = "mock-painter"

    async def paint(self, prompt: str, aspect_ratio: str = "1:1") -> bytes:
        await asyncio.sleep(0.4)
        seed = int(hashlib.sha1(prompt.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        words = list(content_words(prompt).values())
        palette = [COLOURS[w] for w in words if w in COLOURS] or [
            tuple(rng.randint(40, 230) for _ in range(3)) for _ in range(3)
        ]
        while len(palette) < 3:
            palette.append(tuple(min(255, c + rng.randint(-60, 60)) for c in palette[-1]))
        w = h = 768
        img = Image.new("RGB", (w, h))
        top, bottom = palette[0], palette[1]
        draw = ImageDraw.Draw(img)
        for y in range(h):
            t = y / h
            draw.line([(0, y), (w, y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)))
        horizon = rng.randint(h // 2, int(h * 0.75))
        pts = [(0, h)] + [(x, horizon - int(80 * math.sin(x / rng.randint(60, 140) + seed % 7)))
                          for x in range(0, w + 16, 16)] + [(w, h)]
        draw.polygon(pts, fill=palette[2])
        for _ in range(min(9, 2 + len(words))):
            r = rng.randint(18, 110)
            cx, cy = rng.randint(0, w), rng.randint(0, horizon)
            colour = palette[rng.randrange(len(palette))]
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(min(255, c + 40) for c in colour))
        img = img.filter(ImageFilter.GaussianBlur(2))
        buf = BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()


class MockDescriber:
    name = "mock-describer"

    async def stream(self, image: Image.Image, voice: str, imagination: float) -> AsyncIterator[str]:
        # The mock can't see; it reads the colours back and garbles a little, like a bad listener.
        rng = random.Random(hash((image.tobytes()[:256], voice)))
        small = image.resize((3, 3))
        named: List[str] = []
        for px in (small.getpixel((x, y)) for y in range(3) for x in range(3)):
            name = min(COLOURS, key=lambda k: sum((a - b) ** 2 for a, b in zip(COLOURS[k], px, strict=True)))
            if name not in named:
                named.append(name)
        persona = " ".join(voice.removeprefix("as ").split(" who ")[0].split(",")[0].split()[:4]) or "a stranger"
        extra = rng.sample(FLAVOUR, k=1 + int(imagination * 4))
        text = (
            f"Speaking {persona}, I see a {extra[0]} {named[0]} sky over a {named[-1]} land, "
            f"round {' and '.join(named[1:3]) or 'pale'} shapes floating like {rng.choice(['lanterns', 'planets', 'coins', 'eggs', 'moons'])}. "
            f"Everything feels {', '.join(extra[1:]) or 'calm'}, as if the horizon itself were listening."
        )
        for word in text.split(" "):
            await asyncio.sleep(0.03)
            yield word + " "


# --------------------------------------------------------------------------- #


def make_describer(settings: Settings) -> Describer:
    return MockDescriber() if settings.mock else OpenRouterDescriber(settings)


def make_painter(settings: Settings) -> Painter:
    kind = settings.resolved_image_provider
    if kind == "mock":
        return MockPainter()
    if kind == "replicate":
        return ReplicatePainter(settings)
    if kind == "openrouter":
        return OpenRouterPainter(settings)
    raise ProviderError(f"Unknown IMAGE_PROVIDER {kind!r}")


def _json(text: str) -> dict:
    import json

    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else {}
    except ValueError:
        return {}


def _openrouter_error(raw: bytes, status: int) -> str:
    data = _json(raw.decode(errors="replace"))
    msg = (data.get("error") or {}).get("message") if isinstance(data.get("error"), dict) else None
    hints = {401: "check OPENROUTER_API_KEY", 402: "out of OpenRouter credits", 429: "rate limited, slow down"}
    return f"OpenRouter {status}: {msg or raw[:200].decode(errors='replace')}" + (
        f" ({hints[status]})" if status in hints else ""
    )
