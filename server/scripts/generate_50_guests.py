from PIL import Image
import colorsys
import os
import random

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/ai_chars_animated")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/guest_avatars")

def generate_guests():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"Generating 50 guests from {INPUT_DIR}...")
    
    # Verify sources exist
    sources = []
    for i in range(1, 11):
        p = os.path.join(INPUT_DIR, f"ai_char_{i}.png")
        if os.path.exists(p):
            sources.append(p)
    
    if not sources:
        print("No source images found!")
        return

    for i in range(1, 51):
        # Pick source in round-robin or random
        src_path = sources[(i - 1) % len(sources)]
        
        try:
            img = Image.open(src_path).convert("RGBA")
            data = img.getdata()
            
            # Hue shift: distinct for each of the 50
            # i=1..50. Shift = (i * 0.13) to be pseudo random looking
            hue_shift = (i * 0.137) % 1.0
            
            newData = []
            for item in data:
                # item is (r, g, b, a)
                if item[3] == 0:
                    newData.append(item)
                    continue
                
                # Check for white/grey (don't shift them too much or it looks weird?)
                # Actually tinting everything is usually fine for pixel art style
                
                r, g, b = item[0]/255.0, item[1]/255.0, item[2]/255.0
                h, s, v = colorsys.rgb_to_hsv(r, g, b)
                
                # Shift Hue
                h = (h + hue_shift) % 1.0
                
                # Convert back
                r, g, b = colorsys.hsv_to_rgb(h, s, v)
                newData.append((int(r*255), int(g*255), int(b*255), item[3]))
            
            new_img = Image.new("RGBA", img.size)
            new_img.putdata(newData)
            
            out_name = f"guest_{i}.png"
            new_img.save(os.path.join(OUTPUT_DIR, out_name))
            if i % 10 == 0:
                print(f"Generated {i}/50...")
                
        except Exception as e:
            print(f"Error gen guest {i}: {e}")

if __name__ == "__main__":
    generate_guests()
