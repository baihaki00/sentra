const SentraCore = require('./core');

async function testReal() {
    console.log('--- Testing Real Capabilities ---');

    // 1. Initialize Core
    const core = new SentraCore();
    await core.start();

    console.log('\n[Test] Agent initialized with:');
    console.log('- Persistent Memory:', core.agent.components.memory.episodic.constructor.name);
    console.log('- Local Model Adapter:', core.agent.components.models.adapter ? 'Present' : 'Absent');

    // 2. Run Task
    console.log('\n[Test] Starting Task...');
    try {
        const result = await core.agent.startTask('List files in current directory and get OS info');
        console.log('\n[Test] Task Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('\n[Test] Task Failed:', err);
    }

    // 3. Verify Persistence
    console.log('\n[Test] Verifying Persistence...');
    const history = await core.agent.components.memory.episodic.query();
    console.log(`- Episodes in storage: ${history.length}`);
    if (history.length > 0) {
        console.log(`- Latest Episode ID: ${history[history.length - 1].id}`);
    }

    await core.stop();
    console.log('--- Test Complete ---');
}

testReal().catch(console.error);
