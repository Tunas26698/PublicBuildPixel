
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors' // Explicitly ignore cert errors
        ],
        ignoreHTTPSErrors: true // For self-signed certs on localhost:5173
    });

    const page = await browser.newPage();

    // Set viewport to a reasonable size
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating to app (Game View)...");
    try {
        await page.goto('https://localhost:5173/game', { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (e) {
        console.log("Navigation timeout or error, proceeding anyway (app might be SPA):", e.message);
    }

    console.log("Waiting for bots to settle (5s)...");
    await new Promise(r => setTimeout(r, 5000));

    const screenshotPath = path.join(__dirname, 'screenshot_bots.png');
    console.log(`Taking screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await browser.close();
    console.log("Done.");
})();
