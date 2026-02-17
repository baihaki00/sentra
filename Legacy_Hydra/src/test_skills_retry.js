const SentraCore = require('./core');

async function testSkills() {
    console.log('--- Testing Modular Skills (Retry) ---');
    const sentra = new SentraCore();

    // This should now trigger SkillLoader
    await sentra.initialize();

    const tools = sentra.agent.components.tools;
    console.log('\n[Verification] Checking registered tools:');

    const expectedTools = [
        'browser_open', 'cmd', 'read_file', 'execute_javascript', 'final_answer'
    ];

    let allFound = true;
    for (const tool of expectedTools) {
        if (tools.registry.has(tool)) {
            console.log(`✅ Tool found: ${tool}`);
        } else {
            console.error(`❌ Tool MISSING: ${tool}`);
            allFound = false;
        }
    }

    if (allFound) {
        console.log('\nSUCCESS: All modular skills loaded correctly.');
    } else {
        console.error('\nFAILURE: Some skills failed to load.');
    }
}

testSkills().catch(console.error);
