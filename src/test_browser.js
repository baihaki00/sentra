const SentraCore = require('./core');

async function testBrowser() {
    console.log('--- Testing Browser Capabilities ---');

    // 1. Initialize Core
    const core = new SentraCore();
    await core.start();

    // 2. Run Task
    console.log('\n[Test] Starting Task: Open Google and search for "Sentra AI"');

    try {
        const result = await core.agent.startTask('Open google.com and search for "Sentra AI"');
        console.log('\n[Test] Task Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('\n[Test] Task Failed:', err);
    }

    await core.stop();
    console.log('--- Test Complete ---');
}

testBrowser().catch(console.error);
