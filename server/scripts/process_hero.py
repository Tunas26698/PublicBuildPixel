import os
import numpy as np
from PIL import Image

# Config
INPUT_PATH = "/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero.png"
OUTPUT_PATH = "/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero_rigged.png"

def shift_img_arr(arr, x_shift, y_shift):
    new_arr = np.zeros_like(arr)
    if y_shift > 0:
        new_arr[y_shift:, :] = arr[:-y_shift, :]
    elif y_shift < 0:
         new_arr[:y_shift, :] = arr[-y_shift:, :]
    else:
        new_arr = arr.copy()
    
    final_arr = np.zeros_like(new_arr)
    if x_shift > 0:
        final_arr[:, x_shift:] = new_arr[:, :-x_shift]
    elif x_shift < 0:
        final_arr[:, :x_shift] = new_arr[:, -x_shift:]
    else:
        final_arr = new_arr.copy()
    return final_arr

def process_hero():
    print(f"Loading {INPUT_PATH}...")
    img = Image.open(INPUT_PATH).convert("RGBA")
    
    # Original is 901x471, 3 frames.
    # Frame width ~300.
    total_w, height = img.size
    frame_w = total_w // 3
    
    print(f"Total size: {total_w}x{height}. Frame width: {frame_w}")
    
    # Extract Middle Frame (Frame 1) as Base "Stand"
    # Frame 0: 0-300
    # Frame 1: 300-600
    # Frame 2: 600-900
    # NOTE: Assuming Frame 1 is the best "Stand" pose. 
    # Usually in 3-frame generated sheets: 0=Step, 1=Stand, 2=Step.
    # But for previous manual generation, it might be different.
    # Let's crop the middle third.
    
    base_img = img.crop((frame_w, 0, frame_w * 2, height))
    
    width = base_img.width
    base_arr = np.array(base_img)
    
    # Rigging Parameters (Same logic as bots, scaled to hero size)
    # Bots: 128px height, 3% bob, 6% step.
    # Hero: 471px height.
    
    leg_y = int(height * 0.85) # Legs are bottom 15%
    center_x = int(width * 0.5)
    
    bob_amount = max(2, int(height * 0.03)) # 3%
    step_amount = max(4, int(height * 0.06)) # 6%
    
    print(f"Rigging: LegY={leg_y}, Bob={bob_amount}, Step={step_amount}")
    
    # Frame 1: Stand (Base)
    f1 = base_img
    
    # Frame 0: Walk Right
    f0_arr = np.zeros_like(base_arr)
    body_bobbed = shift_img_arr(base_arr, 0, bob_amount)
    
    # Body & Left Leg (Standing) - Left of center
    f0_arr[:, :center_x] = body_bobbed[:, :center_x]
    f0_arr[:leg_y, center_x:] = body_bobbed[:leg_y, center_x:]
    
    # Right Leg Step (Up relative to Bob, Out Right)
    right_leg_step = shift_img_arr(base_arr, step_amount, 0)
    f0_arr[leg_y:, center_x:] = right_leg_step[leg_y:, center_x:]
    
    f0 = Image.fromarray(f0_arr)
    
    # Frame 2: Walk Left
    f2_arr = np.zeros_like(base_arr)
    
    # Body & Right Leg (Standing) - Right of center
    f2_arr[:, center_x:] = body_bobbed[:, center_x:]
    f2_arr[:leg_y, :center_x] = body_bobbed[:leg_y, :center_x]
    
    # Left Leg Step
    left_leg_step = shift_img_arr(base_arr, -step_amount, 0)
    f2_arr[leg_y:, :center_x] = left_leg_step[leg_y:, :center_x]
    
    f2 = Image.fromarray(f2_arr)
    
    # Stitch (0, 1, 2)
    frame_images = [f0, f1, f2]
    
    sheet_width = width * 3
    sheet_height = height
    spritesheet = Image.new("RGBA", (sheet_width, sheet_height))
    
    for idx, frame in enumerate(frame_images):
        spritesheet.paste(frame, (idx * width, 0))
        
    spritesheet.save(OUTPUT_PATH)
    print(f"Saved {OUTPUT_PATH} (Size: {sheet_width}x{sheet_height})")

if __name__ == "__main__":
    process_hero()
