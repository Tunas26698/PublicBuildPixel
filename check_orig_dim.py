from PIL import Image
try:
    img = Image.open("/Users/sandywong/.gemini/antigravity/brain/a125db18-0dd0-42e5-9a7e-ba792795067f/uploaded_image_1765989354474.png")
    print(f"Original: {img.size}")
except:
    pass
