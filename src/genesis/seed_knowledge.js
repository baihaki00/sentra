const GenesisKernel = require('./Kernel');

async function seed() {
    console.log("🌱 SEEDING KNOWLEDGE...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // Helper to teach
    const teach = (trigger, actionName, args) => {
        kernel.scaffold.perceive(trigger);
        kernel.scaffold.memory.addNode(actionName, 'ACTION', { action: actionName, args });
        kernel.scaffold.associate(trigger, actionName, 'TRIGGERS');
        console.log(`[Learned] "${trigger}" -> ${actionName}`);
    };

    // 1. Identity
    teach("who are you", "ECHO", { message: "I am Sentra, your Genesis AI." });
    teach("what is this", "ECHO", { message: "This is the ClosedClaw system." });

    // 2. User Identity
    teach("my name is Bai", "ECHO", { message: "Hello Bai. I have updated my records." });
    // Bind "Bai" to IDENTITY:USER?
    // kernel.scaffold.memory.addNode("Bai", "IDENTITY");
    // kernel.scaffold.associate("Bai", "IDENTITY:USER", "IS");

    // 3. File Actions
    teach("list files", "LIST_FILES", { path: "." });
    teach("show me source", "LIST_FILES", { path: "./src" });
    teach("check memory", "LIST_FILES", { path: "./data" });

    // 4. Exploration
    teach("explore", "EXPLORE", {});

    // Save
    kernel.memory.save(kernel.scaffold.memory);
    console.log("💾 KNOWLEDGE SAVED.");
}

seed();
