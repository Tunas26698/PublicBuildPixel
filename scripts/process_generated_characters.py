from PIL import Image
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/generated_chars")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/processed_chars")

def process_characters():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for i in range(1, 11):
        filename = f"char_{i}.png"
        input_path = os.path.join(INPUT_DIR, filename)
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        if not os.path.exists(input_path):
            print(f"File not found: {input_path}")
            continue
            
        try:
            img = Image.open(input_path).convert("RGBA")
            datas = img.getdata()
            
            newData = []
            # White background removal
            # r > 240, g > 240, b > 240
            for item in datas:
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            
            img.putdata(newData)
            
            # Optional: Crop to content
            bbox = img.getbbox()
            if bbox:
                img = img.crop(bbox)
            
            img.save(output_path)
            print(f"Processed {filename}")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    process_characters()
