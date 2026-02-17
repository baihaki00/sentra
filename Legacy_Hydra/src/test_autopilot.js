const SentraCore = require('./core');
const fs = require('fs');

const tests = [
    {
        name: 'Simple Fact (System 1)',
        prompt: 'What is the capital of France?',
        verify: (output) => /Paris/i.test(output)
    },
    {
        name: 'Math Calculation (System 1/Code)',
        prompt: 'Calculate 12 * 15 + 20',
        verify: (output) => /200/.test(output)
    },
    {
        name: 'Web Retrieval (System 2 + Web)',
        prompt: 'Who is the CEO of Microsoft as of 2025?',
        verify: (output) => /Satya/i.test(output) || /Nadella/i.test(output)
    },
    {
        name: 'Coding Task (System 2 + FS)',
        prompt: 'Write a python script "hello_sentra.py" that prints "Hello Sentra Autopilot"',
        verify: (output, agent) => {
            if (fs.existsSync('hello_sentra.py')) {
                const content = fs.readFileSync('hello_sentra.py', 'utf8');
                return content.includes('Hello Sentra Autopilot');
            }
            return false;
        }
    }
];

async function runTests() {
    console.log('🤖 Starting Autopilot Verification Sequence...');
    let passedCount = 0;

    for (const test of tests) {
        console.log(`\n================================`);
        console.log(`🧪 TEST: ${test.name}`);
        console.log(`📝 PROMPT: "${test.prompt}"`);
        console.log(`================================`);

        const core = new SentraCore();
        await core.initialize();
        const agent = core.agent;

        // Suppress logs for cleaner output
        // agent.log = () => {}; 

        // Set task
        agent.context.task = test.prompt;

        try {
            // agent.start() only starts the server. We need startTask() to run the pipeline.
            await agent.startTask(test.prompt);

            // Extract answer
            const history = agent.context.history || [];
            let finalAnswer = "";

            const finalTool = history.find(h => h.tool === 'final_answer');
            if (finalTool) {
                finalAnswer = finalTool.args.text || finalTool.args.answer || JSON.stringify(finalTool.args);
            } else if (agent.context.result) {
                finalAnswer = agent.context.result;
            }

            console.log(`\n📤 OUTPUT: ${finalAnswer}`);

            const success = test.verify(finalAnswer, agent);
            if (success) {
                console.log(`✅ PASSED`);
                passedCount++;
            } else {
                console.error(`❌ FAILED`);
            }

        } catch (error) {
            console.error(`❌ EXCEPTION:`, error);
        }

        // Cleanup
        if (test.name.includes('Coding')) {
            try { fs.unlinkSync('hello_sentra.py'); } catch (e) { }
        }
    }

    console.log(`\n================================`);
    console.log(`🏁 SUMMARY: ${passedCount}/${tests.length} PAST`);
    console.log(`================================`);
}

runTests();
