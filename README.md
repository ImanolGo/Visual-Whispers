## 🚀 Installation & Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/visual-whispers.git
cd visual-whispers
```

2. Install dependencies
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install
cd ..

# Backend dependencies
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

3. Environment Setup
```bash
# Copy environment template
cp .env.template .env

# Edit with your values
nano .env
```

Required variables in `.env`:
```env
# API Keys
REPLICATE_API_TOKEN=your_replicate_token_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

## 🏃‍♂️ Running the Application

### Local Development

1. Make the startup script executable:
```bash
chmod +x start-local.sh
```

2. Start the development servers:
```bash
./start-local.sh
```

This will:
- Check for port availability
- Load environment variables
- Start both frontend and backend in development mode with hot reloading
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Production Deployment

For production deployment with ngrok tunneling:
```bash
./start-prod.sh
```

See [DOCKER.md](DOCKER.md) for detailed production deployment instructions.

## 💻 Development Commands

While `start-local.sh` is the recommended way to run the application, you can also use these npm scripts:

```bash
# Start both frontend and backend
npm run dev

# Start frontend only
npm run frontend

# Start backend only
npm run backend
```

## 🔧 Development Tips

1. Hot Reloading:
   - Frontend changes will automatically refresh the browser
   - Backend changes will automatically restart the server
   - Environment variable changes require a server restart

2. Port Usage:
   - Frontend: 3000
   - Backend: 8000
   - Make sure these ports are available

3. API Testing:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

4. Debugging:
   - Frontend: Use browser DevTools
   - Backend: Check terminal output for logs

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
