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
    
    # Load fonts - significantly larger (roughly 3x)
    font_path = os.path.join(os.path.dirname(__file__), 'Orbitron-Bold.ttf')
    try:
        ratio_font = ImageFont.truetype(font_path, 220)     # Big ratio number
        elons_font = ImageFont.truetype(font_path, 220)      # "ELONS" label
    except:
        ratio_font = ImageFont.load_default()
        elons_font = ImageFont.load_default()
    
    # === Positioning (Y values you can easily adjust) ===
    ratio_y = 500          # ← Vertical position of the big ratio number
    elons_y = 500          # ← Vertical position of "ELONS" (slightly lower to align)
    
    # Calculate horizontal positions
    ratio_bbox = draw.textbbox((0, 0), ratio_str, font=ratio_font)
    ratio_width = ratio_bbox[2] - ratio_bbox[0]
    
    elons_bbox = draw.textbbox((0, 0), "ELONS", font=elons_font)
    elons_width = elons_bbox[2] - elons_bbox[0]
    
    # Center the whole "ratio ELONS" group
    total_width = ratio_width + 40 + elons_width   # 40 = spacing between ratio and ELONS
    start_x = (width - total_width) / 2
    
    ratio_x = start_x
    elons_x = start_x + ratio_width + 40
    
    # Draw Ratio Number
    draw.text((ratio_x, ratio_y), ratio_str, fill="#FFFFFF", font=ratio_font)
    
    # Draw "ELONS" on the same line
    draw.text((elons_x, elons_y), "ELONS", fill="#FFC700", font=elons_font)
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'og_image.png')
    img.save(output_path, "PNG")
    print(f"✅ OG image updated with ratio {ratio_str}")

if __name__ == "__main__":
    generate_social_image()
