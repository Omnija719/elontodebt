import os
import json
import urllib.request
from PIL import Image, ImageDraw, ImageFont

def generate_social_image():
    # 1. Load Data
    json_path = os.path.join(os.path.dirname(__file__), 'data.json')
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    ratio = data.get('ratio', 0.0)
    ratio_str = f"{ratio:.4f}"
    
    # 2. Open Template Image
    template_path = os.path.join(os.path.dirname(__file__), 'og_template.png')
    img = Image.open(template_path)
    width, height = img.size
    
    # 3. Download Orbitron Font if not present locally
    font_path = os.path.join(os.path.dirname(__file__), 'Orbitron-Bold.ttf')
    if not os.path.exists(font_path):
        print("Downloading font...")
        font_url = "https://github.com/google/fonts/raw/main/ofl/orbitron/static/Orbitron-Bold.ttf"
        try:
            urllib.request.urlretrieve(font_url, font_path)
        except Exception as e:
            print(f"Error downloading font: {e}, falling back to default")
            font_path = None

    # 4. Initialize Drawing
    draw = ImageDraw.Draw(img)
    
    # Define text strings
    val_text = ratio_str
    lbl_text = "ELONS TO EQUAL DEBT"
    
    # 5. Load Font
    try:
        if font_path:
            # We want it very large to fill the center box
            val_font = ImageFont.truetype(font_path, 110)
            lbl_font = ImageFont.truetype(font_path, 28)
        else:
            val_font = ImageFont.load_default()
            lbl_font = ImageFont.load_default()
    except Exception as e:
        print(f"Font loading failed: {e}, falling back to default")
        val_font = ImageFont.load_default()
        lbl_font = ImageFont.load_default()
        
    # 6. Calculate Positions to Center Text
    # Bounding boxes for text
    val_bbox = draw.textbbox((0, 0), val_text, font=val_font)
    val_w = val_bbox[2] - val_bbox[0]
    val_h = val_bbox[3] - val_bbox[1]
    
    lbl_bbox = draw.textbbox((0, 0), lbl_text, font=lbl_font)
    lbl_w = lbl_bbox[2] - lbl_bbox[0]
    lbl_h = lbl_bbox[3] - lbl_bbox[1]
    
    # Center of the glowing card box
    # The template has a card in the center: y ranges roughly from 280 to 720
    # Let's align center relative to image size
    center_x = width / 2
    center_y = height / 2 + 30 # offset slightly down due to header text in template
    
    # Position text
    val_x = center_x - (val_w / 2)
    val_y = center_y - (val_h / 2) - 40
    
    lbl_x = center_x - (lbl_w / 2)
    lbl_y = val_y + val_h + 30
    
    # 7. Draw Glowing Shadow Effect (Double-draw with offset & transparency)
    gold_glow = (255, 199, 0, 50)
    gold_color = (255, 199, 0)
    white_color = (240, 243, 248)
    
    # Draw glow for value
    for offset in range(1, 6):
        draw.text((val_x - offset, val_y), val_text, fill=gold_glow, font=val_font)
        draw.text((val_x + offset, val_y), val_text, fill=gold_glow, font=val_font)
        draw.text((val_x, val_y - offset), val_text, fill=gold_glow, font=val_font)
        draw.text((val_x, val_y + offset), val_text, fill=gold_glow, font=val_font)
        
    # Draw main text
    draw.text((val_x, val_y), val_text, fill=gold_color, font=val_font)
    draw.text((lbl_x, lbl_y), lbl_text, fill=white_color, font=lbl_font)
    
    # 8. Save output
    output_path = os.path.join(os.path.dirname(__file__), 'og_image.png')
    img.save(output_path, "PNG")
    print(f"Successfully generated dynamic share image at {output_path}")

if __name__ == "__main__":
    generate_social_image()
