const GenesisKernel = require('./genesis/Kernel');

/**
 * GENESIS KERNEL BENCHMARK (v0.2)
 * Validates the Perception-Action Loop.
 */

async function runTest() {
    console.log('🌌 INIT GENESIS KERNEL...');
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEACHING MODE
    console.log('\n1. TEACHING: "ls" -> LIST_FILES');
    await kernel.teachAction('ls', 'LIST_FILES', { path: '.' });

    // 2. EXECUTION MODE
    console.log('\n2. EXECUTION: Perceiving "ls"...');

    // We manually simulate the loop logic here for testing
    const input = 'ls';
    const conceptId = kernel.scaffold.perceive(input);

    // Check Reasoning
    const actionNode = kernel.findAction(conceptId);

    if (actionNode && actionNode.data.action === 'LIST_FILES') {
        console.log('✅ REASONING: Found Action Node.');

        // Execute
        const result = await kernel.binder.execute(actionNode.data.action, actionNode.data.args);

        if (result && typeof result === 'string' && result.includes('package.json')) {
            console.log('✅ ACTION: File System Accessed.');
            console.log('   Result Preview:', result.substring(0, 50) + '...');
        } else {
            console.error('❌ ACTION FAILED: Invalid Result', result);
            process.exit(1);
        }

    } else {
        console.error('❌ REASONING FAILED: Action Link Missing.');
        process.exit(1);
    }

    console.log('\n🌌 KERNEL LOOP VERIFIED.');
}

runTest();
