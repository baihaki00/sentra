const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: BELIEF NODES (V3.5)
 */
async function testBeliefs() {
    console.log("🌌 TEST: BELIEF NODES (V3.5)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    console.log("\n=== Test 1: Create Belief ===");

    const belief1 = kernel.scaffold.createBelief('USER_LIKES_PYTHON', 0.8, 'user');
    const node1 = kernel.scaffold.memory.nodes.get(belief1);

    console.log(`Created: ${belief1}`);
    console.log(`Confidence: ${node1.data.confidence}`);
    console.log(`Source: ${node1.data.source}`);
    console.log(node1.data.confidence === 0.8 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 2: Update Existing Belief (Confirm) ===");

    const oldConf = node1.data.confidence;
    kernel.scaffold.updateBeliefConfidence(belief1, true, 0.8); // Strong confirmation
    const newConf = node1.data.confidence;

    console.log(`Confidence: ${oldConf.toFixed(2)} → ${newConf.toFixed(2)}`);
    console.log(newConf > oldConf ? "✅ PASSED (Increased)" : "❌ FAILED");

    console.log("\n=== Test 3: Contradicting Evidence (Decrease) ===");

    const beforeContradict = node1.data.confidence;
    kernel.scaffold.updateBeliefConfidence(belief1, false, 0.5); // Moderate contradiction
    const afterContradict = node1.data.confidence;

    console.log(`Confidence: ${beforeContradict.toFixed(2)} → ${afterContradict.toFixed(2)}`);
    console.log(afterContradict < beforeContradict ? "✅ PASSED (Decreased)" : "❌ FAILED");

    console.log("\n=== Test 4: Bayesian Update on Duplicate Belief ===");

    const beforeDup = node1.data.confidence;
    kernel.scaffold.createBelief('USER_LIKES_PYTHON', 0.9, 'system'); // Should merge
    const afterDup = node1.data.confidence;

    console.log(`Confidence: ${beforeDup.toFixed(2)} → ${afterDup.toFixed(2)}`);
    console.log(`Update count: ${node1.data.updateCount}`);
    console.log(node1.data.updateCount === 2 ? "✅ PASSED (Merged, not duplicated)" : "❌ FAILED");

    console.log("\n=== Test 5: Get High-Confidence Beliefs ===");

    kernel.scaffold.createBelief('AI_IS_HELPFUL', 0.95, 'system');
    kernel.scaffold.createBelief('UNCERTAIN_FACT', 0.3, 'inferred');

    const highConfBeliefs = kernel.scaffold.getBeliefs(0.7);

    console.log(`High-confidence beliefs (>0.7): ${highConfBeliefs.length}`);
    console.log(`Top belief: ${highConfBeliefs[0]?.proposition} (${highConfBeliefs[0]?.confidence.toFixed(2)})`);
    console.log(highConfBeliefs.length >= 2 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 6: Low-Confidence Filtering ===");

    const allBeliefs = kernel.scaffold.getBeliefs(0.0);
    const lowBeliefs = kernel.scaffold.getBeliefs(0.99); // Should be very few

    console.log(`All beliefs: ${allBeliefs.length}`);
    console.log(`Very high confidence (>0.99): ${lowBeliefs.length}`);
    console.log(allBeliefs.length > lowBeliefs.length ? "✅ PASSED (Filtering works)" : "❌ FAILED");
}

testBeliefs();
