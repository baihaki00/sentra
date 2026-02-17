const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: ENTITY RESOLVER (V3)
 */
async function testEntity() {
    console.log("🌌 TEST: ENTITY RESOLUTION...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. KNOWN IDENTITY
    console.log("\n[1] Input: 'hello Sentra'");
    const result1 = kernel.entityResolver.resolve("hello Sentra");
    console.log("Entities:", JSON.stringify(result1));

    if (result1.find(e => e.id === 'Sentra' && e.type === 'KNOWN')) {
        console.log("✅ Known Entity 'Sentra' found.");
    } else {
        console.error("❌ Failed to find 'Sentra'.");
    }

    // 2. POTENTIAL ENTITY
    console.log("\n[2] Input: 'I am Antigravity'");
    const result2 = kernel.entityResolver.resolve("I am Antigravity");
    console.log("Entities:", JSON.stringify(result2));

    if (result2.find(e => e.id === 'Antigravity' && e.type === 'POTENTIAL')) {
        console.log("✅ Potential Entity 'Antigravity' found.");
    } else {
        console.error("❌ Failed to find 'Antigravity'.");
    }

    // 3. QUOTED LITERAL
    console.log("\n[3] Input: 'open file \"secret.txt\"'");
    const result3 = kernel.entityResolver.resolve('open file "secret.txt"');
    console.log("Entities:", JSON.stringify(result3));

    if (result3.find(e => e.id === 'secret.txt' && e.type === 'LITERAL')) {
        console.log("✅ Literal 'secret.txt' found.");
    } else {
        console.error("❌ Failed to find 'secret.txt'.");
    }
}

testEntity();
