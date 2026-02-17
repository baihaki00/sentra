const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

/**
 * Browser Tools
 * Provides web automation capabilities.
 */
class BrowserTools {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async ensureBrowser() {
        if (!this.browser) {
            console.log('[BrowserTools] Launching stealth browser...');
            this.browser = await puppeteer.launch({
                headless: 'shell',  // Fast headless mode (no GPU compositing)
                defaultViewport: { width: 1280, height: 720 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-sync',
                    '--no-first-run',
                ]
            });
            const pages = await this.browser.pages();
            this.page = pages[0];
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        }
        return this.page;
    }

    async browser_open({ url }) {
        try {
            const page = await this.ensureBrowser();
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            return `Opened ${url}`;
        } catch (error) {
            return `Error opening URL: ${error.message}`;
        }
    }

    async browser_click({ selector }) {
        try {
            const page = await this.ensureBrowser();
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            return `Clicked ${selector}`;
        } catch (error) {
            return `Error clicking selector: ${error.message}`;
        }
    }

    async browser_type({ selector, text }) {
        try {
            const page = await this.ensureBrowser();
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.type(selector, text);

            // Verify by reading the value
            const value = await page.$eval(selector, el => el.value);
            return `Typed "${text}" into ${selector}. Current value: "${value}".`;
        } catch (error) {
            return `Error typing text: ${error.message}`;
        }
    }

    async browser_read() {
        try {
            const page = await this.ensureBrowser();
            // Smart extraction: prefer main/article content over full DOM
            const content = await page.evaluate(() => {
                const main = document.querySelector('main')
                    || document.querySelector('article')
                    || document.querySelector('[role="main"]')
                    || document.querySelector('.content')
                    || document.querySelector('#content');
                return (main || document.body).innerText;
            });
            return content.length > 6000
                ? content.substring(0, 6000) + '\n... (truncated)'
                : content;
        } catch (error) {
            return `Error reading content: ${error.message}`;
        }
    }

    async browser_press_key({ key }) {
        try {
            const page = await this.ensureBrowser();
            await page.keyboard.press(key);
            return `Pressed key: ${key}`;
        } catch (error) {
            return `Error pressing key: ${error.message}`;
        }
    }

    async google_search({ query }) {
        try {
            const page = await this.ensureBrowser();

            console.log('[BrowserTools] Navigating to DuckDuckGo...');
            await page.goto('https://duckduckgo.com/?q=' + encodeURIComponent(query), { waitUntil: 'networkidle2' });

            // DuckDuckGo selectors are stable
            await page.waitForSelector('.react-results--main', { timeout: 5000 }).catch(() => { });

            console.log(`[BrowserTools] Parsing DDG results for "${query}"...`);

            // Extract results using DuckDuckGo classes
            const results = await page.evaluate(() => {
                const results = [];

                // 1. Instant Answer / Knowledge Graph
                // Try multiple selectors for the "Zero Click Info" (ZCI)
                const zci = document.querySelector('.zci__def__content') // General definition
                    || document.querySelector('.module--finance')  // Stock widget
                    || document.querySelector('.module__content')  // General widget
                    || document.querySelector('.js-about-item-abstr'); // Wikipedia abstract

                if (zci) {
                    results.push(`INSTANT ANSWER:\n${zci.innerText}\n\n`);
                }

                // 2. Organic Results - Try multiple strategies
                let items = document.querySelectorAll('article'); // Modern DDG
                if (items.length === 0) {
                    items = document.querySelectorAll('.result:not(.result--ad)'); // Classic DDG
                }
                if (items.length === 0) {
                    items = document.querySelectorAll('[data-testid="result"]'); // Mobile/React DDG
                }

                items.forEach((item, index) => {
                    if (index >= 5) return;

                    // Try to find title/link
                    const titleEl = item.querySelector('h2 a') || item.querySelector('.result__title a') || item.querySelector('a');
                    const snippetEl = item.querySelector('.result__snippet') || item.querySelector('.Ogdw72') || item.querySelector('.kY2IgD');

                    if (titleEl) {
                        const title = titleEl.innerText;
                        const link = titleEl.href;

                        // STRICT AD FILTERING
                        // 1. Check class names
                        const isAdClass = item.classList.contains('result--ad');
                        // 2. Check URL for ad tracking patterns
                        const isAdLink = link.includes('ad_domain') || link.includes('/y.js') || link.includes('click_metadata');
                        // 3. Check for "Ad" badge text
                        const hasAdBadge = item.innerText.includes('Ad') && item.innerText.length < 200;

                        if (!isAdClass && !isAdLink && !hasAdBadge) {
                            const snippet = snippetEl ? snippetEl.innerText : '';
                            results.push(`Title: ${title}\nLink: ${link}\nSnippet: ${snippet}\n`);
                        }
                    }
                });

                return results.join('\n');
            });

            if (!results || results.trim().length === 0) {
                return "No results found.";
            }

            return `Search Results for "${query}":\n\n${results}`;
        } catch (error) {
            return `Error performing search: ${error.message}`;
        }
    }

    async browser_screenshot() {
        try {
            const fs = require('fs');
            const path = require('path');

            // Ensure directory exists
            const screenshotDir = path.join(process.cwd(), 'data', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }

            const filename = `screenshot_${Date.now()}.jpg`;
            const filepath = path.join(screenshotDir, filename);

            const page = await this.ensureBrowser();

            // Save as JPEG to disk
            await page.screenshot({
                path: filepath,
                type: 'jpeg',
                quality: 60,
                fullPage: false
            });

            // Verify file exists before returning (Fixes "File not found" race condition)
            let retries = 0;
            while (retries < 10) {
                if (fs.existsSync(filepath)) {
                    break;
                }
                await new Promise(r => setTimeout(r, 200));
                retries++;
            }

            if (!fs.existsSync(filepath)) {
                return `Error: Screenshot reported saved but file not found at ${filepath}`;
            }

            return `Screenshot saved to: ${filepath} [ASSET: ${filepath}]`;
        } catch (error) {
            return `Error taking screenshot: ${error.message}`;
        }
    }

    async browser_close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            return 'Browser closed';
        }
        return 'Browser was not open';
    }
    async analyze_image({ filepath, prompt }) {
        try {
            const fs = require('fs');
            if (!fs.existsSync(filepath)) return `Error: File not found at ${filepath}`;

            // Read file as base64
            const bitmap = fs.readFileSync(filepath);
            const base64Image = Buffer.from(bitmap).toString('base64');

            // Call ModelOrchestrator
            // Note: BrowserTools needs access to the agent/models component.
            // We'll assume 'this.agent' is injected (like we did for tools in Agent.js).
            if (!this.agent || !this.agent.components.models) {
                return "Error: Agent models not linked to BrowserTools.";
            }

            return await this.agent.components.models.analyzeImage(base64Image, prompt);
        } catch (error) {
            return `Error analyzing image: ${error.message}`;
        }
    }
}

module.exports = BrowserTools;
