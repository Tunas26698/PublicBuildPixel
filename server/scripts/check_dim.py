from PIL import Image

def check_img(path):
    try:
        img = Image.open(path)
        print(f"{path}: {img.size} mode={img.mode}")
    except Exception as e:
        print(f"Error opening {path}: {e}")

check_img("client/public/assets/office_map.png")
