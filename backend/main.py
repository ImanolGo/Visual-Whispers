from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.models import GenerationRequest
from app.whispers import generate_image_chain, continue_chain
from app.download import save_report
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get frontend URL from environment variable with fallback
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

app = FastAPI()

# List of allowed origins
allowed_origins = [
    FRONTEND_URL,
    'http://localhost:3000',  # Fallback for local development
]

# Filter out empty values and duplicates
allowed_origins = list(set(origin for origin in allowed_origins if origin))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "frontend_url": FRONTEND_URL,
        "allowed_origins": allowed_origins
    }