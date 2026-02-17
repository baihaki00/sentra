const GenesisKernel = require('./Kernel');

const COMMON_GREETINGS = ["hello", "hi", "hey", "greetings", "good morning", "yo"];
const IDENTITY_QS = ["who are you", "what are you", "your name", "identify"];
const CAPABILITIES = ["help", "what can you do", "commands", "manual"];
const NAV_COMMANDS = ["list", "ls", "dir", "show files", "what is here"];
const READ_COMMANDS = ["read kernel", "show source", "cat kernel"];

async function runSchool() {
    console.log("🏫 WELCOME TO GENESIS ACADEMY...");
    const kernel = new GenesisKernel();
    await kernel.init();

    // Helper
    const teach = (trigger, action, args) => {
        kernel.scaffold.perceive(trigger);
        kernel.scaffold.memory.addNode(action, 'ACTION', { action, args });
        kernel.scaffold.associate(trigger, action, 'TRIGGERS');
        // Also associate variations? 
        // v0.9 limitation: Exact Match only. 
        // We will inject multiple triggers pointing to the same action.
    };

    console.log("📚 1. TEACHING GREETINGS...");
    COMMON_GREETINGS.forEach(word => {
        teach(word, "ECHO", { message: `Greetings. I am Sentra.` });
    });

    console.log("📚 2. TEACHING IDENTITY...");
    IDENTITY_QS.forEach(q => {
        teach(q, "ECHO", { message: "I am the Sentra Genesis Kernel v0.9." });
    });

    console.log("📚 3. TEACHING CAPABILITIES...");
    CAPABILITIES.forEach(q => {
        teach(q, "ECHO", { message: "I can LIST_FILES, READ_FILE, EXPLORE, and LEARN." });
    });

    console.log("📚 4. TEACHING OPERATIONS...");
    NAV_COMMANDS.forEach(cmd => {
        teach(cmd, "LIST_FILES", { path: "." });
    });

    teach("read kernel", "READ_FILE", { path: "src/genesis/Kernel.js" });
    teach("read memory", "READ_FILE", { path: "data/memory.json" });

    // 5. Hardcoded Logic Puzzles? (Mocking reasoning)
    teach("1+1", "ECHO", { message: "2" });
    teach("is the sky blue", "ECHO", { message: "Yes, usually." });

    // Save
    kernel.memory.save(kernel.scaffold.memory);
    console.log(`🎓 GRADUATION COMPLETE. Processed ${kernel.scaffold.memory.nodes.size} nodes.`);
}

runSchool();
