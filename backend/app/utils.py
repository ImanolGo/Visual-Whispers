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
    Format the perspective instruction for Claude to generate more authentic,
    biased character descriptions that influence the next image generation.
    """
    # Clean perspective but preserve core character essence
    perspective = perspective.strip()
    perspective = re.sub(r'^as\s+an?\s+', '', perspective, flags=re.IGNORECASE)
    

    prompt = f"""Embody {perspective}. You must write EXACTLY ONE SHORT PARAGRAPH (40-50 words) that:

1. Opens with your immediate professional/emotional reaction
2. Uses TWO field-specific technical terms
3. Mentions ONE sensory detail (smell/sound/texture)
4. Makes ONE strong value judgment
5. Includes ONE subtle personal experience reference

CRITICAL RULES:
- Stay under 50 words MAXIMUM
- NO introductions or meta-references
- Speak as if to a peer
- Focus on unique perspective-specific details

Description:"""
    return prompt.strip()

async def get_image_description(image_bytes: bytes, perspective: str, temperature: float) -> str:
    """Get image description from Claude."""
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    
    # Convert image to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Create the system and user messages
    system_prompt = format_perspective_prompt(perspective)

    print(f"Sysyem Prompt: {system_prompt}")
    
    try:
        message = client.messages.create(
            model=ClaudeModel.HAIKU.value,
            max_tokens=1000,
            # Increase temperature slightly to encourage more creative/biased responses
            temperature=min(temperature + 0.1, 1.0),
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
    creating stronger character-specific biases.
    """
    # Basic cleanup
    clean_desc = description.strip()
    clean_desc = re.sub(r'\s+', ' ', clean_desc)
    
    # Extract character essence
    perspective = re.sub(r'^(as\s+)?(an?\s+)?', '', perspective.lower())
    
    # Create a more focused and biased prompt for the next generation
    enhanced_prompt = f"""
    {clean_desc}
    
    This scene must be rendered:
    - Through the distinct lens of {perspective}
    - With exaggerated elements that matter to the character
    - Emphasizing professional/cultural details specific to {perspective}
    - In a style that reflects the character's emotional state
    - With heightened attention to textures and materials
    - Using lighting that emphasizes character-specific focal points
    """.strip()
    
    return clean_desc, enhanced_prompt