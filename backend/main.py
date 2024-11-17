from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import GenerationRequest
from app.whispers import generate_image_chain

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
