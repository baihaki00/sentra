const BrowserTools = require('../../tools/BrowserTools');
const browserTools = new BrowserTools();

module.exports = {
    name: 'browser',
    description: 'Web browsing and research capabilities',
    tools: {
        'browser_open': {
            description: 'Opens a new browser page at the given URL',
            parameters: { type: 'object', properties: { url: { type: 'string' } } },
            handler: (args) => browserTools.browser_open(args)
        },
        'browser_read': {
            description: 'Reads the text content of the current page (markdown)',
            parameters: { type: 'object', properties: {} },
            handler: (args) => browserTools.browser_read(args)
        },
        'browser_click': {
            description: 'Clicks an element on the page using a selector',
            parameters: { type: 'object', properties: { selector: { type: 'string' } } },
            handler: (args) => browserTools.browser_click(args)
        },
        'browser_type': {
            description: 'Types text into an element',
            parameters: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } } },
            handler: (args) => browserTools.browser_type(args)
        },
        'browser_press_key': {
            description: 'Presses a specific key (e.g., Enter, Esc)',
            parameters: { type: 'object', properties: { key: { type: 'string' } } },
            handler: (args) => browserTools.browser_press_key(args)
        },
        'browser_close': {
            description: 'Closes the browser',
            parameters: { type: 'object', properties: {} },
            handler: (args) => browserTools.browser_close(args)
        },
        'google_search': {
            description: 'Performs a Google search (DuckDuckGo backed) and returns summary',
            parameters: { type: 'object', properties: { query: { type: 'string' } } },
            handler: (args) => browserTools.google_search(args)
        }
    }
};
