import os
import numpy as np
from PIL import Image

# Config
INPUT_DIR = "/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/ai_chars_highres"
OUTPUT_DIR = "/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/ai_chars_animated"

os.makedirs(OUTPUT_DIR, exist_ok=True)

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

def process():
    for i in range(1, 11):
        filename = f"high_res_char_{i}.png"
        path = os.path.join(INPUT_DIR, filename)
        
        if not os.path.exists(path):
            print(f"Skipping {filename}, not found")
            continue
            
        print(f"Processing {filename}...")
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        base_arr = np.array(img)
        
        # Rigging Parameters (Percentage based)
        leg_y = int(height * 0.85) # Bottom 15% is legs
        center_x = int(width * 0.5)
        
        # Scaling shift amount
        # Base shift 1px for 32px height -> 1/32 ~ 3%
        # For visible animation on high-res sprites, we need significant shift.
        # Bob: ~3% (approx 4px on 128px) 
        # Step: ~6% (approx 8px on 128px)
        bob_amount = max(2, int(height * 0.03)) 
        step_amount = max(4, int(height * 0.06))
        
        # Frame 1: Stand (Original)
        f1 = img
        
        # Frame 0: Walk Right
        # Body Bob Down
        f0_arr = np.zeros_like(base_arr)
        body_bobbed = shift_img_arr(base_arr, 0, bob_amount)
        
        # Body & Left Leg (Standing)
        f0_arr[:, :center_x] = body_bobbed[:, :center_x]
        f0_arr[:leg_y, center_x:] = body_bobbed[:leg_y, center_x:]
        
        # Right Leg Step (Up relative to Bob = Net 0, Out Right)
        # Shift original base arr OUT RIGHT, keep Y original (which is "Up" compared to bobbed body)
        right_leg_step = shift_img_arr(base_arr, step_amount, 0)
        f0_arr[leg_y:, center_x:] = right_leg_step[leg_y:, center_x:]
        
        f0 = Image.fromarray(f0_arr)
        
        # Frame 2: Walk Left
        f2_arr = np.zeros_like(base_arr)
        
        # Body & Right Leg (Standing)
        f2_arr[:, center_x:] = body_bobbed[:, center_x:]
        f2_arr[:leg_y, :center_x] = body_bobbed[:leg_y, :center_x]
        
        # Left Leg Step
        left_leg_step = shift_img_arr(base_arr, -step_amount, 0)
        f2_arr[leg_y:, :center_x] = left_leg_step[leg_y:, :center_x]
        
        f2 = Image.fromarray(f2_arr)
        
        # Stitch
        # Resize to standard height? Or keep original size.
        # Original size is fine, Phaser scales it.
        # But wait, Phaser scaling is based on "scale: 2.2" which assumes 32x32 base.
        # If I load a 300x300 image and scale 2.2, it will be HUGE (660px).
        # I MUST resize these back to ~48px (or 32px?) to keep the scale consistent?
        # OR I adjust the scale in Bot.ts.
        # The user wants "High Res". Scaling down to 32px destroys the detail!
        # So I should keep high res (e.g. 150px height) and scale to 0.5?
        # Target in-game size is ~80px height.
        # If generated image is ~300px height.
        # Scale should be 80/300 = 0.26.
        
        # Let's resize safely to a standardized height (e.g. 64px or 96px?) to retain detail but not be massive texture.
        # Main char is 901x471? No, the SHEET is 901x471.
        # Main char frame height is 471 / 1 = 471? No.
        # Let's recheck main char dimensions.
        # "Size: (901, 471)" for chib_hero.png.
        # If it has 3 frames, width per frame is 901/3 = 300.
        # So Main char is ~300x471.
        # And in game it is displayed at what scale?
        # In Player.ts (or wherever), scale is usually 1?
        # If my bots are 300px high and scale 2.2, they are 660px. Too big.
        # I should resize the OUTPUT spritesheet to match reasonable dimensions or adjust Bot.ts scale.
        
        # Better: Resize the individual frames to ~64x64 (Double resolution of original 32x32)
        # Or ~100x100.
        # Let's standardise to height=128px (4x the original 32px).
        # This keeps good detail.
        
        # Standardize size to 96x128 (Aspect ratio ~3:4 is good for tall chars)
        target_w = 96
        target_h = 128
        
        # Resize preserving aspect ratio to fit within target_w x target_h
        img_ratio = width / height
        target_ratio = target_w / target_h
        
        if img_ratio > target_ratio:
            # Too wide, fit to width
            new_w = target_w
            new_h = int(new_w / img_ratio)
        else:
            # Too tall, fit to height
            new_h = target_h
            new_w = int(new_h * img_ratio)
            
        f0 = f0.resize((new_w, new_h), Image.BICUBIC)
        f1 = f1.resize((new_w, new_h), Image.BICUBIC)
        f2 = f2.resize((new_w, new_h), Image.BICUBIC)
        
        # Helper to center paste
        def center_paste(src, w, h):
            bg = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            offset_x = (w - src.width) // 2
            offset_y = (h - src.height) // 2
            bg.paste(src, (offset_x, offset_y))
            return bg
            
        f0 = center_paste(f0, target_w, target_h)
        f1 = center_paste(f1, target_w, target_h)
        f2 = center_paste(f2, target_w, target_h)
        
        # Sharpen
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Sharpness(f0)
        f0 = enhancer.enhance(1.5)
        enhancer = ImageEnhance.Sharpness(f1)
        f1 = enhancer.enhance(1.5)
        enhancer = ImageEnhance.Sharpness(f2)
        f2 = enhancer.enhance(1.5)
        
        frame_images = [f0, f1, f2]
        
        sheet_width = target_w * 3
        sheet_height = target_h
        spritesheet = Image.new("RGBA", (sheet_width, sheet_height))
        
        for idx, frame in enumerate(frame_images):
            spritesheet.paste(frame, (idx * target_w, 0))
            
        save_path = os.path.join(OUTPUT_DIR, f"ai_char_{i}.png")
        spritesheet.save(save_path)
        print(f"Saved {save_path} (Size: {sheet_width}x{sheet_height})")

if __name__ == "__main__":
    process()
