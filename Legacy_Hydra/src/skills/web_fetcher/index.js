const WebFetcher = require('../../tools/WebFetcher');
const webFetcher = new WebFetcher();

module.exports = {
    name: 'web_fetcher',
    description: 'Fast HTTP-based web content retrieval (no browser needed)',
    tools: {
        'web_fetch': {
            description: 'Fetches a web page via HTTP and returns clean text content. 100x faster than browser_open+browser_read. Use this for reading articles, docs, and static pages.',
            parameters: { type: 'object', properties: { url: { type: 'string' }, selector: { type: 'string' } } },
            handler: (args) => webFetcher.web_fetch(args)
        },
        'web_search': {
            description: 'Fast web search via DuckDuckGo (no browser). Returns titles, links, and snippets. Use this INSTEAD of google_search for speed.',
            parameters: { type: 'object', properties: { query: { type: 'string' } } },
            handler: (args) => webFetcher.web_search(args)
        }
    }
};
