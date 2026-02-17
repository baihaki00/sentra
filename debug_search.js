const BrowserTools = require('./src/tools/BrowserTools');
const fs = require('fs');

async function test() {
    console.log('--- Debugging Search ---');
    const tools = new BrowserTools();

    try {
        const result = await tools.google_search({ query: 'Apple stock price' });
        console.log('RAW RESULT:\n', result);
    } catch (e) {
        console.error('ERROR:', e);
    }
}

test();
