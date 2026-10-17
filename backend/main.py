"""Visual Whispers API.

POST /api/step streams Server-Sent Events, so the UI can show each stage live:
  stage(painting) -> image -> stage(looking) -> token... -> done
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, AsyncIterator, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.config import Settings
from app.drift import analyse
from app.exports import render_gif, render_html
from app.models import ExportRequest, StepRequest
from app.providers import ProviderError, make_describer, make_painter, next_prompt
from app.store import Store

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("whispers")


def create_app(settings: Settings | None = None, describer: Any = None, painter: Any = None) -> FastAPI:
    settings = settings or Settings.from_env()
    store = Store(settings.data_dir)
    app = FastAPI(title="Visual Whispers")
    app.state.settings = settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    providers: Dict[str, Any] = {"describer": describer, "painter": painter}

    def get(kind: str) -> Any:
        # Built lazily so the server starts (and /api/health explains what's missing) without keys.
        if providers[kind] is None:
            providers[kind] = make_describer(settings) if kind == "describer" else make_painter(settings)
        return providers[kind]

    @app.get("/api/health")
    async def health() -> Dict[str, Any]:
        problems = []
        if not settings.mock and not settings.openrouter_api_key:
            problems.append("OPENROUTER_API_KEY is not set")
        if settings.resolved_image_provider == "replicate" and not settings.replicate_api_token:
            problems.append("IMAGE_PROVIDER=replicate but REPLICATE_API_TOKEN is not set")
        return {
            "ok": not problems,
            "problems": problems,
            "mock": settings.mock,
            "describer": "mock" if settings.mock else settings.describe_model,
            "painter": {
                "mock": "mock",
                "replicate": settings.replicate_model,
                "openrouter": settings.openrouter_image_model,
            }.get(settings.resolved_image_provider, settings.resolved_image_provider),
        }

    @app.post("/api/step")
    async def step(req: StepRequest, request: Request) -> StreamingResponse:
        async def events() -> AsyncIterator[str]:
            def sse(event: str, data: Dict[str, Any]) -> str:
                return f"event: {event}\ndata: {json.dumps(data)}\n\n"

            timings: Dict[str, float] = {}
            try:
                painter, describer = get("painter"), get("describer")

                yield sse("stage", {"stage": "painting", "model": painter.name})
                t0 = time.perf_counter()
                raw = await painter.paint(req.prompt, req.aspect_ratio)
                image_id, image = store.save_image(raw)
                timings["paint_s"] = round(time.perf_counter() - t0, 2)
                yield sse("image", {"image_id": image_id, "url": f"/api/images/{image_id}",
                                    "width": image.width, "height": image.height})

                yield sse("stage", {"stage": "looking", "model": describer.name})
                t1 = time.perf_counter()
                parts = []
                async for token in describer.stream(image, req.persona.voice, req.imagination):
                    if await request.is_disconnected():
                        log.info("client went away mid-whisper")
                        return
                    parts.append(token)
                    yield sse("token", {"text": token})
                timings["describe_s"] = round(time.perf_counter() - t1, 2)

                description = " ".join("".join(parts).split()).strip().strip('"“”')
                yield sse("done", {
                    "image_id": image_id,
                    "image_url": f"/api/images/{image_id}",
                    "heard": req.prompt,
                    "description": description,
                    "next_prompt": next_prompt(description, req.persona.name, req.bleed),
                    "persona": req.persona.model_dump(),
                    "imagination": req.imagination,
                    "drift": analyse(req.origin, req.previous or req.origin, description),
                    "timings": timings,
                })
            except ProviderError as e:
                log.warning("provider error: %s", e)
                yield sse("error", {"message": str(e)})
            except Exception as e:  # never leave the client hanging with a half-open stream
                log.exception("step failed")
                yield sse("error", {"message": f"Something broke: {type(e).__name__}: {e}"})

        return StreamingResponse(events(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    @app.get("/api/images/{image_id}")
    async def image(image_id: str) -> FileResponse:
        try:
            path = store.image_path(image_id)
        except ValueError:
            raise HTTPException(400, "bad image id") from None
        if not path.exists():
            raise HTTPException(404, "image not found")
        return FileResponse(path, media_type="image/webp",
                            headers={"Cache-Control": "public, max-age=31536000, immutable"})

    @app.post("/api/export/html")
    async def export_html(req: ExportRequest) -> Response:
        body = render_html(req, store)
        return Response(body, media_type="text/html; charset=utf-8",
                        headers={"Content-Disposition": 'attachment; filename="visual-whispers.html"'})

    @app.post("/api/export/gif")
    async def export_gif(req: ExportRequest) -> Response:
        try:
            body = render_gif(req, store)
        except ValueError as e:
            raise HTTPException(400, str(e)) from None
        return Response(body, media_type="image/gif",
                        headers={"Content-Disposition": 'attachment; filename="visual-whispers.gif"'})

    @app.post("/api/chains")
    async def share(chain: Dict[str, Any]) -> Dict[str, str]:
        if len(json.dumps(chain)) > 500_000:
            raise HTTPException(413, "chain too large")
        return {"id": store.save_chain(chain)}

    @app.get("/api/chains/{chain_id}")
    async def shared(chain_id: str) -> Dict[str, Any]:
        chain = store.load_chain(chain_id)
        if chain is None:
            raise HTTPException(404, "chain not found")
        return chain

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled error")
        return JSONResponse({"detail": f"{type(exc).__name__}: {exc}"}, status_code=500)

    # In production the exported Next.js app is served from here: one origin, no CORS.
    if settings.static_dir.is_dir():
        app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="static")

    return app


app = create_app()
