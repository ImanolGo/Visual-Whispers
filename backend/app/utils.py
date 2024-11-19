import os
import re
from typing import Tuple
from dotenv import load_dotenv
from anthropic import Anthropic
import base64
from .models import ClaudeModel

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

def format_perspective_prompt(perspective: str) -> str:
    """
    Format the perspective instruction for Claude in a way that works for any character.
    """
    # Remove common prefix if present
    perspective = perspective.strip()
    perspective = re.sub(r'^as\s+an?\s+', '', perspective, flags=re.IGNORECASE)
    
    # Extract any additional context from the perspective
    match = re.match(r'^(.*?)(?:\s+who\s+(.*))?$', perspective)
    character = match.group(1) if match else perspective
    context = match.group(2) if match and match.group(2) else ""

    prompt = f"""
    You are a {character}.{f' You {context}.' if context else ''} 
    Describe the image from your unique perspective, considering your:
    - Background and experiences
    - Specific knowledge and expertise
    - Typical way of viewing the world
    - Common vocabulary and manner of speaking

    Important guidelines:
    1. Start directly with the description
    2. Focus on what YOU would notice first
    3. Use vocabulary natural to your character
    4. Keep descriptions clear and vivid
    5. Stay in character without being cartoonish
    6. Avoid breaking the fourth wall
    
    Provide a single paragraph description (50-100 words):
    """
    
    return prompt.strip()

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

def sanitize_description(description: str, perspective: str) -> Tuple[str, str]:
    """
    Clean up the description and enhance it for the next image generation,
    maintaining the character's perspective.
    """
    # Basic cleanup
    clean_desc = description.strip()
    clean_desc = re.sub(r'^(Ah,|Oh,|Behold,|I see|Let me tell you about|Before me|Well,)\s*', '', clean_desc, flags=re.IGNORECASE)
    clean_desc = re.sub(r'\s+', ' ', clean_desc)
    
    # Extract character essence from perspective
    perspective = perspective.lower()
    perspective = re.sub(r'^as\s+an?\s+', '', perspective)
    
    # Create an enhanced prompt that maintains the description but adds style bias
    enhanced_prompt = f"""
    {clean_desc}, 
    in the style and perspective of {perspective},
    highly detailed, character-specific interpretation
    """.strip()
    
    return clean_desc, enhanced_prompt