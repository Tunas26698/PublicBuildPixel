from PIL import Image
import sys

def crop_black_borders(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGB")
        width, height = img.size
        
        # Threshold for "black" (sometimes compression makes it not perfectly 0)
        threshold = 20
        
        left = 0
        top = 0
        right = width - 1
        bottom = height - 1
        
        # Find top
        for y in range(height):
            row_is_black = True
            for x in range(width):
                pixel = img.getpixel((x, y))
                if sum(pixel) > threshold * 3: # Not black
                    row_is_black = False
                    break
            if not row_is_black:
                top = y
                break
                
        # Find bottom
        for y in range(height - 1, -1, -1):
            row_is_black = True
            for x in range(width):
                pixel = img.getpixel((x, y))
                if sum(pixel) > threshold * 3:
                    row_is_black = False
                    break
            if not row_is_black:
                bottom = y
                break

        # Find left
        for x in range(width):
            col_is_black = True
            for y in range(top, bottom + 1):
                pixel = img.getpixel((x, y))
                if sum(pixel) > threshold * 3:
                    col_is_black = False
                    break
            if not col_is_black:
                left = x
                break

        # Find right
        for x in range(width - 1, -1, -1):
            col_is_black = True
            for y in range(top, bottom + 1):
                pixel = img.getpixel((x, y))
                if sum(pixel) > threshold * 3:
                    col_is_black = False
                    break
            if not col_is_black:
                right = x
                break
                
        # Valid crop?
        if right > left and bottom > top:
            print(f"Cropping to ({left}, {top}, {right}, {bottom})")
            cropped_img = img.crop((left, top, right + 1, bottom + 1))
            cropped_img.save(output_path)
            print(f"Saved to {output_path}")
        else:
            print("Could not find non-black content or image is fully black.")
            img.save(output_path) # Fallback

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    crop_black_borders("/Users/sandywong/.gemini/antigravity/brain/a125db18-0dd0-42e5-9a7e-ba792795067f/uploaded_image_1765989354474.png", "client/public/assets/office_map.png")
