from PIL import Image
import numpy as np

input_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'
output_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'

img = Image.open(input_path)
# Resize to match roughly width of chibi_hero frames (300).
# Original chibi_hero frames are 300x471. 
# Generated image is likely 1024x1024 or similar aspect.
# Let's resize height to 471 and maintain aspect ratio?
# Or just force 300x471 to match? 
# The generated image is square pixel art.
# Let's resize it to 300x300 and center it in a 300x471 canvas?
# Or just resize to 300x471 (might stretch).
# Let's try 300x471 direct resize for now, as chibi style is elongated.
img = img.resize((300, 471), Image.NEAREST)

# Convert to RGBA
img = img.convert("RGBA")
data = np.array(img)

# Remove white background
red, green, blue, alpha = data.T
white_areas = (red > 240) & (green > 240) & (blue > 240)
data[...][white_areas.T] = (0, 0, 0, 0)

img = Image.fromarray(data)
img.save(output_path)
print(f"Saved processed back view to {output_path}")
