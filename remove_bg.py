from PIL import Image

def remove_checkerboard(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Heuristic: The checkerboard usually consists of two colors, e.g., distinct greys.
    # We'll sample the top-left pixel and maybe the one next to it to find the "background" colors.
    # Or simplified: if it's a generated image, the checkerboard might be perfect colors.
    
    # Let's assume top-left is background.
    bg_color_1 = img.getpixel((0, 0))
    # Look for a different color nearby to find the second checker color
    bg_color_2 = None
    
    width, height = img.size
    for x in range(min(50, width)):
        for y in range(min(50, height)):
            p = img.getpixel((x, y))
            if p != bg_color_1:
                # Potential second background color or foreground.
                # Checkerboards are usually regular. Let's assume if it looks "greyish" and is close to boundary.
                # Actually, let's just make a rigorous check:
                # If the pixel matches bg_color_1, make it transparent.
                pass
    
    # Better approach for AI generated checkerboards:
    # They are often "grey" and "light grey".
    # Let's filter out colors that are grey-scale and repeating?
    # No, that might remove the laptop silver or hoodie shadows.
    
    # Let's try to just remove the top-left pixel color and hope it's a solid background for now.
    # If it's a checkerboard, this will leave half the checks.
    
    # Alternative: Flood fill from corners?
    # Yes, flood fill is safer for "background removal".
    
    # Let's do a flood fill from (0,0) and (width-1, height-1) etc.
    # But flood fill only removes connected components.
    
    # Let's use `rembg` if installed? No, can't assume.
    
    # Let's try a simple color replacement for the top-left pixel color and the likely secondary checker color.
    # Usually #CCCCCC and #FFFFFF or similar.
    
    # Sample top-left
    c1 = img.getpixel((0, 0))
    c2 = img.getpixel((0, 10)) # Sample a bit down
    c3 = img.getpixel((10, 0)) # Sample a bit right
    
    # Collect unique colors in the first 20x20 block
    bg_candidates = set()
    for x in range(20):
        for y in range(20):
            bg_candidates.add(img.getpixel((x, y)))
            
    # Assuming the character is centered, the corners are definitely background.
    
    for item in datas:
        # If the color is in our "background candidates" (and looks like a checkerboard color i.e. r==g==b), make transparent
        if item in bg_candidates:
             # Heuristic check: is it grey?
             if abs(item[0] - item[1]) < 5 and abs(item[1] - item[2]) < 5:
                  new_data.append((255, 255, 255, 0))
             else:
                  new_data.append(item)
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    try:
        remove_checkerboard("client/public/assets/character_spritesheet_raw.png", "client/public/assets/character_spritesheet.png")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
