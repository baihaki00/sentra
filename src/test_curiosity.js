const GenesisKernel = require('./genesis/Kernel');

/**
 * CURIOSITY BENCHMARK (v0.5)
 * Goal: Prove autonomous exploration.
 */

async function runTest() {
    console.log('🌌 INIT CURIOSITY BENCHMARK...');
    const kernel = new GenesisKernel();
    await kernel.init();

    // Clear memory for clean test? 
    // Ideally yes, but we also rely on persistence.
    // Let's just introduce a NEW concept.
    const unknownPath = './knowledge_base';

    console.log(`1. PERCEIVING UNKNOWN: "${unknownPath}"`);
    // Perceive it multiple times to increase Activation (Familiarity)
    // But don't connect it to anything -> Low Connectivity (Entropy)
    kernel.scaffold.perceive(unknownPath);
    kernel.scaffold.perceive(unknownPath);
    kernel.scaffold.perceive(unknownPath);

    console.log('2. TRIGGERING EXPLORATION...');
    const suggestion = kernel.curiosity.proposeExploration();

    if (suggestion && suggestion.action === 'LIST_FILES' && suggestion.args.path === unknownPath) {
        console.log(`✅ CURIOSITY WORKS: Suggested LIST_FILES on ${unknownPath}`);

        // Execute it
        console.log('3. EXECUTING SUGGESTION...');
        const result = await kernel.binder.execute(suggestion.action, suggestion.args);

        if (typeof result === 'string' && result.length > 0) {
            console.log('✅ EXPLORATION SUCCESSFUL: Found files.');
            console.log('   Preview:', result.substring(0, 50).replace(/\n/g, ' '));
        } else {
            console.error('❌ EXPLORATION FAILED (No Output).');
            process.exit(1);
        }

    } else {
        console.error('❌ CURIOSITY FAILED: Did not suggest expected action.', suggestion);
        // Debug: Dump interesting nodes
        console.log('Debug Interesting:', kernel.curiosity.findInterestingNodes());
        process.exit(1);
    }

    console.log('🌌 CURIOSITY LOOP VERIFIED.');
}

runTest();
