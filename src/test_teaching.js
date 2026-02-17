const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: NATURAL LANGUAGE TEACHING
 */
async function testTeaching() {
    console.log("🌌 TEST: TEACHING ENGINE...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEACH: "huh" means "curiosity"
    console.log("\n[1] Input: 'when i say huh it means curiosity'");
    const input1 = "when i say huh it means curiosity";

    // Simulate loop logic manually for test
    const teaching1 = kernel.intent.detectTeaching(input1);
    if (teaching1) {
        console.log(`✅ Detected: "${teaching1.trigger}" -> "${teaching1.target}"`);
        kernel.scaffold.associate(teaching1.trigger, teaching1.target, 'ALIAS');
    } else {
        console.error("❌ Failed to detect pattern 1.");
    }

    // 2. TEACH: "ls means list files"
    console.log("\n[2] Input: 'ls means list files'");
    const input2 = "ls means list files";

    const teaching2 = kernel.intent.detectTeaching(input2);
    if (teaching2) {
        console.log(`✅ Detected: "${teaching2.trigger}" -> "${teaching2.target}"`);
        kernel.scaffold.associate(teaching2.trigger, teaching2.target, 'ALIAS');
    } else {
        console.error("❌ Failed to detect pattern 2.");
    }

    // 3. VERIFY GRAPH
    console.log("\n[3] Verifying Graph Edges...");
    const edge1 = kernel.scaffold.memory.edges.get(`huh|ALIAS|curiosity`);
    const edge2 = kernel.scaffold.memory.edges.get(`ls|ALIAS|list files`);

    if (edge1) console.log("✅ Edge 1 exists.");
    else console.error("❌ Edge 1 missing.");

    if (edge2) console.log("✅ Edge 2 exists.");
    else console.error("❌ Edge 2 missing.");

    // 4. VERIFY RESOLUTION (Recursive Resolution)
    console.log("\n[4] Verifying Intent Resolution...");

    // Test "huh" -> "curiosity" (Assuming "curiosity" is in graph or just a concept)
    // Note: If "curiosity" isn't an ACTION, match() returns the end concept.
    const match1 = kernel.intent.match("huh");
    if (match1 && match1.nodeId === "curiosity") {
        console.log(`✅ Resolved "huh" -> "curiosity" (Score: ${match1.score})`);
    } else {
        console.error(`❌ Failed to resolve "huh". Got: ${JSON.stringify(match1)}`);
    }

    // Test "ls" -> "list files" (Assuming "list files" or "LIST_FILES" exists)
    // Let's inject a fake action for "list files" to test full resolution
    kernel.scaffold.memory.addNode("list files", "ACTION");

    const match2 = kernel.intent.match("ls");
    if (match2 && match2.nodeId === "list files") {
        console.log(`✅ Resolved "ls" -> "list files" (Score: ${match2.score})`);
    } else {
        console.error(`❌ Failed to resolve "ls". Got: ${JSON.stringify(match2)}`);
    }
}

testTeaching();
