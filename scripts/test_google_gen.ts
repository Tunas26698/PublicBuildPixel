import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Google Imagen 3 with Key:", apiKey ? "FOUND" : "MISSING");

    if (!apiKey) return;

    // Correct Endpoint for Imagen on Google AI Studio?
    // Often it is: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
    // Or similar. Let's try the modern REST one.

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const payload = {
        instances: [
            { prompt: "8-bit pixel art chibi character, top-down view, game sprite style, solid white background" }
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
        console.log("Response Data:", JSON.stringify(res.data).substring(0, 200));

        if (res.data.predictions && res.data.predictions[0]) {
            const b64 = res.data.predictions[0].bytesBase64Encoded;
            fs.writeFileSync('test_google.png', Buffer.from(b64, 'base64'));
            console.log("Saved test_google.png");
        }
    } catch (e: any) {
        console.error("Error:", e.response ? e.response.data : e.message);

        // Try fallback URL if that fails?
    }
}

run();
