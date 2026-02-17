const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: ATTENTION & RELEVANCE GATING (V3.5)
 */
async function testAttention() {
    console.log("🌌 TEST: ATTENTION & RELEVANCE GATING (V3.5)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    console.log("\n=== Test 1: Intent-Based Filtering ===");

    // Activate GREETING intent
    kernel.scaffold.memory.nodes.get('INTENT:GREETING').activation = 1.0;
    kernel.scaffold.memory.nodes.get('hello').activation = 0.9;

    const relevant1 = kernel.attention.filterRelevant('INTENT:GREETING', [], []);
    console.log(`Found ${relevant1.length} relevant nodes`);
    console.log(`Top 3: ${relevant1.slice(0, 3).map(r => `${r.id} (${r.relevance.toFixed(2)})`).join(', ')}`);
    console.log(relevant1.length > 0 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 2: Entity-Based Filtering ===");

    // Reset activations
    for (const [id, node] of kernel.scaffold.memory.nodes) {
        node.activation = 0.1;
    }

    // Activate Sentra entity
    kernel.scaffold.memory.nodes.get('IDENTITY:SENTRA').activation = 1.0;

    const entities = [{ id: 'IDENTITY:SENTRA', type: 'IDENTITY' }];
    const relevant2 = kernel.attention.filterRelevant('INTENT:SELF_QUERY', entities, []);

    console.log(`Found ${relevant2.length} relevant nodes`);
    const hasSentra = relevant2.find(r => r.id === 'IDENTITY:SENTRA');
    console.log(`IDENTITY:SENTRA present: ${hasSentra ? 'Yes' : 'No'}`);
    console.log(hasSentra ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 3: Attention Gating (Suppression) ===");

    // Reset and activate specific nodes
    for (const [id, node] of kernel.scaffold.memory.nodes) {
        node.activation = 0.5; // Moderate activation for all
    }
    kernel.scaffold.memory.nodes.get('INTENT:GREETING').activation = 1.0;

    const relevant3 = kernel.attention.filterRelevant('INTENT:GREETING', [], []);

    // Get activation before gating
    const randomNode = Array.from(kernel.scaffold.memory.nodes.values()).find(n =>
        n.id !== 'INTENT:GREETING' && !relevant3.find(r => r.id === n.id)
    );
    const activationBefore = randomNode ? randomNode.activation : 0;

    // Apply gating
    kernel.attention.applyGating(relevant3);

    const activationAfter = randomNode ? randomNode.activation : 0;

    console.log(`Irrelevant node activation: ${activationBefore.toFixed(2)} → ${activationAfter.toFixed(2)}`);
    console.log(activationAfter < activationBefore ? "✅ PASSED (Suppression worked)" : "❌ FAILED");

    console.log("\n=== Test 4: Focus Summary ===");

    // Reset
    for (const [id, node] of kernel.scaffold.memory.nodes) {
        node.activation = 0.1;
    }
    kernel.scaffold.memory.nodes.get('INTENT:GREETING').activation = 1.0;
    kernel.scaffold.memory.nodes.get('hello').activation = 0.8;
    kernel.scaffold.memory.nodes.get('IDENTITY:SENTRA').activation = 0.7;

    const relevant4 = kernel.attention.filterRelevant(
        'INTENT:GREETING',
        [{ id: 'IDENTITY:SENTRA', type: 'IDENTITY' }],
        ['hello']
    );

    const summary = kernel.attention.getFocusSummary(relevant4);
    console.log(summary);
    console.log(summary.includes('Intent-related') || summary.includes('Entities') ? "✅ PASSED" : "❌ FAILED");
}

testAttention();
