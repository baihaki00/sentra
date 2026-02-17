const https = require('https');
const http = require('http');

/**
 * WebFetcher — Lightweight HTTP content retrieval
 * 100× faster than Puppeteer for static pages.
 * No browser launch, no Chrome, no overhead.
 */
class WebFetcher {
    constructor() {
        this.cache = new Map();        // URL → { content, timestamp }
        this.searchCache = new Map();  // query → { results, timestamp }
        this.CACHE_TTL = 2 * 60 * 1000;        // 2 minutes for pages
        this.SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for searches
    }

    /**
     * web_fetch — Fast HTTP GET with HTML-to-text conversion
     * Tool: { type: "web_fetch", args: { url: string, selector?: string } }
     */
    async web_fetch({ url, selector }) {
        // Check cache
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`[WebFetcher] Cache hit: ${url}`);
            return cached.content;
        }

        console.log(`[WebFetcher] Fetching: ${url}`);
        const startTime = Date.now();

        try {
            const html = await this._httpGet(url);
            const text = this._htmlToText(html, selector);
            const elapsed = Date.now() - startTime;

            // Smart truncation: keep relevant content
            const result = text.length > 6000
                ? text.substring(0, 6000) + '\n... (truncated)'
                : text;

            console.log(`[WebFetcher] Fetched ${url} in ${elapsed}ms (${result.length} chars)`);

            // Cache it
            this.cache.set(url, { content: result, timestamp: Date.now() });

            return result;
        } catch (error) {
            return `Error fetching ${url}: ${error.message}`;
        }
    }

    /**
     * web_search — Fast search using DuckDuckGo HTML (no browser)
     * Tool: { type: "web_search", args: { query: string } }
     */
    async web_search({ query }) {
        // Check cache
        const cached = this.searchCache.get(query);
        if (cached && Date.now() - cached.timestamp < this.SEARCH_CACHE_TTL) {
            console.log(`[WebFetcher] Search cache hit: "${query}"`);
            return cached.results;
        }

        console.log(`[WebFetcher] Searching: "${query}"`);
        const startTime = Date.now();

        try {
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const html = await this._httpGet(url, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9',
            });

            const results = this._parseDDGResults(html);
            const elapsed = Date.now() - startTime;
            console.log(`[WebFetcher] Search completed in ${elapsed}ms (${results.split('\n').length} lines)`);

            // Cache it
            this.searchCache.set(query, { results, timestamp: Date.now() });

            if (!results || results === 'No results found.' || results.length < 10) {
                return "Search blocked or no results. You MUST use 'google_search' (browser) or 'browser_open' to find this info.";
            }
            return results;
        } catch (error) {
            return `Error searching: ${error.message}`;
        }
    }

    /**
     * Raw HTTP GET with redirect following
     */
    _httpGet(url, extraHeaders = {}) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'identity',
                    ...extraHeaders,
                },
                timeout: 10000,
            };

            const req = protocol.get(url, options, (res) => {
                // Follow redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        const parsed = new URL(url);
                        redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
                    }
                    return this._httpGet(redirectUrl, extraHeaders).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200 && res.statusCode !== 202) {
                    res.resume(); // Consume data to free memory
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        });
    }

    /**
     * Convert HTML to clean text
     * Strips scripts, styles, nav, footer, ads
     * Extracts main content area if possible
     */
    _htmlToText(html, targetSelector) {
        // Remove scripts, styles, and other junk
        let clean = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '');

        // Try to extract main content area
        const mainMatch = clean.match(/<main[\s\S]*?<\/main>/i)
            || clean.match(/<article[\s\S]*?<\/article>/i)
            || clean.match(/<div[^>]*class="[^"]*content[^"]*"[\s\S]*?<\/div>/i)
            || clean.match(/<div[^>]*id="[^"]*content[^"]*"[\s\S]*?<\/div>/i);

        if (mainMatch) {
            clean = mainMatch[0];
        }

        // Convert common HTML elements to readable text
        clean = clean
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<\/tr>/gi, '\n')
            .replace(/<\/td>/gi, ' | ')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
            .replace(/<[^>]+>/g, '')  // Strip remaining tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, '\n\n')  // Collapse multiple newlines
            .replace(/[ \t]+/g, ' ')     // Collapse spaces
            .trim();

        return clean;
    }

    /**
     * Parse DuckDuckGo HTML results page
     */
    _parseDDGResults(html) {
        const results = [];

        // Extract instant answer if present
        const zciMatch = html.match(/<div class="zci__result">([\s\S]*?)<\/div>/i)
            || html.match(/<div class="c-info__abstract">([\s\S]*?)<\/div>/i);
        if (zciMatch) {
            const text = this._stripTags(zciMatch[1]).trim();
            if (text) results.push(`INSTANT ANSWER: ${text}\n`);
        }

        // Extract organic results
        const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        let count = 0;

        while ((match = resultRegex.exec(html)) !== null && count < 8) {
            const link = this._decodeDDGUrl(match[1]);
            const title = this._stripTags(match[2]).trim();
            const snippet = this._stripTags(match[3]).trim();

            if (title && !link.includes('ad_domain')) {
                results.push(`Title: ${title}\nLink: ${link}\nSnippet: ${snippet}\n`);
                count++;
            }
        }

        // Fallback: try simpler patterns
        if (count === 0) {
            const simpleRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
            while ((match = simpleRegex.exec(html)) !== null && count < 8) {
                const title = this._stripTags(match[1]).trim();
                if (title && title.length > 5) {
                    results.push(`Result: ${title}`);
                    count++;
                }
            }
        }

        return results.join('\n') || 'No results found.';
    }

    _decodeDDGUrl(url) {
        // DDG wraps URLs in redirect: //duckduckgo.com/l/?uddg=<encoded>&rut=...
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) {
            return decodeURIComponent(uddgMatch[1]);
        }
        return url;
    }

    _stripTags(html) {
        return (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    }

    /**
     * Clear caches
     */
    clearCache() {
        this.cache.clear();
        this.searchCache.clear();
    }
}

module.exports = WebFetcher;
