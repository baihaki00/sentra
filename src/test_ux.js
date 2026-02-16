const SentraCore = require('./core');

async function testFinalAnswer() {
    console.log('--- Testing Final Answer & Auto-Start ---');

    const core = new SentraCore();
    await core.start();

    // Mocking the adapter to simulate "Ollama not running" -> "Spawn" flow would be hard without killing real ollama
    // So we just test the final_answer logic here.

    console.log('\n[Test] Task: What is 2 + 2? (Expecting explicit answer)');

    console.log('\n[Test] Task: What is 2 + 2? (Expecting explicit answer)');

    // We mock the plan to simulate a multi-turn ReAct flow
    // Turn 1: Planner returns "echo calculation"
    // Turn 2: Planner returns "final_answer"
    let turn = 0;
    core.agent.components.models.generatePlan = async () => {
        turn++;
        if (turn === 1) {
            console.log('[MockModel] Generating step 1: echo');
            return [{ type: 'echo', args: { message: 'Calculating...' } }];
        }
        if (turn === 2) {
            console.log('[MockModel] Generating step 2: final_answer');
            return [{ type: 'final_answer', args: { text: 'The answer is 4.' } }];
        }
        return [];
    };

    try {
        const result = await core.agent.startTask('What is 2 + 2?');
        console.log('\n[Test] Task Result:', result);

        if (result === 'The answer is 4.') {
            console.log('[Test] SUCCESS: Received final answer.');
        } else {
            console.error('[Test] FAILURE: Did not receive final answer.');
        }
    } catch (err) {
        console.error('\n[Test] Task Failed:', err);
    }

    await core.stop();
}

testFinalAnswer().catch(console.error);
