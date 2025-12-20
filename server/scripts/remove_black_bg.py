from PIL import Image
import numpy as np

input_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'
output_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'

img = Image.open(input_path).convert("RGBA")
data = np.array(img)

# Remove Black (or near black)
red, green, blue, alpha = data.T
# Filter out pixels that are very dark (e.g., < 20 intensity on all channels)
black_areas = (red < 30) & (green < 30) & (blue < 30)
data[...][black_areas.T] = (0, 0, 0, 0)

img = Image.fromarray(data)
img.save(output_path)
print(f"Removed black background from {output_path}")
