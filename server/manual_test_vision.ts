
import { AvatarService } from './services/avatarService';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Starting manual verification (Imagen 3)...");

    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is missing from .env");
        // We'll proceed to fail, but it's good to know.
    }

    const service = new AvatarService();

    // Use an existing test image
    const inputPath = path.join(__dirname, '../client/public/assets/ai_chars/gen_ai_char_1.png');

    if (!fs.existsSync(inputPath)) {
        console.error("Input file not found:", inputPath);
        process.exit(1);
    }

    try {
        const result = await service.generateAvatarFromPhoto(inputPath, undefined);
        console.log("Result:", result);
    } catch (error) {
        console.error("Caught Error:", error);
    }
}

run();
