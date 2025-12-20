import cv2

img_path = '/Users/sandywong/.gemini/antigravity/scratch/indie-pixel-community/client/public/assets/chibi_hero.png'
img = cv2.imread(img_path)
if img is not None:
    print(f"Dimensions: {img.shape}")
    height, width, channels = img.shape
    print(f"Width: {width}, Height: {height}")
else:
    print("Failed to load image")
