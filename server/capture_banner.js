
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log("Launching browser for banner capture...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors'
        ],
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // Set viewport to capture the banner comfortably
    await page.setViewport({ width: 1440, height: 900 });

    console.log("Navigating to Landing Page...");
    try {
        await page.goto('https://localhost:5173/', { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (e) {
        console.log("Navigation timeout or warning:", e.message);
    }

    console.log("Waiting for hero image...");
    // Wait for the hero image to be in the DOM
    await page.waitForSelector('img[alt="Virtual Office"]', { timeout: 10000 }).catch(e => console.log("Selector timeout, proceeding..."));

    // Wait a bit for manual settling
    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = path.join(__dirname, 'banner_recreated.png');
    console.log(`Taking screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await browser.close();
    console.log("Done.");
})();
