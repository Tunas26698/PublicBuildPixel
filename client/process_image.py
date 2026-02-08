from PIL import Image
import os

# Input path (new colorful image)
input_path = '/Users/sandywong/.gemini/antigravity/brain/764cd211-1988-41cf-b57e-58eb8375151f/public_pixel_hero_8bit_chibi_color_1770546545864.png'
# Output path 
output_path = '/Users/sandywong/.gemini/antigravity/scratch/PublicPixel/client/src/assets/public_pixel_hero_8bit_chibi_color_16_9.png'

print(f"Opening input image: {input_path}")
try:
    img = Image.open(input_path)
    print(f"Original size: {img.size}")
    
    # Target 16:9 ratio
    # If 640 width, height should be 360
    target_width = 640
    target_height = 360
    
    # Center crop
    left = 0
    top = (640 - target_height) // 2
    right = 640
    bottom = top + target_height
    
    print(f"Cropping to: {target_width}x{target_height} at ({left}, {top}, {right}, {bottom})")
    cropped_img = img.crop((left, top, right, bottom))
    
    # Upscale to 1280x720 (HD) using Nearest Neighbor
    upscale_width = 1280
    upscale_height = 720
    print(f"Upscaling to: {upscale_width}x{upscale_height} (Nearest Neighbor)")
    
    final_img = cropped_img.resize((upscale_width, upscale_height), resample=Image.NEAREST)
    
    # Save
    final_img.save(output_path)
    print(f"Image processed and saved to {output_path}")

except Exception as e:
    print(f"Error processing image: {e}")
