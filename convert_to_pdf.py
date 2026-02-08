from PIL import Image
import os

source_img_path = "/Users/sandywong/.gemini/antigravity/brain/9d30f11b-8a6d-4018-8675-47cf993a1a44/Toan_Profile_Card_v2.png"
dest_pdf_path = "/Users/sandywong/.gemini/antigravity/brain/9d30f11b-8a6d-4018-8675-47cf993a1a44/Toan_Profile_Card.pdf"

if os.path.exists(source_img_path):
    image = Image.open(source_img_path)
    # Convert to RGB if necessary (though usually fine, PDF standard prefers RGB over RGBA for simple docs)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    image.save(dest_pdf_path, "PDF", resolution=100.0)
    print(f"Successfully converted {source_img_path} to {dest_pdf_path}")
else:
    print(f"Error: Source image not found at {source_img_path}")
