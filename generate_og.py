import os
import json
from PIL import Image, ImageDraw, ImageFont

def generate_social_image():
    # Load latest data
    json_path = os.path.join(os.path.dirname(__file__), 'data.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    ratio = data.get('ratio', 0.0)
    ratio_str = f"{ratio:.2f}"
    
    # Open template
    template_path = os.path.join(os.path.dirname(__file__), 'og_template.png')
    img = Image.open(template_path)
    draw = ImageDraw.Draw(img)
    
    # Load font (Orbitron)
    font_path = os.path.join(os.path.dirname(__file__), 'Orbitron-Bold.ttf')
    try:
        title_font = ImageFont.truetype(font_path, 85)
        ratio_font = ImageFont.truetype(font_path, 140)
        subtitle_font = ImageFont.truetype(font_path, 32)
    except:
        title_font = ImageFont.load_default()
        ratio_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Draw text
    draw.text((80, 120), "ELON TO DEBT RATIO", fill="#FFC700", font=title_font)
    draw.text((80, 260), ratio_str, fill="#FFFFFF", font=ratio_font)
    draw.text((80, 420), "ELONS", fill="#FFC700", font=subtitle_font)
    draw.text((80, 480), "Real-Time U.S. National Debt Comparison", fill="#CCCCCC", font=subtitle_font)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'og_image.png')
    img.save(output_path, "PNG")
    print(f"✅ Dynamic OG image generated with ratio {ratio_str}")

if __name__ == "__main__":
    generate_social_image()
