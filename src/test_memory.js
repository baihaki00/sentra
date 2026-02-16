const SentraCore = require('./core');

async function testMemory() {
    console.log('--- Testing Semantic Memory ---');

    const core = new SentraCore();
    await core.start();

    // 1. Store a memory directly
    console.log('\n[Test] Storing memory via tool...');
    await core.agent.components.tools.execute('store_memory', {
        content: 'Sentra is a local-first autonomous agent created by the Google Deepmind team.'
    });

    // 2. Recall memory via retrieval
    console.log('\n[Test] Recalling memory via tool...');
    const result = await core.agent.components.tools.execute('recall_memory', {
        query: 'who created sentra?'
    });

    console.log('[Test] Recall Result:', result);

    if (result.toLowerCase().includes('google deepmind')) {
        console.log('[Test] SUCCESS: Retrieved correct information.');
    } else {
        console.error('[Test] FAILURE: Did not retrieve correct information.');
    }

    await core.stop();
}

testMemory().catch(console.error);
