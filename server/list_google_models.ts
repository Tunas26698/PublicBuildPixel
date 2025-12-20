import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Listing models with Key:", apiKey ? "FOUND" : "MISSING");
    if (!apiKey) return;

    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("Models:", JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
run();
