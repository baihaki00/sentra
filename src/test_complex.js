const SentraCore = require('./core');

// Mock stdin for interaction if needed, or just run automated scenarios
async function stressTest() {
    console.log('--- SENTRA STRESS TEST: "JARVIS PROTOCOL" ---');

    console.log('Initializing Core...');
    const core = new SentraCore();
    await core.start();

    const scenarios = [
        {
            name: "The Researcher (Web + IO)",
            task: "Go to google.com and search for 'Current CEO of Microsoft'. Read the page, find the name, and write it to 'microsoft_ceo.txt'."
        },
        {
            name: "The Analyst (Logic + Code)",
            task: "Calculate the sum of the first 50 numbers using Python, then echo the result."
        },
        {
            name: "The Elephant (Memory)",
            task: "Recall my favourite color from memory, then tell me what it is in reverse string."
        }
    ];

    for (const scenario of scenarios) {
        console.log(`\n\n>>> SCENARIO: ${scenario.name}`);
        console.log(`>>> TASK: ${scenario.task}`);
        console.log('------------------------------------------------');

        try {
            // We use the internal agent directly to bypass the CLI readline
            const result = await core.agent.startTask(scenario.task);
            console.log(`\n[SUCCESS] Result: ${result}`);
        } catch (e) {
            console.error(`\n[FAILURE] Error: ${e.message}`);
        }
    }

    await core.stop();
}

stressTest().catch(console.error);
