from PIL import Image
import numpy as np

input_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'
output_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_back.png'

img = Image.open(input_path)
# Resize to match roughly width of chibi_hero frames (300).
# Let's target 300x471 to match consistent chibi size.
img = img.resize((300, 471), Image.NEAREST)

# Convert to RGBA
img = img.convert("RGBA")
data = np.array(img)

# Remove background
# Background is likely pure black (0,0,0) or white (255,255,255) from the new generation.
# Prompt said "Solid white background".
# Let's remove white AND black just in case, but verify first.
# Actually, let's aggressively remove anything "near white".
red, green, blue, alpha = data.T
white_areas = (red > 200) & (green > 200) & (blue > 200)
data[...][white_areas.T] = (0, 0, 0, 0)

# If there is also black background (some models do this at edges), handle it?
# Let's stick to white removal first as per prompt.

img = Image.fromarray(data)
img.save(output_path)
print(f"Saved processed back view to {output_path}")
