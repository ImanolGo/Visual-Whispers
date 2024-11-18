from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class ClaudeModel(str, Enum):
    HAIKU = "claude-3-haiku-20240307"  # Cheapest model

class GenerationRequest(BaseModel):
    prompt: str
    perspective: str = Field(description="How Claude should describe the image (e.g., 'as a medieval peasant')")
    temperature: float = Field(ge=0.0, le=1.0, default=0.7)

class ImageGenerationResponse(BaseModel):
    image_urls: List[str]
    description: str
    modified_prompt: str

class WhisperChainItem(BaseModel):
    image_url: str
    description: str
    prompt: str
    iteration: int