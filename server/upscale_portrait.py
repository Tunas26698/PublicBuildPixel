
import sys
from PIL import Image

if len(sys.argv) < 3:
    print("Usage: python3 upscale_portrait.py <input> <output>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

try:
    img = Image.open(input_path)
    # Upscale to 1024x1024 using Nearest Neighbor to keep it blocky
    img = img.resize((1024, 1024), Image.Resampling.NEAREST)
    img.save(output_path, "PNG")
    print(f"Upscaled {input_path} to {output_path} (Nearest Neighbor)")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
