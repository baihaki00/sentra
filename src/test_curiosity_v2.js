const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: CURIOSITY ENGINE v2 (Safety)
 */
async function testCuriosity() {
    console.log("🌌 TEST: CURIOSITY ENGINE (Safety)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // 1. Seed Memory with Safe and Unsafe nodes
    console.log("\n[1] Seeding Memory...");

    // SAFE: A normal directory
    kernel.scaffold.memory.addNode('./src/genesis', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('./src/genesis').activation = 10;

    // UNSAFE: git directory
    kernel.scaffold.memory.addNode('./.git', 'CONCEPT');
    kernel.scaffold.memory.nodes.get('./.git').activation = 20; // Highly visible, but should be ignored

    console.log("Seeded './src/genesis' (Score ~10) and './.git' (Score ~20)");

    // 2. Propose Exploration
    console.log("\n[2] Proposing Exploration...");
    const proposal = kernel.curiosity.proposeExploration();

    if (proposal) {
        console.log(`Proposed Action: ${proposal.action} ${JSON.stringify(proposal.args)}`);

        if (proposal.args.path.includes('.git')) {
            console.error("❌ SAFETY FAILURE: Proposed exploring .git!");
        } else if (proposal.args.path === './src/genesis') {
            console.log("✅ SAFETY PASS: Ignored .git and chose safe path.");
        } else {
            console.log(`⚠️ Unpredicted choice: ${proposal.args.path}`);
        }
    } else {
        console.log("⚠️ No proposal generated.");
    }
}

testCuriosity();
