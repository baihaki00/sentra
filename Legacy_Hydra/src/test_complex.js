const CognitiveEngine = require('./core/CognitiveEngine');
const Agent = require('./core/Agent');

// Mock Config
const config = {
    models: { default: 'mock' },
    agent: { name: 'Sentra' }
};

// Mock Agent
const mockAgent = new Agent(config);
mockAgent.log = (msg) => console.log(msg);

// Initialize Engine
const engine = new CognitiveEngine(mockAgent);

// Mock Model Responses
engine.models.chat = async (messages) => {
    const prompt = messages[0].content;
    console.log('[Mock] Received Prompt:', prompt); // Debugging

    // 1. Mock Plan Generation (deliberateFast)
    if (prompt.includes('Return a JSON array with a SINGLE step')) {
        // Return a random plan to simulate variance
        const planId = Math.floor(Math.random() * 1000);
        return JSON.stringify([
            { type: 'final_answer', args: { text: `Plan Variant ${planId}` } }
        ]);
    }

    // 2. Mock Ranking (deliberateTree evaluation)
    if (prompt.includes('MOST EFFICIENT and SAFE')) {
        return JSON.stringify({
            best_index: 2,
            reason: "Plan 2 is the most robust."
        });
    }

    return "{}";
};

// Mock CleanJson
engine.models.cleanJson = (text) => text;

async function testTreeOfThoughts() {
    console.log('--- Testing Cognitive Engine (System 2) ---');

    // Override generateCandidates to ensure distinct plans for testing
    engine.models.generateCandidates = async (task, context, n) => {
        console.log(`[Mock] Generating ${n} candidates...`);
        return [
            { thought: "Approach A", plan: [{ type: 'cmd', args: { command: 'echo A' } }] },
            { thought: "Approach B", plan: [{ type: 'cmd', args: { command: 'echo B' } }] }, // Winner
            { thought: "Approach C", plan: [{ type: 'cmd', args: { command: 'echo C' } }] }
        ];
    };

    const task = "Complex Task Requiring Thought";
    const context = { history: [] };

    const plan = await engine.deliberateTree(task, context);

    console.log('--- Result ---');
    console.log('Selected Plan:', plan);

    if (plan.thought === 'Approach B') {
        console.log('✅ Tree of Thoughts Verify Passed (Selected Plan 2)');
    } else {
        console.error('❌ Tree of Thoughts Failed');
        process.exit(1);
    }
}

testTreeOfThoughts();
