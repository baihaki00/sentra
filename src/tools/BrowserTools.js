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
                headless: false, // Keep visible for "Jarvis" feel
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
            });
            const pages = await this.browser.pages();
            this.page = pages[0];

            // Randomize user agent just in case
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        }
        return this.page;
    }

    async browser_open({ url }) {
        try {
            const page = await this.ensureBrowser();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
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
            const content = await page.evaluate(() => document.body.innerText);
            return content.substring(0, 2000) + '... (truncated)';
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

            // Switch to DuckDuckGo for better bot compatibility
            console.log('[BrowserTools] Navigating to Search Engine (DuckDuckGo)...');
            await page.goto('https://duckduckgo.com', { waitUntil: 'domcontentloaded' });

            console.log(`[BrowserTools] Searching for "${query}"...`);

            // DuckDuckGo selectors are stable
            await page.waitForSelector('input[name="q"]', { timeout: 5000 });
            await page.type('input[name="q"]', query);
            await page.keyboard.press('Enter');

            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => { });

            // Wait for results container
            try {
                await page.waitForSelector('.react-results--main', { timeout: 5000 });
            } catch (e) {
                // Ignore, might have loaded fast or different layout
            }

            // Extract results using DuckDuckGo classes
            const results = await page.evaluate(() => {
                // Try DDG selectors
                const articles = document.querySelectorAll('article');
                if (articles.length > 0) {
                    return Array.from(articles).slice(0, 5).map(item => {
                        const titleEl = item.querySelector('h2 a');
                        const linkEl = item.querySelector('h2 a');
                        const snippetEl = item.querySelector('.kY2IgD, .Ogdw72, .E2eLOZ'); // DDG Snippet classes vary, try generic text

                        const title = titleEl ? titleEl.innerText : 'No Title';
                        const link = linkEl ? linkEl.href : '#';
                        const snippet = snippetEl ? snippetEl.innerText : item.innerText.substring(0, 200);

                        return `Title: ${title}\nLink: ${link}\nSnippet: ${snippet}\n`;
                    }).join('\n---\n');
                }

                // Fallback to generic structure
                const links = document.querySelectorAll('a[href^="http"]');
                return Array.from(links).slice(0, 5).map(l => l.href).join('\n');
            });

            if (!results || results.length < 10) {
                return "No results found. The page might have blocked the bot or the query returned nothing.";
            }

            return `Search Results for "${query}":\n\n${results}`;
        } catch (error) {
            return `Error performing search: ${error.message}`;
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
}

module.exports = BrowserTools;
