const VectorDb = require('./memory/VectorDb');
const fs = require('fs');
const path = require('path');

async function testVectorMemory() {
    console.log('--- Testing Vector Memory ---');

    const testDbPath = path.join(__dirname, '..', 'data', 'test_memory.db');

    // Clean up previous test
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }

    const db = new VectorDb(testDbPath);
    await db.initialize();

    // 1. Store memories
    console.log('Storing memories...');
    await db.store('Open notepad application', { type: 'task', tool: 'cmd' });
    await db.store('Launch text editor', { type: 'task', tool: 'cmd' });
    await db.store('Search for AI Agent documentation', { type: 'task', tool: 'google_search' });
    await db.store('Open Chrome browser', { type: 'task', tool: 'cmd' });

    // 2. Test semantic search
    console.log('\nSearching for: "start text editing program"');
    const results = await db.search('start text editing program', 3);

    console.log('\nResults:');
    results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.content} (similarity: ${r.similarity.toFixed(3)})`);
    });

    // 3. Verify
    const topResult = results[0];
    if (topResult && (topResult.content.includes('notepad') || topResult.content.includes('text editor'))) {
        console.log('\n✅ Vector Memory Test Passed');
        console.log(`   Correctly matched "${topResult.content}" for query "start text editing program"`);
    } else {
        console.error('\n❌ Vector Memory Test Failed');
        console.error(`   Expected notepad/text editor, got: ${topResult?.content}`);
        process.exit(1);
    }

    // Cleanup
    db.close();
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
    }
}

testVectorMemory().catch(console.error);
