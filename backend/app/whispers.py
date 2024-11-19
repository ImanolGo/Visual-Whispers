import replicate
from .models import GenerationRequest
from .utils import get_image_description, sanitize_description

async def download_image(url: str) -> bytes:
    """Download image from URL and return as bytes."""
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise Exception(f"Failed to download image: {response.status}")
            return await response.read()

async def generate_image(prompt: str) -> str:
    """Generate image using Flux Schnell model."""
    try:
        output = replicate.run(
            "black-forest-labs/flux-schnell",
            input={"prompt": prompt}
        )
        
        # Flux Schnell returns a list of image URLs
        return list(output)[0]
    except Exception as e:
        raise Exception(f"Error generating image: {str(e)}")

async def generate_image_chain(request: GenerationRequest) -> dict:
    """Generate an image, get its description, and prepare for the next iteration."""
    try:
        # Generate initial image
        image_url = await generate_image(request.prompt)
        
        # Download the image
        image_bytes = await download_image(image_url)
        
        # Get description from Claude
        description = await get_image_description(
            image_bytes,
            request.perspective,
            request.temperature
        )
        
        # Sanitize description for use as next prompt
        clean_desc, modified_prompt = sanitize_description(description, request.perspective)
        
        return {
            "image_urls": [image_url],
            "description": clean_desc,
            "modified_prompt": modified_prompt
        }
        
    except Exception as e:
        raise Exception(f"Error in image chain generation: {str(e)}")

async def continue_chain(
    previous_prompt: str,
    perspective: str,
    temperature: float
) -> dict:
    """Continue the chain with a new iteration."""
    try:
        # Generate new image from previous description
        image_url = await generate_image(previous_prompt)
        
        # Download the new image
        image_bytes = await download_image(image_url)
        
        # Get new description
        description = await get_image_description(
            image_bytes,
            perspective,
            temperature
        )
        
        # Prepare next prompt
        clean_desc, modified_prompt = sanitize_description(description, perspective)
        
        return {
            "image_url": image_url,
            "description": clean_desc,
            "modified_prompt": modified_prompt,
        }
        
    except Exception as e:
        raise Exception(f"Error continuing chain: {str(e)}")