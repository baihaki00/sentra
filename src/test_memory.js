const SemanticMemory = require('./memory/SemanticMemory');

async function testMemory() {
    console.log('--- Testing SQLite Vector Memory ---');
    const memory = new SemanticMemory('./data');
    await memory.initialize();

    console.log('[Test] Adding memory: "Sentra is built with modular skills and sqlite memory."');
    await memory.add('Sentra is built with modular skills and sqlite memory.', { type: 'fact' });

    console.log('[Test] Searching: "What is Sentra built with?"');
    const results = await memory.search('What is Sentra built with?', 3);

    console.log('\n[Results]:');
    results.forEach(r => {
        console.log(`- Score: ${r.distance ? r.distance : 'N/A'}`);
        console.log(`  Content: ${r.content}`);
    });

    if (results.length > 0 && results[0].content.includes('modular skills')) {
        console.log('\nSUCCESS: Memory retrieved correctly.');
    } else {
        console.error('\nFAILURE: Could not retrieve relevant memory.');
    }
}

testMemory().catch(console.error);
