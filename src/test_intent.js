const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: INTENT ENGINE (Fuzzy Logic)
 */
async function testIntent() {
    console.log("🌌 TEST: INTENT ENGINE...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. TEACH: "list files" -> LIST_FILES
    console.log("\n[1] Teaching 'list files'...");
    await kernel.teachAction("list files", "LIST_FILES", { path: "." });

    // 2. EXACT MATCH
    console.log("\n[2] Testing Exact Match: 'list files'");
    const exact = kernel.intent.match("list files");
    if (exact && exact.nodeId === "LIST_FILES" && exact.method === "CONTAINS") {
        console.log("✅ Exact Match Passed");
    } else {
        console.error("❌ Exact Match Failed", exact);
    }

    // 3. FUZZY MATCH (Typo)
    console.log("\n[3] Testing Fuzzy Match: 'lst files'");
    const fuzzy = kernel.intent.match("lst files");
    if (fuzzy && fuzzy.nodeId === "LIST_FILES" && fuzzy.method === "FUZZY") {
        console.log(`✅ Fuzzy Match Passed (Score: ${fuzzy.score.toFixed(2)})`);
    } else {
        console.error("❌ Fuzzy Match Failed", fuzzy);
    }

    // 4. CONTAINS MATCH (Wrapper)
    console.log("\n[4] Testing Contains Match: 'please list files now'");
    const contains = kernel.intent.match("please list files now");
    if (contains && contains.nodeId === "LIST_FILES" && contains.method === "CONTAINS") {
        console.log("✅ Contains Match Passed");
    } else {
        console.error("❌ Contains Match Failed", contains);
    }

    // 5. REINFORCEMENT
    console.log("\n[5] Testing Reinforcement...");
    if (fuzzy) {
        kernel.intent.reinforce("lst files", fuzzy.trigger);
        // Check if ALIAS edge exists
        const edge = kernel.scaffold.memory.edges.get(`lst files|ALIAS|list files`);
        if (edge) {
            console.log("✅ Reinforcement Passed: Alias created.");
        } else {
            console.error("❌ Reinforcement Failed: Edge not found.");
        }
    }
}

testIntent();
