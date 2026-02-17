const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: EXPECTATION & IDENTITY (V3)
 */
async function testExpectationIdentity() {
    console.log("🌌 TEST: V3 EXPECTATION & IDENTITY...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEST SELF_QUERY
    console.log("\n[1] Simulating: 'who are you?'");

    // DEBUG: Check if identity nodes exist
    console.log(`DEBUG: IDENTITY:SENTRA exists? ${kernel.scaffold.memory.nodes.has('IDENTITY:SENTRA')}`);
    console.log(`DEBUG: Total nodes in memory: ${kernel.scaffold.memory.nodes.size}`);

    kernel.scaffold.perceive('who are you');

    const v3Intent1 = kernel.intent.classifyByActivation();
    console.log(`Intent: ${v3Intent1.intent} (Score: ${v3Intent1.score})`);

    if (v3Intent1.intent === 'INTENT:SELF_QUERY') {
        const self = kernel.scaffold.reasoner.getIdentityProp('IDENTITY:SENTRA');
        if (self) {
            console.log(`✅ Identity Reasoning: ${self.id} (${self.type})`);
            console.log(`   Facts: ${self.facts.length} items`);
        } else {
            console.error("❌ Failed to retrieve SENTRA identity.");
        }
    } else {
        console.error("❌ Failed to detect SELF_QUERY.");
    }

    // 2. TEST USER_QUERY
    console.log("\n[2] Simulating: 'who am i?'");
    kernel.scaffold.perceive('who am i');

    const v3Intent2 = kernel.intent.classifyByActivation();
    console.log(`Intent: ${v3Intent2.intent} (Score: ${v3Intent2.score})`);

    if (v3Intent2.intent === 'INTENT:USER_QUERY') {
        const user = kernel.scaffold.reasoner.getIdentityProp('IDENTITY:USER');
        if (user) {
            console.log(`✅ User Identity: ${user.id} (${user.type})`);
        } else {
            console.error("❌ Failed to retrieve USER identity.");
        }
    } else {
        console.error("❌ Failed to detect USER_QUERY.");
    }

    // 3. TEST ENTITY ACTIVATION
    console.log("\n[3] Testing Entity Activation with 'hello Sentra'");
    const entities = kernel.entityResolver.resolve("hello Sentra");
    console.log(`Entities found: ${entities.length}`);

    if (entities.find(e => e.id === 'Sentra' && e.type === 'KNOWN')) {
        console.log("✅ 'Sentra' detected as KNOWN entity.");
        // Activate it
        kernel.scaffold.memory.spreadActivation('Sentra', 1.5, 0.5);
        const sentraNode = kernel.scaffold.memory.nodes.get('Sentra');
        console.log(`   Activation after spread: ${sentraNode.activation}`);
    } else {
        console.error("❌ Failed to detect 'Sentra' entity.");
    }
}

testExpectationIdentity();
