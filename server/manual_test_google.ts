import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Google Imagen 3 with Key:", apiKey ? "FOUND" : "MISSING");

    if (!apiKey) return;

    // Correct Endpoint for standard Gemini API (if referring to Imagen logic)
    // Actually, image generation is NOT supported on the public `generativelanguage` API for broad access yet in all regions.
    // It is `models/imagen-3.0-generate-001` but access is restricted or Whitelisted.
    // Let's try the endpoint anyway.

    // Found "models/imagen-4.0-fast-generate-001" in the list!
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;

    const payload = {
        instances: [
            { prompt: "8-bit pixel art chibi character, top-down view, game sprite style, solid white background, cute male anime character, blue hoodie" }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "1:1"
        }
    };

    try {
        console.log("Sending request to:", url);
        const res = await axios.post(url, payload);
        console.log("Response Status:", res.status);

        if (res.data.predictions && res.data.predictions[0]) {
            const b64 = res.data.predictions[0].bytesBase64Encoded;
            fs.writeFileSync('test_google.png', Buffer.from(b64, 'base64'));
            console.log("Saved test_google.png");
        } else {
            console.log("Unexpected response format:", JSON.stringify(res.data));
        }
    } catch (e: any) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

run();
