from PIL import Image
import numpy as np

input_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chair.png'
output_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chair.png'

img = Image.open(input_path)
img = img.resize((32, 32), Image.NEAREST) # Nearest neighbor for pixel art

# Convert to RGBA
img = img.convert("RGBA")
data = np.array(img)

# Assuming white background [255, 255, 255]
red, green, blue, alpha = data.T
white_areas = (red > 240) & (green > 240) & (blue > 240)
data[...][white_areas.T] = (0, 0, 0, 0)

img = Image.fromarray(data)
img.save(output_path)
print(f"Saved resized transparent chair to {output_path}")
