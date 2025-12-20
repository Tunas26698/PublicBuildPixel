from PIL import Image
import os
import math

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/guest_avatars")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "guest_mosaic.png")

def create_mosaic():
    images = []
    # Load 50 images
    for i in range(1, 51):
        path = os.path.join(INPUT_DIR, f"guest_{i}.png")
        if os.path.exists(path):
            img = Image.open(path).convert("RGBA")
            # Crop just the first frame (96x128) if it is a sprite sheet?
            # Existing bots are 288x128 (3 frames).
            # We want the middle frame (idle/standing) or first frame?
            # Let's take the first frame (0,0,96,128)
            frame = img.crop((0, 0, 96, 128))
            images.append(frame)
    
    if not images:
        print("No images found")
        return

    # Grid size
    count = len(images)
    cols = 10
    rows = math.ceil(count / cols)
    
    w, h = images[0].size
    mosaic = Image.new("RGBA", (cols * w, rows * h), (50, 50, 50, 255)) # Dark gray bg
    
    for idx, img in enumerate(images):
        r = idx // cols
        c = idx % cols
        mosaic.paste(img, (c * w, r * h), img)
        
    mosaic.save(OUTPUT_PATH)
    print(f"Saved mosaic to {OUTPUT_PATH}")

if __name__ == "__main__":
    create_mosaic()
