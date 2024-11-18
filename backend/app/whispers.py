import replicate
from .models import GenerationRequest, ImageGenerationResponse, WhisperChainItem
from .utils import download_image, get_image_description, sanitize_description

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

async def generate_image_chain(request: GenerationRequest) -> ImageGenerationResponse:
    """Generate an image, get its description, and prepare for the next iteration."""
    try:
        # Generate initial image
        image_url = await generate_image(request.prompt)
        
        # Download the image for Claude
        image_bytes = await download_image(image_url)
        
        # Get description from Claude with the specified perspective and temperature
        description = await get_image_description(
            image_bytes,
            request.perspective,
            request.temperature
        )
        
        # Sanitize description for use as next prompt
        modified_prompt = sanitize_description(description)
        
        return ImageGenerationResponse(
            image_urls=[image_url],
            description=description,
            modified_prompt=modified_prompt
        )
        
    except Exception as e:
        raise Exception(f"Error in image chain generation: {str(e)}")

async def continue_chain(
    previous_prompt: str,
    perspective: str,
    temperature: float
) -> WhisperChainItem:
    """Continue the chain with a new iteration."""
    try:
        # Generate new image from previous description
        image_url = await generate_image(previous_prompt)
        
        # Get new description
        image_bytes = await download_image(image_url)
        description = await get_image_description(
            image_bytes,
            perspective,
            temperature
        )
        
        # Prepare next prompt
        next_prompt = sanitize_description(description)
        
        return WhisperChainItem(
            image_url=image_url,
            description=description,
            prompt=next_prompt,
            iteration=1  # This should be incremented by the caller
        )
        
    except Exception as e:
        raise Exception(f"Error continuing chain: {str(e)}")