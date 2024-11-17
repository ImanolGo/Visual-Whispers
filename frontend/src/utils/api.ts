export const generateImage = async (prompt: string, perspective: string, temperature: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, perspective, temperature }),
  });
  return response.json();
};
