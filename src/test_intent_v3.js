const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: DYNAMIC INTENT CLASSIFICATION (V3)
 */
async function testIntentV3() {
    console.log("🌌 TEST: INTENT V3 (Graph Activation)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEST GREETING
    console.log("\n[1] Input: 'hello world'");
    // Manually trigger perceive to spread activation
    kernel.scaffold.perceive('hello');
    kernel.scaffold.perceive('world');

    // Check Activation
    const result1 = kernel.intent.classifyByActivation();
    console.log(`Classified: ${result1.intent} (Score: ${result1.score})`);

    if (result1.intent === 'INTENT:GREETING') {
        console.log("✅ Correctly identified GREETING.");
    } else {
        console.error("❌ Failed to identify GREETING.");
    }

    // 2. TEST SELF_QUERY
    console.log("\n[2] Input: 'who are you'");
    // Note: 'who are you' is a single node in seed, but tokenizer splits it?
    // Current tokenizer in Kernel.js splits by space?
    // Actually Kernel perceive takes the whole line? 
    // Let's check Kernel.js... 
    // It passes `input` (line.trim()) to perceive.
    // So 'who are you' is treated as one token if passed as one string.
    // But usually we tokenize? 
    // For V0.2, perceive takes the whole string as one "concept" if not tokenized.

    // Let's assume exact match for seed "who are you"
    kernel.scaffold.perceive('who are you');

    const result2 = kernel.intent.classifyByActivation();
    console.log(`Classified: ${result2.intent} (Score: ${result2.score})`);

    if (result2.intent === 'INTENT:SELF_QUERY') {
        console.log("✅ Correctly identified SELF_QUERY.");
    } else {
        console.error("❌ Failed to identify SELF_QUERY.");
    }

    // 3. TEST TEACHING
    console.log("\n[3] Input: 'x means y'");
    kernel.scaffold.perceive('means');

    const result3 = kernel.intent.classifyByActivation();
    console.log(`Classified: ${result3.intent} (Score: ${result3.score})`);

    if (result3.intent === 'INTENT:TEACHING') {
        console.log("✅ Correctly identified TEACHING.");
    } else {
        console.error("❌ Failed to identify TEACHING.");
    }
}

testIntentV3();
