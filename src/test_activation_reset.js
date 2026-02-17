const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: Activation Reset & Intent Classification
 */
async function testActivationReset() {
    console.log("🌌 TEST: ACTIVATION RESET & INTENT CLASSIFICATION...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // Simulate the user's conversation sequence
    console.log("\n=== Test Sequence ===");

    // 1. GREETING
    console.log("\n[1] Input: 'hello'");
    kernel.scaffold.perceive('hello');
    const intent1 = kernel.intent.classifyByActivation();
    console.log(`   Result: ${intent1.intent} (Score: ${intent1.score.toFixed(2)})`);
    console.log(`   Expected: INTENT:GREETING`);

    // 2. GREETING AGAIN
    console.log("\n[2] Input: 'hi'");
    kernel.scaffold.perceive('hi');
    const intent2 = kernel.intent.classifyByActivation();
    console.log(`   Result: ${intent2.intent} (Score: ${intent2.score.toFixed(2)})`);
    console.log(`   Expected: INTENT:GREETING (but lower score due to reset)`);

    // 3. SELF_QUERY (Should NOT be GREETING)
    console.log("\n[3] Input: 'who are you?'");
    kernel.scaffold.perceive('who are you?');
    const intent3 = kernel.intent.classifyByActivation();
    console.log(`   Result: ${intent3.intent} (Score: ${intent3.score.toFixed(2)})`);
    console.log(`   Expected: INTENT:SELF_QUERY`);

    if (intent3.intent === 'INTENT:SELF_QUERY') {
        console.log("   ✅ PASSED: Activation reset is working!");
    } else {
        console.log("   ❌ FAILED: Still misclassifying as " + intent3.intent);
    }

    // 4. UNKNOWN (Should have low score, allow V2 fallthrough)
    console.log("\n[4] Input: 'list files'");
    kernel.scaffold.perceive('list files');
    const intent4 = kernel.intent.classifyByActivation();
    console.log(`   Result: ${intent4.intent} (Score: ${intent4.score.toFixed(2)})`);
    console.log(`   Expected: UNKNOWN or low score (< 0.5) to allow V2 fallthrough`);

    if (intent4.score < 0.5) {
        console.log("   ✅ PASSED: Low confidence allows V2 matching!");
    } else {
        console.log("   ❌ FAILED: Score too high, V2 won't activate");
    }
}

testActivationReset();
