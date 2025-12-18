from PIL import Image

def upscale_image(input_path, output_path, scale=2):
    print(f"Upscaling {input_path} by {scale}x...")
    try:
        img = Image.open(input_path).convert("RGB")
        w, h = img.size
        new_w = w * scale
        new_h = h * scale
        
        # Use LANCZOS for high quality downsampling/upscaling (smooths artifacts)
        # OR NEAREST if we want to preserve hard edges (but existing anti-aliasing makes this look bad).
        # Given the user complained about "mờ" (blur/unclear), and the source likely has mixed pixels,
        # LANCZOS might effectively "remaster" it slightly cleaner, or just make it smooth.
        # Let's try NEAREST first to see if it's just resolution? 
        # No, the screenshot shows "soft pixel art". 
        # Let's try RESAMPLING nicely.
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Optional: Sharpen?
        # from PIL import ImageEnhance
        # enhancer = ImageEnhance.Sharpness(img)
        # img = enhancer.enhance(1.5)

        img.save(output_path)
        print(f"Saved to {output_path} ({new_w}x{new_h})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    upscale_image("client/public/assets/office_map.png", "client/public/assets/office_map_hq.png", scale=2)
