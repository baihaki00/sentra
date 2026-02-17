const SentraCore = require('./core');

// Mock readline to avoid blocking
// We need to mock it BEFORE it is required in the tool
const readline = require('readline');

// Monkey patch readline.createInterface
readline.createInterface = (opts) => {
    return {
        question: (q, cb) => {
            console.log(`[MockReadline] Question: ${q}`);
            // Simulate user typing delay
            setTimeout(() => {
                const answer = 'Use FS tools to append the emoji rule.';
                console.log(`[MockReadline] User Answer: ${answer}`);
                cb(answer);
            }, 100);
        },
        close: () => {
            console.log('[MockReadline] Closed');
        }
    };
};

async function testExpert() {
    console.log('--- Testing ask_expert ---');

    // We need to bypass the standard initialization which might load real tools/interfaces
    // But since we just want to test the 'ask_expert' tool registered in core.js

    const core = new SentraCore();
    // Initialize to register tools
    await core.initialize();

    // Execute the tool directly to verify registration and logic
    try {
        console.log('Invoking ask_expert...');
        const result = await core.agent.components.tools.execute('ask_expert', {
            question: 'How do I modify the system prompt?',
            context: 'Self-Improvement'
        });

        console.log('Result:', result);

        if (result === 'Use FS tools to append the emoji rule.') {
            console.log('✅ ask_expert Test Passed');
        } else {
            console.error('❌ ask_expert Test Failed: Unexpected result');
            process.exit(1);
        }
    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

testExpert();
