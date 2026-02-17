const GenesisKernel = require('./genesis/Kernel');

/**
 * GENESIS PHASE 2: INTEGRATION TEST
 */
async function testGenesisIntegration() {
    console.log("🌌 GENESIS v0.3: INTEGRATION TEST...");
    console.log("-----------------------------------------");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEACHING (Baseline)
    console.log("\n[1] TEACHING...");
    await kernel.teachAction("hello", "ECHO", { message: "Hello, Creator." });

    // 2. INTENT & LEARNING
    console.log("\n[2] INTENT LEARNING...");
    // Typo: "hlo" should match "hello" fuzzy
    const input2 = "hlo";
    const fuzzy = kernel.intent.match(input2);
    if (fuzzy && fuzzy.trigger === "hello") {
        console.log(`✅ Intent: Recognized typo "hlo" as "hello" (Score: ${fuzzy.score.toFixed(2)})`);
        kernel.intent.reinforce(input2, "hello");
    } else {
        console.error(`❌ Intent: Failed to recognize typo.`);
    }

    // 3. CONTEXT & MEMORY
    console.log("\n[3] CONTEXT RETENTION...");
    // Simulate conversation
    kernel.scaffold.perceive("concept_A");
    kernel.scaffold.perceive("concept_B");
    kernel.scaffold.perceive("concept_C");

    const context = kernel.scaffold.context.getRelevantNodes();
    const last = context[context.length - 1];
    if (last.id === "concept_C") {
        console.log(`✅ Context: Latest concept "concept_C" is active.`);
    } else {
        console.error(`❌ Context: Latest concept missing.`);
    }

    // 4. CURIOSITY & SAFETY
    console.log("\n[4] CURIOSITY ENGINE...");
    // Seed a safe target
    kernel.scaffold.memory.addNode('./src', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('./src').activation = 5;

    const exploration = kernel.curiosity.proposeExploration();
    if (exploration && exploration.action === 'LIST_FILES') {
        console.log(`✅ Curiosity: Proposed exploring safe path "./src".`);
    } else {
        console.error(`❌ Curiosity: Failed to propose exploration.`);
    }

    // 5. REFLECTION & CLEANUP
    console.log("\n[5] REFLECTION CYCLE...");
    // Add garbage
    kernel.scaffold.memory.addNode('GARBAGE_TEMP', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('GARBAGE_TEMP').activation = 0;

    // Force immediate pruning
    kernel.reflection.pruneThreshold = 1;
    kernel.reflection.ageThreshold = -1;

    await kernel.reflection.reflect();

    if (!kernel.scaffold.memory.nodes.has('GARBAGE_TEMP')) {
        console.log("✅ Reflection: Pruned garbage node.");
    } else {
        console.error("❌ Reflection: Failed to prune garbage.");
    }

    console.log("\n-----------------------------------------");
    console.log("🌟 TEST COMPLETE.");
}

testGenesisIntegration();
