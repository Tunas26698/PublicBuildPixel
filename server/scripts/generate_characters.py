
import requests
import json
import os
import time

API_KEY = "7d01f3e4-30d6-479f-8fa7-c0a1c3e129cf"
URL = "https://api.pixellab.ai/v1/generate-image-pixflux"
# Use absolute path based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/generated_chars")

def generate_character(index):
    prompt_text = "cute chibi pixel art character, full body, game sprite, white background, fantasy style"
    
    payload = {
        "description": prompt_text,
        "image_size": {
          "width": 128,
          "height": 128
        }
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"Generating character {index}...")
    try:
        response = requests.post(URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Assuming the response contains a list of images or a single image url/base64
            # This part is speculative as I don't have the exact response format. 
            # Based on common APIs, it likely returns a URL or Base64.
            # Looking at search results, it might return a 'images' list.
            
            if 'images' in data and len(data['images']) > 0:
                image_data = data['images'][0]
                # If it's a URL
                if image_data.startswith('http'):
                    img_response = requests.get(image_data)
                    with open(f"{OUTPUT_DIR}/char_{index}.png", "wb") as f:
                        f.write(img_response.content)
                else:
                    # Assume base64
                    import base64
                    with open(f"{OUTPUT_DIR}/char_{index}.png", "wb") as f:
                        f.write(base64.b64decode(image_data))
                print(f"Character {index} saved.")
            else:
                 print(f"No image found in response: {data}")

        else:
            print(f"Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for i in range(1, 11):
        generate_character(i)
        time.sleep(1) # Be nice to the API
