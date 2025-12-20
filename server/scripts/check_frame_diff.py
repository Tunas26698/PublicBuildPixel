
from PIL import Image
import numpy as np
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_PATH = os.path.join(SCRIPT_DIR, "client/public/assets/ai_chars_animated/ai_char_1.png")

def check_diff():
    try:
        img = Image.open(IMG_PATH)
        print(f"Image size: {img.size}")
        
        # Assuming 32x32 frames, 128 width total
        frame_width = 32
        frames = []
        for i in range(4):
            frame = img.crop((i*frame_width, 0, (i+1)*frame_width, 32))
            frames.append(np.array(frame))
            
        # Compare frame 0 and frame 1
        diff01 = np.mean(np.abs(frames[0] - frames[1]))
        diff02 = np.mean(np.abs(frames[0] - frames[2]))
        
        print(f"Mean pixel difference between Frame 0 and Frame 1: {diff01}")
        print(f"Mean pixel difference between Frame 0 and Frame 2: {diff02}")
        
        if diff01 < 1.0:
            print("WARNING: Frames are extremely similar!")
        else:
            print("Frames have visible differences.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_diff()
