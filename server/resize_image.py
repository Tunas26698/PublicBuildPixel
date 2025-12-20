
import sys
from PIL import Image

if len(sys.argv) < 3:
    print("Usage: python3 resize_image.py <input> <output>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

try:
    img = Image.open(input_path)
    # Resize to EXACT 128x128 to match API payload expectation for PixelLab
    img = img.resize((128, 128), Image.Resampling.LANCZOS)
    img.save(output_path, "PNG")
    print("Resized successfully")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
