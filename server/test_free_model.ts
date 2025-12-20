
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Testing Gemini 3 Image Preview...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return;
    }

    // Try `gemini-3-pro-image-preview` with generateContent
    // This model might output image bytes or blocks?
    // It's listed as having `generateContent`.

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            { text: "Generate a pixel art character sprite of a cat." }
                        ]
                    }
                ]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log("Status:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));
    } catch (err: any) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

run();
