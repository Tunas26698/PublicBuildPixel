from PIL import Image

def process_image(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    # 1. Background Removal (Green Screen)
    # The generated image uses #00FF00 (Lime Green) or similar.
    # Let's sample the top-left pixel.
    bg_color = img.getpixel((0, 0))
    print(f"Detected background color: {bg_color}")
    
    # Threshold for green screen (sometimes compression artifacts change it slightly)
    threshold = 60 
    
    new_data = []
    for item in datas:
        # Check distance to bg_color
        dist = sum(abs(a - b) for a, b in zip(item[:3], bg_color[:3]))
        if dist < threshold:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # 2. Crop to content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to {bbox}")
    
    # 3. Resize
    # The image seems to be a grid.
    # Let's assume we want to standardize the width to something divisible by 4.
    # If the image has 2 rows, we only care about width being consistent for frames.
    # Let's target a frame width of 64px.
    # 4 columns -> 256px width.
    
    target_frame_width = 64
    target_width = target_frame_width * 4
    
    w, h = img.size
    ratio = target_width / w
    target_height = int(h * ratio)
    
    img = img.resize((target_width, target_height), Image.Resampling.NEAREST)
    print(f"Resized to {img.size} (Frame size: {target_frame_width}x{int(target_height/(h/(w/4))) if h!=0 else 0}?)")
    # Actually just assume we divide by columns/rows in Phaser.

    img.save(output_path)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    process_image("client/public/assets/character_spritesheet_green_raw.png", "client/public/assets/character_green_processed.png")
