from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
class ClaudeModel(str, Enum):
    HAIKU = "claude-3-haiku-20240307"      # Fast, efficient for simple tasks
    SONNET = "claude-3-5-sonnet-20241022"    # Balanced performance and cost
    OPUS = "claude-3-opus-20240229"        # Most capable, highest quality

class GenerationRequest(BaseModel):
    prompt: str
    perspective: str = Field(..., description="How the AI should describe the image")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Creativity level for description")

class ImageResponse(BaseModel):
    image_urls: list[str]
    description: str
    modified_prompt: str

class ContinueResponse(BaseModel):
    image_url: str
    description: str
    modified_prompt: str