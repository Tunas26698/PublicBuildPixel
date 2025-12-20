
import requests
import json
import os
import time

API_KEY = "7d01f3e4-30d6-479f-8fa7-c0a1c3e129cf"
URL = "https://api.pixellab.ai/v1/generate-image-pixflux"
OUTPUT_DIR = "client/public/assets/generated_chars" # Relative to indie-pixel-community

def generate_debug():
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
    
    print(f"Debug Generation...")
    print(f"URL: {URL}")
    
    try:
        response = requests.post(URL, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        try:
            data = response.json()
            # print(f"Response Body: {json.dumps(data, indent=2)}") 
            # Check keys
            print(f"Keys: {data.keys()}")
            
            if 'images' in data and len(data['images']) > 0:
                print("Image found in response.")
                image_data = data['images'][0]
                
                # Check output dir
                abs_output = os.path.abspath(OUTPUT_DIR)
                if not os.path.exists(abs_output):
                    os.makedirs(abs_output)
                
                print(f"Saving to: {abs_output}/debug_char.png")
                
                # Assume base64 or URL
                if image_data.startswith('http'):
                     print("Image is URL")
                     # img_response = requests.get(image_data) ...
                else:
                     print("Image is Base64 (assumed)")
                     import base64
                     with open(f"{abs_output}/debug_char.png", "wb") as f:
                        f.write(base64.b64decode(image_data))
                     print("Saved successfully.")
            else:
                 print("No 'images' key or empty list.")
                 print(data)

        except Exception as e:
            print(f"JSON Decode Error or other: {e}")
            print(f"Text: {response.text}")

    except Exception as e:
        print(f"Request Exception: {e}")

if __name__ == "__main__":
    generate_debug()
