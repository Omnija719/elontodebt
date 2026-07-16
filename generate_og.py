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
    
    # Load fonts (increased sizes)
    font_path = os.path.join(os.path.dirname(__file__), 'Orbitron-Bold.ttf')
    try:
        title_font = ImageFont.truetype(font_path, 68)      # Title
        ratio_font = ImageFont.truetype(font_path, 150)     # Big ratio number
        label_font = ImageFont.truetype(font_path, 42)      # "ELONS"
    except:
        title_font = ImageFont.load_default()
        ratio_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
    
    # === Centering helper ===
    def get_centered_x(text, font):
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        return (width - text_width) / 2
    
    # === Better vertical positioning (more centered) ===
    title_y = 110
    ratio_y = 230
    label_y = 410
    
    # Draw Title
    draw.text((get_centered_x("ELON TO DEBT RATIO", title_font), title_y), 
              "ELON TO DEBT RATIO", fill="#FFC700", font=title_font)
    
    # Draw Big Ratio Number
    draw.text((get_centered_x(ratio_str, ratio_font), ratio_y), 
              ratio_str, fill="#FFFFFF", font=ratio_font)
    
    # Draw "ELONS" label
    draw.text((get_centered_x("ELONS", label_font), label_y), 
              "ELONS", fill="#FFC700", font=label_font)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'og_image.png')
    img.save(output_path, "PNG")
    print(f"✅ OG image updated with ratio {ratio_str}")

if __name__ == "__main__":
    generate_social_image()
