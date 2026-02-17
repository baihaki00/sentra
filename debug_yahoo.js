const BrowserTools = require('./src/tools/BrowserTools');
const fs = require('fs');

async function test() {
    console.log('--- Debugging Yahoo ---');
    const tools = new BrowserTools();
    const page = await tools.ensureBrowser();

    const url = 'https://finance.yahoo.com/quote/AAPL';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Check for consent popup
    const content = await page.content();
    if (content.includes('consent') || content.includes('agree')) {
        console.log('POSSIBLE CONSENT POPUP DETECTED');
    }

    // Try to read the price
    try {
        const price = await page.$eval('#quote-header-info', el => el.innerText);
        console.log('PRICE FOUND:\n', price);
    } catch (e) {
        console.error('PRICE NOT FOUND:', e.message);
        // Take screenshot
        await page.screenshot({ path: 'debug_yahoo.png' });
        console.log('Screenshot saved to debug_yahoo.png');
    }
}

test();
