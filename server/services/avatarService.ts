import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export class AvatarService {
    private openai: OpenAI | null;

    constructor() {
        // Initialize OpenAI
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            console.error("OPENAI_API_KEY is missing. Avatar generation will fail.");
            this.openai = null;
        }
    }

    async generateAvatarFromPhoto(photoPath?: string, userPrompt?: string): Promise<{ spriteUrl: string; frontUrl?: string; backUrl?: string; portraitUrl?: string }> {
        let generatedImagePath: string | null = null;
        let description = userPrompt || "A cute chibi pixel art character"; // Use userPrompt if provided

        const publicDir = path.join(__dirname, '../../client/public/assets/user_avatars');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

        // Base Filename: Use photo name OR timestamp for text-only
        const timestamp = Date.now();
        const cleanName = photoPath ? path.basename(photoPath) : `text_gen_${timestamp}.png`;

        // 1. Analyze Photo (Vision) - OpenAI GPT-4o (ONLY if photo exists AND no prompt provided)
        if (this.openai && photoPath && !userPrompt) {
            try {
                console.log("Analyzing photo with OpenAI Vision (GPT-4o)...");
                const imageBuffer = fs.readFileSync(photoPath);
                const base64Image = imageBuffer.toString('base64');

                const visionResponse = await this.openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Describe this person's visual appearance for a full-body pixel art character. \n1. **Ignore obstructions**: Ignore phones, hands blocking the face, or selfie angles. \n2. **Infer missing details**: If the hair/feet are cropped, assume a standard complete style matching the visible parts. \n3. **Focus on**: Gender, Full Hairstyle (color/cut), Clothing (guess the pants/shoes if not visible based on style), and key accessories. \n4. Keep it concise (e.g. 'Male, spiky black hair, white shirt, blue jeans, sneakers')." },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 100
                });

                if (visionResponse.choices[0].message.content) {
                    description = visionResponse.choices[0].message.content;
                    console.log("AI Description:", description);
                }
            } catch (error) {
                console.error("OpenAI Vision Error:", error);
            }
        }

        // 2. Generate Pixel Art - Pollinations.ai (Free)
        try {
            console.log("Generating pixel art with Pollinations.ai...");

            const basePrompt = `8-bit pixel art chibi character, top-down view, ${description}, RPG game sprite style, solid white background`;
            const seed = Math.floor(Math.random() * 1000000);

            const publicDir = path.join(__dirname, '../../client/public/assets/user_avatars');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            // A. Front View
            try {
                // "standing facing camera" combined with "top-down view" gives the standard RPG look
                const promptFront = `${basePrompt}, standing facing camera`;
                const urlFront = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptFront)}?width=128&height=128&seed=${seed}&nologo=true&model=flux`;
                console.log("Fetching Front:", urlFront);

                const resFront = await axios.get(urlFront, { responseType: 'arraybuffer' });
                if (resFront.data) {
                    const buffer = Buffer.from(resFront.data);
                    generatedImagePath = path.join(publicDir, `gen_${cleanName}_front.png`);
                    fs.writeFileSync(generatedImagePath, buffer);
                }
            } catch (e: any) { console.error("Front Generation Failed:", e.message); }

            // B. Back View
            try {
                const promptBack = `${basePrompt}, standing facing away, back of head`;
                const urlBack = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptBack)}?width=128&height=128&seed=${seed}&nologo=true&model=flux`;
                console.log("Fetching Back:", urlBack);

                const resBack = await axios.get(urlBack, { responseType: 'arraybuffer' });
                if (resBack.data) {
                    const buffer = Buffer.from(resBack.data);
                    const backPath = path.join(publicDir, `gen_${cleanName}_back.png`);
                    fs.writeFileSync(backPath, buffer);
                }
            } catch (e: any) { console.error("Back Generation Failed:", e.message); }

            // C. Portrait (1024x1024)
            // C. Portrait (1024x1024) -> Strategy: Gen Small (128x128) -> Upscale (1024x1024) Nearest Neighbor
            try {
                // Portrait Description: Head and Shoulders (Ensure Face is Visible)
                const promptPortrait = `8-bit pixel art portrait, ${description}, head and shoulders, simple retro game avatar, white background`;

                // Request SMALL image (128x128) to force blocked pixels
                const urlPortrait = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptPortrait)}?width=128&height=128&seed=${seed}&nologo=true&model=flux`;
                console.log("Fetching Portrait (Low Res):", urlPortrait);

                const resPortrait = await axios.get(urlPortrait, { responseType: 'arraybuffer' });
                if (resPortrait.data) {
                    const buffer = Buffer.from(resPortrait.data);

                    // Save RAW (128x128)
                    const rawPath = path.join(publicDir, `gen_${cleanName}_portrait_raw.png`);
                    fs.writeFileSync(rawPath, buffer);

                    // Upscale to 1024x1024 (Pixel Perfect)
                    const finalPath = path.join(publicDir, `gen_${cleanName}_portrait.png`); // The file the frontend expects
                    await this.runPythonUpscale(rawPath, finalPath);
                }
            } catch (e: any) { console.error("Portrait Generation Failed:", e.message); }

            console.log("Pollinations Generation Cycle Complete");

        } catch (err: any) {
            console.error("Pollinations Setup Error:", err.message);
        }

        // 3. Return result
        let outputUrl = "";
        let sheetUrl = "";
        let backUrl = "";
        let portraitUrl = "";

        if (generatedImagePath) {
            // Run Rigging (Now handles Front + Back stitching)
            const sheetPath = generatedImagePath.replace('_front.png', '_sheet.png');

            try {
                await this.runPythonRigging(generatedImagePath, sheetPath);

                // Construct URLs
                const baseUrl = `http://localhost:3000/assets/user_avatars`;
                const baseName = path.basename(generatedImagePath).replace('_front.png', '');

                outputUrl = `${baseUrl}/${baseName}_front.png`;
                sheetUrl = `${baseUrl}/${baseName}_sheet.png`;
                backUrl = `${baseUrl}/${baseName}_back.png`;

                // Portrait URL
                const portraitFileCheck = generatedImagePath.replace('_front.png', '_portrait.png');
                if (fs.existsSync(portraitFileCheck)) {
                    portraitUrl = `${baseUrl}/${baseName}_portrait.png`;
                }

            } catch (rigError) {
                console.error("Rigging failed:", rigError);
                // Fallback to just the front image
                outputUrl = `http://localhost:3000/assets/user_avatars/${path.basename(generatedImagePath)}`;
            }
        } else {
            throw new Error("Failed to generate base image from Pollinations (AI Service Down?)");
        }

        return {
            spriteUrl: sheetUrl || outputUrl,
            frontUrl: outputUrl,
            backUrl: backUrl,
            portraitUrl: portraitUrl
        };
    }

    private runPythonUpscale(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../scripts/upscale_portrait.py');
            const venvPython = path.join(__dirname, '../venv/bin/python3');
            const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

            console.log(`Running Python Upscale: ${pythonCmd} ${pythonScript} ...`);

            const process = spawn(pythonCmd, [pythonScript, inputPath, outputPath]);

            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Python upscale exited with code ${code}`));
            });
        });
    }

    private runPythonRigging(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../scripts/process_avatar_rig.py');
            const venvPython = path.join(__dirname, '../venv/bin/python3');
            const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

            console.log(`Running Python: ${pythonCmd} ${pythonScript} ${inputPath} ...`);

            const process = spawn(pythonCmd, [pythonScript, inputPath, outputPath]);

            process.stdout.on('data', (data) => {
                console.log(`Python: ${data}`);
            });

            process.stderr.on('data', (data) => {
                console.error(`Python Error: ${data}`);
            });

            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Python script exited with code ${code}`));
            });
        });
    }
}
