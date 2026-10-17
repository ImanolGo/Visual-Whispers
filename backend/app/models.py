from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Persona(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    emoji: str = Field("🗣️", max_length=16)
    voice: str = Field(..., min_length=3, max_length=600, description="Who is describing the image")


class StepRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="What the painter hears")
    origin: str = Field(..., min_length=1, max_length=2000, description="The very first prompt")
    previous: Optional[str] = Field(None, max_length=4000, description="Previous whisper, for diffing")
    persona: Persona
    imagination: float = Field(0.6, ge=0.0, le=1.0)
    bleed: bool = Field(True, description="Let the persona leak into the next painting prompt")
    aspect_ratio: str = Field("1:1", pattern=r"^(1:1|16:9|9:16|4:3|3:4|3:2|2:3)$")


class ExportStep(BaseModel):
    image_id: str
    description: str = Field(..., max_length=4000)
    persona: Persona
    survival: Optional[float] = None


class ExportRequest(BaseModel):
    origin: str = Field(..., max_length=2000)
    title: Optional[str] = Field(None, max_length=200)
    steps: List[ExportStep] = Field(..., min_length=1, max_length=100)
