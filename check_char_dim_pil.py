from PIL import Image
import os

img_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero.png'
if os.path.exists(img_path):
    with Image.open(img_path) as img:
        print(f"Format: {img.format}")
        print(f"Size: {img.size}")
        print(f"Mode: {img.mode}")
else:
    print("File not found")
