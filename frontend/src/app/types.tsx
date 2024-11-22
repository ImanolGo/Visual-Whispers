/**
 * Represents a single state in the visual whispers chain
 */
export type WhisperState = {
    /** URL of the generated image */
    imageUrl: string;
    
    /** AI-generated description of the image */
    description: string;
    
    /** Modified description used as prompt for next generation */
    prompt: string;
    
    /** Current iteration number in the chain */
    iteration: number;
  };
  
  /**
   * Configuration for generating images
   */
  export type GenerationConfig = {
    /** Initial prompt for image generation */
    prompt: string;
    
    /** Perspective used for image description (e.g., "as a medieval peasant") */
    perspective: string;
    
    /** Temperature/creativity level for description generation (0.0 to 1.0) */
    temperature: number;
  };
  
  /**
   * Response from the backend API for image generation
   */
  export type GenerationResponse = {
    /** Array of generated image URLs (usually contains one URL) */
    image_urls: string[];
    
    /** AI-generated description of the image */
    description: string;
    
    /** Modified prompt for next iteration */
    modified_prompt: string;
  };
  
  /**
   * Response from the backend API for chain continuation
   */
  export type ContinueResponse = {
    /** URL of the generated image */
    image_url: string;
    
    /** AI-generated description of the image */
    description: string;
    
    /** Modified prompt for next iteration */
    modified_prompt: string;
  };
  
  /**
   * Available perspective options
   */
  export type PerspectiveOption = {
    /** Unique identifier for the perspective */
    value: string;
    
    /** Display label for the perspective */
    label: string;
    
    /** Detailed perspective instruction */
    perspective: string;
  };
  
  /**
   * Error response from the API
   */
  export type APIError = {
    /** Error message */
    detail: string;
    
    /** Optional error code */
    code?: string;
  };