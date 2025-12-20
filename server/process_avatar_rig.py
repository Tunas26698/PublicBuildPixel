import sys
import os
import numpy as np
from PIL import Image

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

def center_paste(src, w, h):
    src_resized = src.resize((96, 96), Image.NEAREST)
    
    bg = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    offset_x = (w - src_resized.width) // 2
    offset_y = (h - src_resized.height) // 2
    bg.paste(src_resized, (offset_x, offset_y))
    return bg, src_resized

def process_image(img_path, target_w=96, target_h=128):
    if not os.path.exists(img_path):
        return None
    try:
        img = Image.open(img_path).convert("RGBA")
        
        # Remove Background using Flood Fill from corners
        # This prevents removing white clothes/eyes
        # 1. Add a white border to ensure connectivity
        bg = Image.new('RGBA', (img.width + 2, img.height + 2), (255, 255, 255, 255))
        bg.paste(img, (1, 1))
        
        # 2. Flood fill from (0,0) with transparency
        from PIL import ImageDraw
        ImageDraw.floodfill(bg, (0, 0), (0, 0, 0, 0), thresh=20) # Tolerance for compression artifacts
        
        # 3. Crop back to original size
        img = bg.crop((1, 1, bg.width - 1, bg.height - 1))
        
        # Center
        centered, _ = center_paste(img, target_w, target_h)
        return centered
    except Exception as e:
        print(f"Error processing {img_path}: {e}")
        return None

def main(input_path, output_path):
    print(f"Rigging {input_path} -> {output_path}")
    
    base_dir = os.path.dirname(input_path)
    filename = os.path.basename(input_path)
    base_name = filename.replace('_front.png', '')
    
    front_path = input_path
    back_path = os.path.join(base_dir, f"{base_name}_back.png")
    
    target_w = 96
    target_h = 128
    
    # 1. Process Front (Stand)
    f1 = process_image(front_path, target_w, target_h)
    if not f1:
        print("Failed to process front image")
        sys.exit(1)
        
    # 2. Process Back (Stand)
    back_img = process_image(back_path, target_w, target_h)
    if back_img:
        back_out = os.path.join(base_dir, f"{base_name}_back.png")
        back_img.save(back_out)
        print(f"Saved {back_out}")
    
    # 3. Generate Walk Cycle (Rigging with Leg Steps)
    base_arr = np.array(f1)
    
    leg_y = int(target_h * 0.65) # Legs start around Y=65% typically for chibi
    center_x = int(target_w * 0.5)
    
    bob_amount = 2
    step_lift = 4
    
    def get_leg_step(arr, is_left, lift):
        res = arr.copy()
        
        # Define Leg ROI
        roi_y_start = leg_y
        roi_x_start = 0 if is_left else center_x
        roi_x_end = center_x if is_left else target_w
        
        # Extract and Lift Leg
        leg_region = arr[roi_y_start:, roi_x_start:roi_x_end]
        leg_lifted = shift_img_arr(leg_region, 0, -lift)
        
        # Place back
        res[roi_y_start:, roi_x_start:roi_x_end] = leg_lifted
        
        # Entire body bob UP for bounce
        res = shift_img_arr(res, 0, -bob_amount)
        return res

    # Frame 0: Left Leg Step
    f0_arr = get_leg_step(base_arr, True, step_lift)
    f0 = Image.fromarray(f0_arr)
    
    # Frame 2: Right Leg Step
    f2_arr = get_leg_step(base_arr, False, step_lift)
    f2 = Image.fromarray(f2_arr)
    
    # Save Frames
    f0.save(os.path.join(base_dir, f"{base_name}_walk1.png"))
    f1.save(os.path.join(base_dir, f"{base_name}_walk2.png"))
    f2.save(os.path.join(base_dir, f"{base_name}_walk3.png"))
    
    # Left/Right (Simulated)
    # Left View: Flip the Left Step Frame horizontally? Or just simple flip of Stand?
    # Usually "Side View" is complex to fake. 
    # For now, let's just use F0 (Left Step) flipped as "Left Walk"? 
    # Or just flip the Stand frame.
    left_img = f1.transpose(Image.FLIP_LEFT_RIGHT) # Stand Flipped
    left_img.save(os.path.join(base_dir, f"{base_name}_left.png"))
    
    f1.save(os.path.join(base_dir, f"{base_name}_right.png")) # Stand Right
    
    # 4. Create Sprite Sheet
    # Walk1, Stand, Walk2 (0, 1, 2)
    sheet = Image.new("RGBA", (target_w * 3, target_h))
    sheet.paste(f0, (0, 0))
    sheet.paste(f1, (target_w, 0))
    sheet.paste(f2, (target_w * 2, 0))
    
    sheet.save(output_path)
    print(f"Saved Sprite Sheet: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_avatar_rig.py <input_path> <output_path>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
