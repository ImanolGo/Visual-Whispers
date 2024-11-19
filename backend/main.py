from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.models import GenerationRequest
from app.whispers import generate_image_chain, continue_chain
from app.download import save_report
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate")
async def generate(request: GenerationRequest):
    return await generate_image_chain(request)

@app.post("/api/continue")
async def continue_generation(request: GenerationRequest):
    return await continue_chain(
        previous_prompt=request.prompt,
        perspective=request.perspective,
        temperature=request.temperature
    )

@app.post("/api/download")
async def download_report(whispers: List[dict]):
    filename = await save_report(whispers)
    return FileResponse(
        f"downloads/{filename}",
        media_type="text/html",
        filename=filename
    )