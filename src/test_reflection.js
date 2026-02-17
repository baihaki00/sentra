const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: REFLECTION ENGINE (Pruning)
 */
async function testReflection() {
    console.log("🌌 TEST: REFLECTION ENGINE...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // Configure for aggressive pruning
    kernel.reflection.pruneThreshold = 1;
    kernel.reflection.ageThreshold = -1; // Prune immediately (age > -1)

    // 1. ADD NODES
    console.log("\n[1] Seeding Memory...");
    kernel.scaffold.memory.addNode('USEFUL_CONCEPT', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('USEFUL_CONCEPT').activation = 10;

    kernel.scaffold.memory.addNode('GARBAGE_CONCEPT', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('GARBAGE_CONCEPT').activation = 0;
    // Ensure it has 0 edges

    console.log(`Nodes before: ${kernel.scaffold.memory.nodes.size}`);

    // 2. TRIGGER REFLECTION
    console.log("\n[2] Dreaming...");
    await kernel.reflection.reflect();

    // 3. VERIFY
    console.log(`Nodes after: ${kernel.scaffold.memory.nodes.size}`);

    if (!kernel.scaffold.memory.nodes.has('GARBAGE_CONCEPT')) {
        console.log("✅ Garage Pruned successfully.");
    } else {
        console.error("❌ Garage persisted.");
    }

    if (kernel.scaffold.memory.nodes.has('USEFUL_CONCEPT')) {
        console.log("✅ Useful Concept retained.");
    } else {
        console.error("❌ Useful Concept lost.");
    }
}

testReflection();
