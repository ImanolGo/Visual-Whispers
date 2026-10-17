import asyncio
import base64
import json
from io import BytesIO

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.drift import analyse, content_words
from app.providers import (
    MockDescriber,
    MockPainter,
    OpenRouterDescriber,
    OpenRouterPainter,
    ProviderError,
    ReplicatePainter,
    build_system_prompt,
    describe_temperature,
)
from main import create_app

PERSONA = {"name": "Space Archaeologist", "emoji": "🛸", "voice": "as a space archaeologist from the year 4000"}


def png_bytes(color=(200, 80, 40)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (64, 64), color).save(buf, format="PNG")
    return buf.getvalue()


def run(coro):
    return asyncio.run(coro)


def parse_sse(text: str):
    events = []
    for block in text.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.split("\n") if ": " in line)
        events.append((lines["event"], json.loads(lines["data"])))
    return events


@pytest.fixture
def client(tmp_path):
    settings = Settings(mock=True, data_dir=tmp_path, static_dir=tmp_path / "nope")
    return TestClient(create_app(settings))


# ---------------------------------------------------------------- drift

def test_drift_tracks_original_words():
    d = analyse("a serene lake at sunset", "a serene lake at sunset",
                "A glowing lake swallowed by brass gears under an orange sky")
    words = {w["word"]: w["kept"] for w in d["origin_words"]}
    assert words == {"serene": False, "lake": True, "sunset": False}
    assert d["survival"] == pytest.approx(1 / 3, abs=0.01)
    assert "gears" in d["new_words"] and "serene" in d["lost_words"]


def test_stemming_matches_plurals():
    assert set(content_words("Lakes and mountains")) == set(content_words("a lake by the mountain"))


# ---------------------------------------------------------------- prompts

def test_prompt_and_temperature_follow_imagination():
    low, high = build_system_prompt("as a botanist", 0.1), build_system_prompt("as a botanist", 0.9)
    assert "you are a botanist." in low and "literal" in low and "imagination run" in high
    assert describe_temperature(0) == 0.2 and describe_temperature(1) == 1.0


# ---------------------------------------------------------------- providers (HTTP mocked)

def test_openrouter_describer_streams_tokens():
    seen = {}

    def handler(request: httpx.Request):
        seen["body"] = json.loads(request.content)
        chunks = [{"choices": [{"delta": {"content": t}}]} for t in ["I see ", "a ", "relic."]]
        body = ": OPENROUTER PROCESSING\n\n" + "".join(f"data: {json.dumps(c)}\n\n" for c in chunks) + "data: [DONE]\n\n"
        return httpx.Response(200, text=body, headers={"content-type": "text/event-stream"})

    client = httpx.AsyncClient(base_url="https://x", transport=httpx.MockTransport(handler))
    d = OpenRouterDescriber(Settings(openrouter_api_key="k"), client=client)

    async def collect():
        return [t async for t in d.stream(Image.new("RGB", (32, 32)), PERSONA["voice"], 0.5)]

    assert "".join(run(collect())) == "I see a relic."
    body = seen["body"]
    assert body["model"] == "anthropic/claude-haiku-5.5" and body["stream"] is True
    assert body["messages"][1]["content"][0]["image_url"]["url"].startswith("data:image/jpeg;base64,")


def test_openrouter_describer_reports_auth_errors():
    client = httpx.AsyncClient(base_url="https://x", transport=httpx.MockTransport(
        lambda r: httpx.Response(401, json={"error": {"message": "No auth credentials found"}})))
    d = OpenRouterDescriber(Settings(openrouter_api_key="k"), client=client)

    async def collect():
        return [t async for t in d.stream(Image.new("RGB", (8, 8)), "as a cat", 0.5)]

    with pytest.raises(ProviderError, match="401.*check OPENROUTER_API_KEY"):
        run(collect())


def test_openrouter_painter_decodes_data_url_and_picks_modalities():
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        if request.url.path.endswith("/models"):
            return httpx.Response(200, json={"data": [{"id": "google/gemini-3.1-flash-lite-image",
                                                       "architecture": {"output_modalities": ["image", "text"]}}]})
        url = "data:image/png;base64," + base64.b64encode(png_bytes()).decode()
        return httpx.Response(200, json={"choices": [{"message": {"content": "", "images": [
            {"type": "image_url", "image_url": {"url": url}}]}}]})

    client = httpx.AsyncClient(base_url="https://x", transport=httpx.MockTransport(handler))
    p = OpenRouterPainter(Settings(openrouter_api_key="k", openrouter_image_model="google/gemini-3.1-flash-lite-image"),
                          client=client)
    data = run(p.paint("a lake"))
    assert Image.open(BytesIO(data)).size == (64, 64)
    body = json.loads(calls[-1].content)
    assert body["modalities"] == ["image", "text"] and body["image_config"] == {"aspect_ratio": "1:1"}


def test_replicate_painter_polls_until_done():
    state = {"polls": 0}

    def handler(request: httpx.Request):
        if request.method == "POST":
            assert request.headers["Prefer"] == "wait=60"
            return httpx.Response(201, json={"status": "processing", "output": None,
                                             "urls": {"get": "https://api.replicate.com/v1/predictions/p1"}})
        if "predictions/p1" in str(request.url):
            state["polls"] += 1
            return httpx.Response(200, json={"status": "succeeded", "output": ["https://delivery/img.webp"]})
        return httpx.Response(200, content=png_bytes())

    p = ReplicatePainter(Settings(replicate_api_token="r"), client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    assert Image.open(BytesIO(run(p.paint("a lake")))).size == (64, 64)
    assert state["polls"] == 1


def test_auto_provider_selection():
    assert Settings(replicate_api_token="r").resolved_image_provider == "replicate"
    assert Settings().resolved_image_provider == "openrouter"
    assert Settings(mock=True, replicate_api_token="r").resolved_image_provider == "mock"


# ---------------------------------------------------------------- API

def test_step_streams_all_stages(client):
    r = client.post("/api/step", json={"prompt": "a red lake at sunset", "origin": "a red lake at sunset",
                                       "persona": PERSONA, "imagination": 0.8})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/event-stream")
    events = parse_sse(r.text)
    kinds = [e for e, _ in events]
    assert kinds[:3] == ["stage", "image", "stage"] and kinds[-1] == "done" and "token" in kinds
    done = events[-1][1]
    assert done["description"] and "Painted the way Space Archaeologist" in done["next_prompt"]
    assert 0 <= done["drift"]["survival"] <= 1
    img = client.get(done["image_url"])
    assert img.status_code == 200 and img.headers["content-type"] == "image/webp"


def test_step_errors_are_streamed_not_500(tmp_path):
    class Broken(MockPainter):
        async def paint(self, prompt, aspect_ratio="1:1"):
            raise ProviderError("OpenRouter 402: out of credits")

    c = TestClient(create_app(Settings(mock=True, data_dir=tmp_path), painter=Broken(), describer=MockDescriber()))
    events = parse_sse(c.post("/api/step", json={"prompt": "x", "origin": "x", "persona": PERSONA}).text)
    assert events[-1] == ("error", {"message": "OpenRouter 402: out of credits"})


def test_validation_and_traversal(client):
    assert client.post("/api/step", json={"prompt": "", "origin": "x", "persona": PERSONA}).status_code == 422
    assert client.get("/api/images/..%2F..%2Fetc%2Fpasswd").status_code in (400, 404)
    assert client.get("/api/images/" + "0" * 32).status_code == 404


def _make_steps(client, n=2):
    steps, prompt = [], "a blue lake"
    for _ in range(n):
        done = parse_sse(client.post("/api/step", json={"prompt": prompt, "origin": "a blue lake",
                                                        "persona": PERSONA}).text)[-1][1]
        steps.append({"image_id": done["image_id"], "description": done["description"], "persona": PERSONA,
                      "survival": done["drift"]["survival"]})
        prompt = done["next_prompt"]
    return steps


def test_exports_escape_and_embed(client):
    steps = _make_steps(client)
    steps[0]["description"] = "<script>alert(1)</script>"
    r = client.post("/api/export/html", json={"origin": "a blue lake", "steps": steps})
    assert r.status_code == 200
    assert "<script>alert(1)" not in r.text and "&lt;script&gt;" in r.text
    assert r.text.count("data:image/webp;base64,") == 2  # images embedded, no expiring URLs

    g = client.post("/api/export/gif", json={"origin": "a blue lake", "steps": steps})
    gif = Image.open(BytesIO(g.content))
    assert g.headers["content-type"] == "image/gif" and gif.n_frames == 3  # title card + 2 rounds


def test_share_roundtrip(client):
    chain = {"origin": "a blue lake", "steps": _make_steps(client, 1)}
    cid = client.post("/api/chains", json=chain).json()["id"]
    assert client.get(f"/api/chains/{cid}").json() == chain
    assert client.get("/api/chains/nope").status_code == 404


def test_health_explains_missing_keys(tmp_path):
    h = TestClient(create_app(Settings(data_dir=tmp_path))).get("/api/health").json()
    assert not h["ok"] and "OPENROUTER_API_KEY is not set" in h["problems"]
