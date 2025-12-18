from PIL import Image
import os

def process_chibi():
    input_path = "text_chibi_raw.png"
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        # Green screen removal (approximate green #00FF00)
        # Increase tolerance. Green is (0, 255, 0).
        # We want to remove anything that is mostly green.
        # r < 120, g > 100, b < 120
        for item in datas:
            # Check for green-ish
            if item[1] > 100 and item[0] < 120 and item[2] < 120:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        
        # Crop to content?
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        print(f"Processed Chibi Size: {img.size}")
        img.save("client/public/assets/chibi_hero.png")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_chibi()
