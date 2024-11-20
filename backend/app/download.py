import os
from datetime import datetime
from typing import List
from pathlib import Path

def generate_html_report(whispers: List[dict]) -> str:
    """Generate an HTML report for the whisper chain."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visual Whispers - Generated {timestamp}</title>
        <style>
            body {{
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.5;
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
                background: #f5f5f5;
            }}
            .chain-item {{
                background: white;
                border-radius: 8px;
                padding: 2rem;
                margin-bottom: 2rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .chain-item img {{
                max-width: 100%;
                height: auto;
                border-radius: 4px;
            }}
            .metadata {{
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 1rem;
            }}
            .description {{
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 4px;
                margin-top: 1rem;
            }}
            h1 {{
                color: #2563eb;
                margin-bottom: 2rem;
            }}
            h2 {{
                color: #1e40af;
                margin-top: 0;
            }}
            .arrow {{
                text-align: center;
                color: #6b7280;
                font-size: 1.5rem;
                margin: 1rem 0;
            }}
        </style>
    </head>
    <body>
        <h1>Visual Whispers Chain</h1>
        <div class="metadata">
            Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        </div>
    """
    
    for i, whisper in enumerate(whispers):
        html += f"""
        <div class="chain-item">
            <h2>Iteration {i + 1}</h2>
            <img src="{whisper['imageUrl']}" alt="Generated image {i + 1}">
            <div class="description">
                <strong>Description:</strong>
                <p>{whisper['description']}</p>
            </div>
        </div>
        """
        if i < len(whispers) - 1:
            html += '<div class="arrow">↓</div>'
    
    html += """
    </body>
    </html>
    """
    
    return html

async def save_report(whispers: List[dict], output_dir: str = "downloads") -> str:
    """Save the HTML report and return the filename."""
    # Create downloads directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"visual_whispers_{timestamp}.html"
    filepath = os.path.join(output_dir, filename)
    
    # Generate and save HTML report
    html_content = generate_html_report(whispers)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    return filename