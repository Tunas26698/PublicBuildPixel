import os
import requests
import base64
import time

# Configuration
# You need to enable billing or have quota for 'gemini-3-pro-image-preview'
MODEL_NAME = "models/gemini-3-pro-image-preview"

# Try to find .env file to load API Key
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, "../server/.env")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../client/public/assets/generated_chars_gemini")

def get_api_key():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    api_key = line.strip().split("=")[1]
                    break
    return api_key

def generate_image(prompt, output_filename):
    api_key = get_api_key()
    if not api_key:
        print("Error: GEMINI_API_KEY not found.")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/{MODEL_NAME}:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }

    print(f"Generating: {prompt[:50]}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                for part in parts:
                    if "inlineData" in part:
                        mime_type = part["inlineData"]["mimeType"]
                        b64_data = part["inlineData"]["data"]
                        
                        # Save image
                        if not os.path.exists(OUTPUT_DIR):
                            os.makedirs(OUTPUT_DIR)
                            
                        out_path = os.path.join(OUTPUT_DIR, output_filename)
                        with open(out_path, "wb") as f:
                            f.write(base64.b64decode(b64_data))
                        print(f"Success! Saved to {out_path}")
                        return True
            print("No image data found in response.")
            print(data)
        else:
            print(f"Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")
        
    return False

if __name__ == "__main__":
    # Attempt to generate a spritesheet
    # We ask for a grid or strip that contains the animation frames
    prompt = "A high quality pixel art spritesheet of a single chibi character walking. The image should contain EXACTLY 3 frames arranged horizontally. Frame 1: Idle/Standing. Frame 2: Left leg stepping forward. Frame 3: Right leg stepping forward. The character is wearing modern streetwear (hoodie, headphones). White background. The style must match the previous 'PublicBuild Style' (cute, big head). Total image aspect ratio 3:1 (wide)."
    generate_image(prompt, "test_spritesheet_attempt.png")
