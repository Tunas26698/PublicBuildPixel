
from PIL import Image
import colorsys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH = os.path.join(SCRIPT_DIR, "../client/public/assets/chibi_hero.png")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/processed_chars")

def generate_tinted():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"Loading {INPUT_PATH}...")
    try:
        img = Image.open(INPUT_PATH).convert("RGBA")
        data = img.getdata()
        
        # We will generate 10 variations
        for i in range(1, 11):
            print(f"Generating char_{i}...")
            newData = []
            
            # Hue shift amount (0.0 to 1.0)
            hue_shift = (i * 0.1) % 1.0
            
            for item in data:
                # item is (r, g, b, a)
                if item[3] == 0:
                    newData.append(item)
                    continue
                
                # Convert RGB to HSV
                r, g, b = item[0]/255.0, item[1]/255.0, item[2]/255.0
                h, s, v = colorsys.rgb_to_hsv(r, g, b)
                
                # Shift Hue
                h = (h + hue_shift) % 1.0
                
                # Convert back to RGB
                r, g, b = colorsys.hsv_to_rgb(h, s, v)
                
                newData.append((int(r*255), int(g*255), int(b*255), item[3]))
            
            new_img = Image.new("RGBA", img.size)
            new_img.putdata(newData)
            
            output_path = os.path.join(OUTPUT_DIR, f"char_{i}.png")
            new_img.save(output_path)
            print(f"Saved {output_path}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_tinted()
