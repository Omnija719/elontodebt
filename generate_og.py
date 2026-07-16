import os
import json
from PIL import Image, ImageDraw, ImageFont

def generate_social_image():
    # Load data
    json_path = os.path.join(os.path.dirname(__file__), 'data.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    ratio = data.get('ratio', 0.0)
    ratio_str = f"{ratio:.2f}"
    
    # Load template
    template_path = os.path.join(os.path.dirname(__file__), 'og_template.png')
    img = Image.open(template_path)
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Load fonts
    font_path = os.path.join(os.path.dirname(__file__), 'Orbitron-Bold.ttf')
    try:
        title_font = ImageFont.truetype(font_path, 72)
        ratio_font = ImageFont.truetype(font_path, 130)
        label_font = ImageFont.truetype(font_path, 36)
    except:
        title_font = ImageFont.load_default()
        ratio_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
    
    # === Automatic Centering ===
    def get_centered_position(text, font, y_position):
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) / 2
        return (x, y_position)
    
    # Positions (adjust these Y values if needed)
    title_y = 140
    ratio_y = 260
    label_y = 420
    
    # Draw text (centered)
    draw.text(get_centered_position("ELON TO DEBT RATIO", title_font, title_y), 
              "ELON TO DEBT RATIO", fill="#FFC700", font=title_font)
    
    draw.text(get_centered_position(ratio_str, ratio_font, ratio_y), 
              ratio_str, fill="#FFFFFF", font=ratio_font)
    
    draw.text(get_centered_position("ELONS", label_font, label_y), 
              "ELONS", fill="#FFC700", font=label_font)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'og_image.png')
    img.save(output_path, "PNG")
    print(f"✅ OG image generated with ratio {ratio_str} (centered)")

if __name__ == "__main__":
    generate_social_image()
