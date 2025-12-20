import os
import cv2
import numpy as np
from PIL import Image

# Config
INPUT_IMAGE = "/Users/sandywong/.gemini/antigravity/brain/4f2b7e34-794d-4137-ab9c-1c13bcaf7b4f/cloud_ai_tech_characters_1766073511009.png"
OUTPUT_DIR = "/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/ai_chars_highres"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_chars():
    print(f"Loading {INPUT_IMAGE}...")
    img = cv2.imread(INPUT_IMAGE)
    if img is None:
        print("Error: Could not load image")
        return

    # Convert to grayscale for detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to find non-white objects (Assume white background)
    # Background is white (255), so we want inverted threshold
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    print(f"Found {len(contours)} contours")
    
    # Filter valid characters (ignore small noise)
    valid_chars = []
    min_area = 2000 # 50x40 roughly
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w * h > min_area:
            valid_chars.append((x, y, w, h, cnt))
            
    print(f"Valid characters found: {len(valid_chars)}")
    
    # Sort by Y, then X (Row by Row)
    # Heuristic: Group by Row based on Y center
    # Sort by Y first
    valid_chars.sort(key=lambda b: b[1])
    
    # Group into rows
    rows = []
    if valid_chars:
        current_row = [valid_chars[0]]
        row_y_threshold = 50 # allowed Y variation for same row
        
        for i in range(1, len(valid_chars)):
            char = valid_chars[i]
            prev_char = current_row[-1]
            
            # Check if same row (Y difference is small)
            if abs(char[1] - prev_char[1]) < row_y_threshold:
                current_row.append(char)
            else:
                # New row, sort previous row by X and add
                current_row.sort(key=lambda b: b[0])
                rows.extend(current_row)
                current_row = [char]
        
        # Add last row
        current_row.sort(key=lambda b: b[0])
        rows.extend(current_row)
    
    final_chars = rows
    
    # Convert original to RGBA for transparent saving
    img_pil = Image.open(INPUT_IMAGE).convert("RGBA")
    img_arr = np.array(img_pil)
    
    # Extract and Save
    for i, (x, y, w, h, _) in enumerate(final_chars[:10]): # Limit to first 10
        print(f"Extracting Char {i+1}: {w}x{h} at ({x},{y})")
        
        # Crop with some padding?
        pad = 2
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)
        
        cropped = img_pil.crop((x1, y1, x2, y2))
        
        # Remove White Background (make transparent)
        data = np.array(cropped)
        # Mask: Check for white-ish pixels
        # Axis 2 is RGB. Check if R,G,B > 240
        r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        white_mask = (r > 240) & (g > 240) & (b > 240)
        data[white_mask] = [0, 0, 0, 0]
        
        final_char = Image.fromarray(data)
        
        save_path = os.path.join(OUTPUT_DIR, f"high_res_char_{i+1}.png")
        final_char.save(save_path)
        print(f"Saved {save_path}")

if __name__ == "__main__":
    process_chars()
