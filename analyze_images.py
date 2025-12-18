from PIL import Image
import os

files = ['character_spritesheet.png', 'character_spritesheet_final.png', 'chibi_hero.png']
base_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets'

for f in files:
    p = os.path.join(base_path, f)
    if os.path.exists(p):
        img = Image.open(p)
        print(f"File: {f}, Size: {img.size}, Mode: {img.mode}")
