const GenesisKernel = require('./Kernel');

async function runExam() {
    console.log("📝 STARTING FINAL EXAM (100 Prompts)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    const KB = [
        "hello", "hi", "hey", "greetings",
        "who are you", "what is this", "identify",
        "list files", "ls", "dir", "show me source",
        "read kernel", "show files",
        "explore"
    ];

    let success = 0;
    let unknown = 0;
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
        // Generate Prompt
        let prompt;
        if (Math.random() > 0.3) {
            // Known (Test Recall)
            prompt = KB[Math.floor(Math.random() * KB.length)];
        } else {
            // Unknown (Test Stability/Curiosity)
            prompt = `random_noise_${Math.floor(Math.random() * 1000)}`;
        }

        process.stdout.write(`[${i + 1}/100] Input: "${prompt}" -> `);

        // Feed to Kernel
        const conceptId = kernel.scaffold.perceive(prompt);
        const actionNode = kernel.scaffold.recallAction(conceptId);

        if (actionNode) {
            process.stdout.write(`✅ ACTION: ${actionNode.data.action}\n`);
            success++;
        } else {
            process.stdout.write(`❓ UNKNOWN (Learning)\n`);
            unknown++;
            // Force save to test learning loop
            kernel.memory.save(kernel.scaffold.memory);
        }
    }

    const duration = Date.now() - start;
    console.log("\n📊 EXAM RESULTS:");
    console.log(`- Total Prompts: 100`);
    console.log(`- Actions Triggered: ${success}`);
    console.log(`- New Concepts Learned: ${unknown}`);
    console.log(`- Time Taken: ${duration}ms (${duration / 100}ms/op)`);
    console.log(`- Final Graph Size: ${kernel.scaffold.memory.nodes.size} Nodes`);

    if (success > 50) {
        console.log("🏆 GRADE: PASS");
    } else {
        console.log("⚠️ GRADE: FAIL (Needs more training)");
    }
}

runExam();
