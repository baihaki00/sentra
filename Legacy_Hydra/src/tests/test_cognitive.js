const Agent = require('../core/Agent');
const Pipeline = require('../core/Pipeline');
const ModelOrchestrator = require('../models/ModelOrchestrator');
const ToolSandbox = require('../tools/ToolSandbox');

// Mock Config
const config = {
    modelName: 'qwen3:8b', // Needs to match what you have locally
    baseUrl: 'http://localhost:11434'
};

async function runTest() {
    console.log('--- Starting Cognitive Engine Test ---');
    console.log('Building Agent...');

    // 1. Create Agent
    const agent = new Agent(config);

    // 2. Wire Components (Manual Injection for Test)
    // Core.js usually does this
    agent.components.models = new ModelOrchestrator(config);
    agent.components.tools = new ToolSandbox();
    agent.components.pipeline = new Pipeline(agent);

    // Listen to logs
    agent.on('log', (msg) => console.log(msg));

    try {
        console.log('Task: "Research the best GPU for AI"');
        const result = await agent.startTask('Research the best GPU for AI');
        console.log('\n--- Test Complete ---');
        console.log('Result:', result);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
