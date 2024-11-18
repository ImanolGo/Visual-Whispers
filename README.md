# 🎨 Visual Whispers

An experimental AI art project that plays "Chinese Whispers" (also known as "Telephone") with images. The twist? The AI describes each image through different personas or perspectives, creating an imaginative chain of visual interpretations.

## 🎯 Project Purpose

This project is a learning experiment combining different AI models to explore:
- Image generation with Stable Diffusion models
- Image-to-text capabilities with configurable perspectives
- How different viewpoints affect the evolution of generated images
- API integrations and prompt engineering
- The creative "drift" of images through multiple AI interpretations

## 🛠️ Tech Stack

- Backend: Python/FastAPI
- Frontend: Next.js with TypeScript
- AI Models (via Replicate API):
  - Image Generation: stability-ai/sdxl
  - Image Description: salesforce/blip

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- Replicate API account
- Git

## 🚀 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/visual-whispers.git
cd visual-whispers
```

2. Install root dependencies
```bash
npm install
```

3. Backend setup
```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create and activate virtual environment with uv
cd backend
uv venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies with uv
uv pip install -r requirements.txt
```

4. Frontend setup
```bash
cd frontend
npm install
```

## ⚙️ Configuration

1. Create a `.env` file in the backend directory:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
```

2. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🏃‍♂️ Running the Application

Start both frontend and backend with a single command:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎮 How to Use

1. Initial Setup:
   - Enter your initial prompt (e.g., "a serene lake at sunset")
   - Choose a perspective for image description (e.g., "as a medieval peasant")
   - Set the "imagination level" (0.0 - 1.0)

2. Generation Process:
   - Click "Generate First Image" to start
   - The AI will:
     1. Generate an image from your prompt
     2. Describe that image from your chosen perspective
     3. Use that description to generate the next image
   - Click "Next Iteration" when ready to continue
   - You can change the perspective or imagination level at any point

3. Controls:
   - Manual iteration control with "Next Iteration" button
   - Perspective selector for image description
   - Imagination level slider (temperature)
   - Reset button to start a new chain

## 🌟 Features

- Customizable perspectives for image description:
  - Historical figures (e.g., "as a medieval peasant", "as a Victorian explorer")
  - Age-based perspectives (e.g., "as a 6-year-old child", "as a wise elder")
  - Professional viewpoints (e.g., "as an art critic", "as a botanist")
  - Cultural perspectives (e.g., "as a Buddhist monk", "as a Renaissance artist")
- Adjustable "imagination level" (temperature):
  - Low (0.0-0.3): Literal, detailed descriptions
  - Medium (0.4-0.7): Balanced interpretation
  - High (0.8-1.0): More creative and imaginative descriptions
- Visual history showing the evolution of images
- Display of:
  - Original prompt
  - Current perspective/persona
  - AI-generated description
  - Imagination level
- Download capability for image sequences
- Shareable links for interesting chains

## 💡 Tips

- Experiment with different perspectives:
  - Try contrasting viewpoints (e.g., "modern scientist" vs "ancient shaman")
  - Use emotional perspectives (e.g., "as an optimistic poet")
  - Mix technical and naive viewpoints
- Imagination level effects:
  - Lower values (0.1-0.3) for more consistent image chains
  - Higher values (0.7-1.0) for more surprising and creative evolution
  - Mid-range (0.4-0.6) for balanced interpretation
- Start with clear, distinctive images for best results
- Try running the same initial image through different perspectives

## ⚙️ Advanced Usage

- Combine perspectives with time periods (e.g., "as a 1920s jazz musician")
- Use professional perspectives for specific details (e.g., "as a botanist focusing on plant species")
- Experiment with emotional states (e.g., "as an excited child on Christmas morning")
- Try abstract perspectives (e.g., "as a color-blind painter", "as a time traveler")

## 📝 Notes

- This is an experimental project for learning purposes
- Description generation may take longer with more complex perspectives
- The quality of the image chain depends on both the clarity of the perspective and the imagination level
- The Replicate API has usage limits - check their documentation for details

## 🤝 Contributing

This is a learning project, but suggestions and improvements are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own learning!

---
Made with ❤️ and curiosity about AI
