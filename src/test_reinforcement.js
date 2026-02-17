const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: REINFORCEMENT LEARNING (V3.5)
 */
async function testReinforcement() {
    console.log("🌌 TEST: REINFORCEMENT LEARNING (V3.5)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    try {
        console.log("\n=== Test 1: Reward for High Adequacy ===");

        // Simulate successful interaction
        const prediction1 = kernel.expectation.predict('INTENT:GREETING', [], []);
        const adequacy1 = kernel.expectation.checkAdequacy(
            prediction1,
            "Hello, Administrator. I am listening.",
            []
        );

        console.log(`Adequacy: ${adequacy1.adequacy.toFixed(2)}`);
        kernel.reflection.assignReward('INTENT:GREETING', adequacy1.adequacy, []);

        // Check if success was recorded
        const greetingNode = kernel.scaffold.memory.nodes.get('INTENT:GREETING');
        if (!greetingNode.data) {
            greetingNode.data = {};
        }
        console.log(`Success count: ${greetingNode.data.successCount || 0}`);
        console.log((greetingNode.data.successCount || 0) > 0 ? "✅ PASSED" : "❌ FAILED");
    } catch (err) {
        console.error("❌ Test 1 failed:", err.message);
    }

    try {
        console.log("\n=== Test 2: Punishment for Low Adequacy ===");

        // Simulate failed interaction
        const prediction2 = kernel.expectation.predict('INTENT:GREETING', [], []);
        const adequacy2 = kernel.expectation.checkAdequacy(
            prediction2,
            "I don't know.",
            []
        );

        console.log(`Adequacy: ${adequacy2.adequacy.toFixed(2)}`);
        kernel.reflection.assignReward('INTENT:GREETING', adequacy2.adequacy, []);

        // Check if failure was recorded
        const greetingNode2 = kernel.scaffold.memory.nodes.get('INTENT:GREETING');
        console.log(`Failure count: ${greetingNode2.data.failureCount || 0}`);
        console.log(greetingNode2.data.failureCount > 0 ? "✅ PASSED" : "❌ FAILED");
    } catch (err) {
        console.error("❌ Test 2 failed:", err.message);
    }

    console.log("\n=== Tests Complete ===");
}

testReinforcement();
