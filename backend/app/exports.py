"""Self-contained HTML keepsake and animated GIF of a chain."""

from __future__ import annotations

import base64
import html
import textwrap
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List, Tuple

from PIL import Image, ImageDraw, ImageFont

from .models import ExportRequest
from .store import Store

INK, PINK, BLUE, PAPER = (30, 26, 60), (255, 72, 176), (0, 120, 191), (236, 239, 243)
_FONT_DIRS = [Path("/usr/share/fonts/truetype/dejavu"), Path("/usr/share/fonts/dejavu")]


def _font(size: int, bold: bool = False, serif: bool = True) -> ImageFont.ImageFont:
    name = ("DejaVuSerif" if serif else "DejaVuSans") + ("-Bold" if bold else "") + ".ttf"
    for d in _FONT_DIRS:
        if (d / name).exists():
            return ImageFont.truetype(str(d / name), size)
    return ImageFont.load_default(size=size)


def _b64(img: Image.Image, max_side: int = 900) -> str:
    img = img.copy()
    img.thumbnail((max_side, max_side))
    buf = BytesIO()
    img.save(buf, format="WEBP", quality=82)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def render_html(req: ExportRequest, store: Store) -> str:
    """Images are embedded, so the file keeps working offline and after the server is gone.

    All user/model text is HTML-escaped (the old report injected it raw).
    """
    e = html.escape
    cards = []
    for i, step in enumerate(req.steps):
        try:
            src = _b64(store.load_image(step.image_id))
        except (FileNotFoundError, ValueError):
            src = ""
        survival = f"{round(step.survival * 100)}%" if step.survival is not None else "–"
        cards.append(
            f"""
      <article class="step">
        <div class="frame">{f'<img src="{src}" alt="Round {i + 1}">' if src else '<div class="missing">image gone</div>'}
          <span class="badge">{i + 1}</span></div>
        <div class="text">
          <div class="who">{e(step.persona.emoji)} <b>{e(step.persona.name)}</b> saw</div>
          <p>{e(step.description)}</p>
          <div class="meta">original words surviving: {survival}</div>
        </div>
      </article>"""
        )
    joined = '\n      <div class="ear">⟶</div>'.join(cards)
    title = e(req.title or req.origin)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visual Whispers · {title}</title>
<style>
  :root {{ --ink:#eceff3; --dim:#a6a3c2; --bg:#151229; --card:#1f1b38; --accent:#ff48b0; --blue:#3aa6ff; }}
  * {{ box-sizing:border-box }}
  body {{ margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 Georgia, 'Iowan Old Style', serif; }}
  header {{ padding:48px 24px 16px; max-width:1100px; margin:auto }}
  h1 {{ font-size:clamp(32px,6vw,64px); margin:0; letter-spacing:-.02em; font-style:italic }}
  .origin {{ color:var(--dim); margin-top:8px; font-family:ui-monospace,Menlo,monospace; font-size:14px }}
  .origin b {{ color:var(--accent); font-weight:normal }}
  main {{ max-width:1100px; margin:auto; padding:16px 24px 64px; display:grid; gap:12px }}
  .step {{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.1fr); gap:24px; background:var(--card);
           border-radius:18px; padding:18px; align-items:center }}
  @media (max-width:720px) {{ .step {{ grid-template-columns:1fr }} }}
  .frame {{ position:relative }} .frame img {{ width:100%; border-radius:10px; display:block;
           filter:drop-shadow(5px 0 0 var(--accent)) drop-shadow(-5px 0 0 var(--blue)) }}
  .missing {{ aspect-ratio:1; display:grid; place-items:center; color:var(--dim); border:1px dashed #555; border-radius:12px }}
  .badge {{ position:absolute; top:10px; left:10px; background:var(--accent); color:#fff; font:700 14px ui-monospace,monospace;
            padding:4px 10px; border-radius:999px }}
  .who {{ color:var(--dim); font-size:14px; margin-bottom:6px }} .who b {{ color:var(--ink) }}
  .text p {{ font-size:19px; margin:0 }}
  .meta {{ margin-top:10px; font:12px ui-monospace,monospace; color:var(--dim) }}
  .ear {{ text-align:center; color:var(--accent); font-size:28px }}
  footer {{ text-align:center; color:var(--dim); font-size:13px; padding-bottom:40px }}
</style></head>
<body>
  <header><h1>{title}</h1>
    <div class="origin">it started as: <b>“{e(req.origin)}”</b> · {len(req.steps)} whispers</div></header>
  <main>
      {joined}
  </main>
  <footer>Made with Visual Whispers · {datetime.now().strftime("%Y-%m-%d %H:%M")}</footer>
</body></html>"""


def _caption_frame(img: Image.Image, top: str, body: str, size: int = 560) -> Image.Image:
    img = img.copy()
    img.thumbnail((size, size))
    canvas = Image.new("RGB", (size, size + 150), INK)
    canvas.paste(img, ((size - img.width) // 2, 0))
    d = ImageDraw.Draw(canvas)
    d.text((18, size + 14), top, font=_font(20, bold=True, serif=False), fill=PINK)
    lines = textwrap.wrap(body, 58)[:4]
    if len(textwrap.wrap(body, 58)) > 4:
        lines[-1] = lines[-1][:55] + "…"
    d.multiline_text((18, size + 46), "\n".join(lines), font=_font(17), fill=PAPER, spacing=4)
    return canvas


def _title_frame(origin: str, rounds: int, size: Tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGB", size, INK)
    d = ImageDraw.Draw(canvas)
    lines = textwrap.wrap(f"“{origin}”", 22)[:6]
    font = _font(40, bold=True, serif=False)
    y = size[1] // 2 - len(lines) * 26 - 30
    for line in lines:  # printed twice, off-register, like the app's title
        d.text((34, y), line, font=font, fill=BLUE)
        d.text((30, y - 3), line, font=font, fill=PINK)
        y += 52
    d.text((30, y + 24), f"…whispered {rounds} times", font=_font(22, serif=True), fill=PAPER)
    return canvas


def render_gif(req: ExportRequest, store: Store, ms_per_frame: int = 1800) -> bytes:
    frames: List[Image.Image] = []
    for i, step in enumerate(req.steps):
        try:
            img = store.load_image(step.image_id)
        except (FileNotFoundError, ValueError):
            continue
        frames.append(_caption_frame(img, f"#{i + 1}  {step.persona.name} saw:", step.description))
    if not frames:
        raise ValueError("No images left to animate")
    frames.insert(0, _title_frame(req.origin, len(frames), frames[0].size))
    durations = [ms_per_frame] * len(frames)
    durations[-1] = ms_per_frame * 2  # linger on the punchline
    frames = [f.convert("P", palette=Image.ADAPTIVE, colors=255) for f in frames]
    buf = BytesIO()
    frames[0].save(buf, format="GIF", save_all=True, append_images=frames[1:], duration=durations, loop=0,
                   optimize=True)
    return buf.getvalue()
