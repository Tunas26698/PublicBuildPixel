from PIL import Image
import numpy as np

img_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'
img = Image.open(img_path)
data = np.array(img)

# Check top-left pixel
top_left = data[0, 0]
print(f"Top Left Pixel: {top_left}")

# Check top-right pixel
top_right = data[0, -1]
print(f"Top Right Pixel: {top_right}")
