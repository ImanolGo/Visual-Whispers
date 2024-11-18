import os
import base64
from dotenv import load_dotenv
import aiohttp
from anthropic import Anthropic
from io import BytesIO
from .models import ClaudeModel

load_dotenv()

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

async def download_image(url: str) -> bytes:
    """Download image from URL and return as bytes."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.read()

def format_perspective_prompt(perspective: str) -> str:
    """Format the perspective instruction for Claude."""
    return f"You are looking at an image. Describe what you see {perspective}. " \
           f"Be creative and stay in character. Provide only the description, " \
           f"no additional commentary or explanations."

async def get_image_description(image_bytes: bytes, perspective: str, temperature: float) -> str:
    """Get image description from Claude."""
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    
    # Convert image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Create the system and user messages
    system_prompt = format_perspective_prompt(perspective)
    
    try:
        message = client.messages.create(
            model=ClaudeModel.HAIKU.value,
            max_tokens=1000,
            temperature=temperature,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/webp",
                                "data": base64_image
                            }
                        }
                    ]
                }
            ]
        )
        return message.content[0].text
    except Exception as e:
        raise Exception(f"Error getting image description from Claude: {str(e)}")

def sanitize_description(description: str) -> str:
    """Clean up the description for use as a prompt."""
    # Remove any special characters or formatting that might interfere with image generation
    # Keep it simple but descriptive
    return description.strip().replace("\n", " ").replace("  ", " ")