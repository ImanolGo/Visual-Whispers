from pydantic import BaseModel

class GenerationRequest(BaseModel):
    prompt: str
    perspective: str
    temperature: float
