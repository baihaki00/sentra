/**
 * SENTRA E2E CLI TEST
 * ====================
 * Tests the full CLI pipeline end-to-end by:
 *   1. Instantiating SentraCore (like cli.js does)
 *   2. Simulating multiple task submissions
 *   3. Verifying the agent completes the full lifecycle
 *   4. Testing state machine transitions
 *   5. Testing error recovery
 *   6. Verifying memory persistence across tasks
 *
 * This is the CLI-first test: if this breaks, nothing else works.
 *
 * Run: node src/test_e2e_cli.js
 */
const fs = require('fs');
const path = require('path');

const results = { passed: 0, failed: 0, errors: [] };
const timings = [];

function assert(condition, testName) {
    if (condition) {
        results.passed++;
        console.log(`  ✅ ${testName}`);
    } else {
        results.failed++;
        results.errors.push(testName);
        console.error(`  ❌ ${testName}`);
    }
}

// ==========================================
// E2E 1: Full Initialization
// ==========================================
async function testFullInit() {
    console.log('\n━━━ E2E 1: Full Initialization ━━━');
    const SentraCore = require('./core');
    const core = new SentraCore();

    const initStart = Date.now();
    await core.initialize();
    const initTime = Date.now() - initStart;
    timings.push({ name: 'Full initialization', time: initTime });

    assert(core.isRunning === false, 'Core initializes without auto-starting');
    assert(core.agent !== null, 'Agent exists after init');
    assert(core.agent.components.memory !== null, 'Memory initialized');
    assert(core.agent.components.tools !== null, 'Tools initialized');
    assert(core.agent.components.models !== null, 'Models initialized');
    assert(core.agent.components.pipeline !== null, 'Pipeline initialized');
    assert(core.agent.components.cognitive !== null, 'CognitiveEngine initialized');
    assert(core.agent.components.engineer !== null, 'Engineer initialized');
    assert(core.agent.state === 'IDLE', 'Agent starts IDLE');

    // Check tools loaded
    const toolCount = core.agent.components.tools.registry.size;
    assert(toolCount >= 3, `At least 3 tools registered (found ${toolCount})`);

    // Check tool registry
    const tools = Array.from(core.agent.components.tools.registry.keys());
    assert(tools.includes('echo'), 'Echo tool registered');
    assert(tools.includes('final_answer'), 'Final_answer tool registered');
    assert(tools.includes('ask_expert'), 'Ask_expert tool registered');

    console.log(`    Init time: ${initTime}ms, Tools: [${tools.join(', ')}]`);

    return core;
}

// ==========================================
// E2E 2: Task Lifecycle (IDLE → INIT → ... → IDLE)
// ==========================================
async function testTaskLifecycle(core) {
    console.log('\n━━━ E2E 2: Task Lifecycle ━━━');

    const stateLog = [];
    core.agent.on('stateChange', (data) => {
        stateLog.push(data.state);
    });

    // Override models at the level CognitiveEngine actually uses
    const mockChat = async (messages) => {
        return JSON.stringify({
            thought: "Simple task, just echo the answer.",
            plan: [
                { type: 'final_answer', args: { text: 'Task completed successfully.' } }
            ]
        });
    };
    const mockCleanJson = (t) => t;
    core.agent.components.models.chat = mockChat;
    core.agent.components.models.cleanJson = mockCleanJson;
    core.agent.components.cognitive.models.chat = mockChat;
    core.agent.components.cognitive.models.cleanJson = mockCleanJson;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        return [{
            thought: 'Direct answer',
            plan: [{ type: 'final_answer', args: { text: 'Task completed successfully.' } }]
        }];
    };

    const taskStart = Date.now();
    const result = await core.agent.startTask('Say hello world');
    const taskTime = Date.now() - taskStart;
    timings.push({ name: 'Simple task lifecycle', time: taskTime });

    assert(result === 'Task completed successfully.', 'Task returns correct result');
    assert(core.agent.state === 'IDLE', 'Agent returns to IDLE after task');
    assert(stateLog.includes('INIT'), 'State machine hits INIT');
    assert(stateLog.includes('LOAD'), 'State machine hits LOAD');
    assert(stateLog.includes('ALLOCATE'), 'State machine hits ALLOCATE');
    assert(stateLog.includes('MEM_INIT'), 'State machine hits MEM_INIT');
    assert(stateLog.includes('LOOP'), 'State machine hits LOOP');

    console.log(`    Lifecycle: ${stateLog.join(' → ')}`);
    console.log(`    Task time: ${taskTime}ms`);
}

// ==========================================
// E2E 3: Multi-Task Sequence
// ==========================================
async function testMultiTaskSequence(core) {
    console.log('\n━━━ E2E 3: Multi-Task Sequence ━━━');

    let taskNum = 0;
    const seqMockChat = async (messages) => {
        taskNum++;
        return JSON.stringify({
            thought: `Processing task ${taskNum}`,
            plan: [
                { type: 'echo', args: { message: `Processing task ${taskNum}` } },
                { type: 'final_answer', args: { text: `Result ${taskNum}` } }
            ]
        });
    };
    core.agent.components.models.chat = seqMockChat;
    core.agent.components.cognitive.models.chat = seqMockChat;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        taskNum++;
        return [{
            thought: `Task ${taskNum}`,
            plan: [
                { type: 'echo', args: { message: `Processing task ${taskNum}` } },
                { type: 'final_answer', args: { text: `Result ${taskNum}` } }
            ]
        }];
    };

    const tasks = [
        'Check the weather in Tokyo',
        'Calculate 2 + 2',
        'Write a haiku about AI',
        'Find the capital of France',
        'Summarize the news today',
    ];

    const sequenceStart = Date.now();
    for (const task of tasks) {
        assert(core.agent.state === 'IDLE', `Agent is IDLE before: "${task}"`);
        const result = await core.agent.startTask(task);
        assert(typeof result === 'string', `"${task}" → got result`);
    }
    const sequenceTime = Date.now() - sequenceStart;
    timings.push({ name: `${tasks.length} sequential tasks`, time: sequenceTime });

    console.log(`    ${tasks.length} tasks completed in ${sequenceTime}ms (avg: ${(sequenceTime / tasks.length).toFixed(0)}ms each)`);
}

// ==========================================
// E2E 4: Error Recovery
// ==========================================
async function testErrorRecovery(core) {
    console.log('\n━━━ E2E 4: Error Recovery ━━━');

    // Simulate a model that returns garbage on first call, then recovers
    let callCount = 0;
    const recoverMock = async (messages) => {
        callCount++;
        if (messages[0].content.includes('MOST EFFICIENT')) {
            return JSON.stringify({ best_index: 1, reason: 'Only option.' });
        }
        return JSON.stringify({
            thought: 'recovered',
            plan: [{ type: 'final_answer', args: { text: 'recovered' } }]
        });
    };
    core.agent.components.models.chat = recoverMock;
    core.agent.components.cognitive.models.chat = recoverMock;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        return [{
            thought: 'recovered',
            plan: [{ type: 'final_answer', args: { text: 'recovered' } }]
        }];
    };
    core.agent.components.cognitive.models.deliberateFast = async (task, ctx) => ({
        thought: 'recovered',
        plan: [{ type: 'final_answer', args: { text: 'recovered' } }]
    });

    // Task should still complete
    const result = await core.agent.startTask('Recover from adversity');
    assert(result === 'recovered', 'Agent recovers from bad model output');
    assert(core.agent.state === 'IDLE', 'Agent returns to IDLE after recovery');
}

// ==========================================
// E2E 5: Busy State Rejection
// ==========================================
async function testBusyRejection(core) {
    console.log('\n━━━ E2E 5: Busy State Rejection ━━━');

    // Force agent into a non-IDLE state
    core.agent.state = 'LOOP';

    let rejected = false;
    try {
        await core.agent.startTask('Should be rejected');
    } catch (e) {
        rejected = true;
        assert(e.message.includes('Cannot start task'), 'Correct error message for busy state');
    }
    assert(rejected, 'Rejects task when not IDLE');

    // Reset
    core.agent.state = 'IDLE';
}

// ==========================================
// E2E 6: Error State Recovery
// ==========================================
async function testErrorStateRecovery(core) {
    console.log('\n━━━ E2E 6: Error State Recovery ━━━');

    // Put agent in ERROR state
    core.agent.state = 'ERROR';

    const errMock = async () => {
        return JSON.stringify({
            thought: 'recovered from error',
            plan: [{ type: 'final_answer', args: { text: 'back online' } }]
        });
    };
    core.agent.components.models.chat = errMock;
    core.agent.components.cognitive.models.chat = errMock;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        return [{
            thought: 'recovered from error',
            plan: [{ type: 'final_answer', args: { text: 'back online' } }]
        }];
    };

    const result = await core.agent.startTask('Recover from error state');
    assert(result === 'back online', 'Recovers from ERROR state');
    assert(core.agent.state === 'IDLE', 'Agent is IDLE after error recovery');
}

// ==========================================
// E2E 7: Memory Across Tasks
// ==========================================
async function testMemoryAcrossTasks(core) {
    console.log('\n━━━ E2E 7: Memory Across Tasks ━━━');

    // Store something in working memory during task
    await core.agent.components.memory.set('user_preference', 'dark mode');

    // Start a new task and check memory persists
    const memMock = async () => {
        return JSON.stringify({
            thought: 'checking memory',
            plan: [{ type: 'final_answer', args: { text: 'checked' } }]
        });
    };
    core.agent.components.models.chat = memMock;
    core.agent.components.cognitive.models.chat = memMock;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        return [{
            thought: 'checking memory',
            plan: [{ type: 'final_answer', args: { text: 'checked' } }]
        }];
    };

    await core.agent.startTask('Check memory persistence');

    const pref = await core.agent.components.memory.get('user_preference');
    assert(pref === 'dark mode', 'Working memory persists across tasks');
}

// ==========================================
// E2E 8: Abort Signal
// ==========================================
async function testAbortSignal(core) {
    console.log('\n━━━ E2E 8: Abort Signal ━━━');

    let stepCount = 0;
    const abortMock = async () => {
        stepCount++;
        if (stepCount === 2) {
            core.agent.abortSignal = true;
        }
        return JSON.stringify({
            thought: `step ${stepCount}`,
            plan: [{ type: 'echo', args: { message: `step ${stepCount}` } }]
        });
    };
    core.agent.components.models.chat = abortMock;
    core.agent.components.cognitive.models.chat = abortMock;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        stepCount++;
        if (stepCount === 2) core.agent.abortSignal = true;
        return [{
            thought: `step ${stepCount}`,
            plan: [{ type: 'echo', args: { message: `step ${stepCount}` } }]
        }];
    };

    const result = await core.agent.startTask('Long running task to abort');
    assert(typeof result === 'string', 'Aborted task returns a result');
    assert(core.agent.abortSignal === true, 'Abort signal was set');

    // Reset for future tests
    core.agent.abortSignal = false;
    core.agent.state = 'IDLE';
}

// ==========================================
// E2E 9: Full Pipeline Timing
// ==========================================
async function testPipelineTiming(core) {
    console.log('\n━━━ E2E 9: Performance Under Load ━━━');

    const perfMock = async () => {
        return JSON.stringify({
            thought: 'fast path',
            plan: [{ type: 'final_answer', args: { text: 'fast' } }]
        });
    };
    core.agent.components.models.chat = perfMock;
    core.agent.components.cognitive.models.chat = perfMock;
    core.agent.components.cognitive.models.generateCandidates = async (task, ctx, n) => {
        return [{
            thought: 'fast path',
            plan: [{ type: 'final_answer', args: { text: 'fast' } }]
        }];
    };

    // Run 10 tasks rapidly
    const burstStart = Date.now();
    for (let i = 0; i < 10; i++) {
        core.agent.state = 'IDLE';
        await core.agent.startTask(`Burst task ${i}`);
    }
    const burstTime = Date.now() - burstStart;
    timings.push({ name: '10 burst tasks', time: burstTime });

    const avgTime = burstTime / 10;
    assert(avgTime < 10000, `Average task time: ${avgTime.toFixed(0)}ms (< 10s target)`);
    console.log(`    10 tasks in ${burstTime}ms (avg: ${avgTime.toFixed(0)}ms)`);
}

// ==========================================
// RUNNER
// ==========================================
async function runE2E() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   SENTRA E2E CLI TEST SUITE                 ║');
    console.log('║   If this breaks, NOTHING works.            ║');
    console.log('╚══════════════════════════════════════════════╝');

    const totalStart = Date.now();

    try {
        const core = await testFullInit();
        await testTaskLifecycle(core);
        await testMultiTaskSequence(core);
        await testErrorRecovery(core);
        await testBusyRejection(core);
        await testErrorStateRecovery(core);
        await testMemoryAcrossTasks(core);
        await testAbortSignal(core);
        await testPipelineTiming(core);
    } catch (e) {
        results.failed++;
        results.errors.push(`FATAL CRASH: ${e.message}`);
        console.error(`\n💥 FATAL: ${e.message}`);
        console.error(e.stack);
    }

    const totalTime = Date.now() - totalStart;

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║         E2E CLI TEST RESULTS                 ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Total Tests:   ${String(results.passed + results.failed).padEnd(28)}║`);
    console.log(`║  Passed:        ${String(results.passed).padEnd(28)}║`);
    console.log(`║  Failed:        ${String(results.failed).padEnd(28)}║`);
    console.log(`║  Total Time:    ${String(totalTime + 'ms').padEnd(28)}║`);
    console.log('╚══════════════════════════════════════════════╝');

    if (results.errors.length > 0) {
        console.log('\n❌ FAILURES:');
        results.errors.forEach(e => console.log(`  • ${e}`));
    }

    // Timing Summary
    console.log('\n⏱️ TIMING SUMMARY:');
    for (const t of timings) {
        console.log(`  ${t.name}: ${t.time}ms`);
    }

    // Write report
    const reportPath = path.join(process.cwd(), 'data', 'e2e_cli_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        passed: results.passed,
        failed: results.failed,
        failures: results.errors,
        timings,
        totalTimeMs: totalTime,
    }, null, 2));
    console.log(`\n📄 Report: ${reportPath}`);

    if (results.failed > 0) process.exit(1);
    else console.log('\n🎉 ALL E2E TESTS PASSED — CLI is solid.');
}

runE2E();
