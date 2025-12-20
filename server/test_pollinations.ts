
import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function run() {
    console.log("Testing Pollinations.ai (Free)...");

    const prompt = "pixel art game sprite of a cat, 128x128, white background";
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=128&height=128&seed=${seed}&nologo=true`;

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        fs.writeFileSync(path.join(__dirname, 'test_pollinations.png'), response.data);
        console.log("Success! Saved as test_pollinations.png");
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

run();
