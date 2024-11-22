const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('API_URL', API_URL);

export async function generateImage(
  prompt: string,
  perspective: string,
  temperature: number
) {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      perspective,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate image');
  }

  return response.json();
}

export async function continueChain(
  previousPrompt: string,
  perspective: string,
  temperature: number
) {
  const response = await fetch(`${API_URL}/api/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: previousPrompt,
      perspective,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to continue chain');
  }

  return response.json();
}