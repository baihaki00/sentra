/**
 * SENTRA STRESS TEST HARNESS
 * ===========================
 * Tests Sentra's cognitive pipeline across 8 categories:
 *   1. Absurd Complexity ("Build a rocket ship")
 *   2. Multi-step Reasoning (Research + Synthesis)
 *   3. Code Engineering (Read/Write/Patch/Verify)
 *   4. Error Recovery (Broken tools, missing files)
 *   5. Edge Cases (Empty input, XSS, injection)
 *   6. Memory (Store/Recall across tasks)
 *   7. Performance (Latency measurement)
 *   8. Abort/Timeout (Graceful degradation)
 *
 * Run: node src/test_stress.js
 */
const Agent = require('./core/Agent');
const Pipeline = require('./core/Pipeline');
const CognitiveEngine = require('./core/CognitiveEngine');
const MemoryManager = require('./memory/MemoryManager');
const VectorDb = require('./memory/VectorDb');
const fs = require('fs');
const path = require('path');

// ==========================================
// TEST INFRASTRUCTURE
// ==========================================
const benchmarks = [];
const results = { passed: 0, failed: 0, errors: [], warnings: [] };

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

function warn(message) {
    results.warnings.push(message);
    console.log(`  ⚠️ ${message}`);
}

function benchmark(name, startTime) {
    const elapsed = Date.now() - startTime;
    benchmarks.push({ name, elapsed });
    return elapsed;
}

function createMockAgent() {
    const config = { models: { default: 'mock' }, agent: { name: 'Sentra' } };
    const agent = new Agent(config);
    agent.log = (msg) => { }; // Suppress logs during stress test
    return agent;
}

function createMockModels(engine) {
    // Default: returns a simple plan
    engine.models.chat = async (messages) => {
        const prompt = messages[0].content;

        // Plan generation mock
        if (prompt.includes('Produce a JSON plan') || prompt.includes('Return a JSON array')) {
            return JSON.stringify({
                thought: "I need to analyze this task systematically.",
                plan: [
                    { type: 'google_search', args: { query: 'relevant info' } },
                ]
            });
        }

        // Ranking mock
        if (prompt.includes('MOST EFFICIENT and SAFE')) {
            return JSON.stringify({ best_index: 1, reason: 'Most efficient approach.' });
        }

        return JSON.stringify({ thought: 'Thinking...', plan: [{ type: 'echo', args: { message: 'ok' } }] });
    };
    engine.models.cleanJson = (t) => t;
    engine.models.deliberateFast = async (task, ctx) => ({
        thought: `Analyzing: ${task}`,
        plan: [{ type: 'echo', args: { message: 'deliberated' } }]
    });
}

// ==========================================
// CATEGORY 1: ABSURD COMPLEXITY
// ==========================================
async function testAbsurdTasks() {
    console.log('\n━━━ CAT 1: Absurd Complexity ━━━');
    const agent = createMockAgent();
    const engine = new CognitiveEngine(agent);
    createMockModels(engine);

    const absurdTasks = [
        "Build a rocket ship for me",
        "Create an AI that passes the Turing test",
        "Hack into NASA's mainframe and download their secret files",
        "Write an operating system from scratch in one step",
        "Solve world hunger using only JavaScript",
        "Travel back in time and prevent Y2K",
    ];

    for (const task of absurdTasks) {
        const start = Date.now();
        try {
            const result = await engine.deliberateTree(task, { history: [] });
            const elapsed = benchmark(`Absurd: ${task.substring(0, 30)}...`, start);

            assert(result !== null && result !== undefined, `Handles absurd task: "${task.substring(0, 40)}..."`);
            assert(result.plan && result.plan.length > 0, `  └─ Produces a plan (not empty)`);
            assert(elapsed < 5000, `  └─ Completes within 5s (took ${elapsed}ms)`);
        } catch (e) {
            assert(false, `Crashed on absurd task: "${task.substring(0, 40)}..." → ${e.message}`);
        }
    }
}

// ==========================================
// CATEGORY 2: MULTI-STEP REASONING
// ==========================================
async function testMultiStepReasoning() {
    console.log('\n━━━ CAT 2: Multi-Step Reasoning ━━━');
    const agent = createMockAgent();
    const engine = new CognitiveEngine(agent);
    createMockModels(engine);

    // Override to return multi-step plans
    engine.models.generateCandidates = async (task, ctx, n) => {
        return [
            {
                thought: "Need to search, then read, then synthesize.",
                plan: [
                    { type: 'google_search', args: { query: task } },
                    { type: 'browser_read', args: {} },
                    { type: 'final_answer', args: { text: 'Synthesized answer.' } }
                ]
            },
            {
                thought: "Direct answer attempt.",
                plan: [
                    { type: 'final_answer', args: { text: 'Quick answer.' } }
                ]
            },
            {
                thought: "Need memory lookup first.",
                plan: [
                    { type: 'recall_memory', args: { query: task } },
                    { type: 'final_answer', args: { text: 'Memory-based answer.' } }
                ]
            }
        ];
    };

    const complexTasks = [
        "What is the current price of Bitcoin and how has it changed in the last 24 hours?",
        "Compare the performance of Node.js vs Deno vs Bun for HTTP servers",
        "Find the top 3 most cited papers on transformer architectures published in 2024",
    ];

    for (const task of complexTasks) {
        const start = Date.now();
        const result = await engine.deliberateTree(task, { history: [] });
        const elapsed = benchmark(`MultiStep: ${task.substring(0, 30)}...`, start);

        assert(result.plan.length >= 1, `Multi-step plan generated for: "${task.substring(0, 40)}..."`);
        assert(elapsed < 3000, `  └─ Completes within 3s (took ${elapsed}ms)`);
    }
}

// ==========================================
// CATEGORY 3: CODE ENGINEERING
// ==========================================
async function testCodeEngineering() {
    console.log('\n━━━ CAT 3: Code Engineering ━━━');
    const agent = createMockAgent();
    const engineer = agent.components.engineer;

    // Test complex write + patch + verify cycle
    const testDir = path.join(process.cwd(), 'data', '_stress_test');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const targetFile = path.join(testDir, 'app.js');

    // 1. Write initial code
    const writeResult = engineer.writeCode(targetFile, `
function add(a, b) {
    return a + b;
}
function subtract(a, b) {
    return a - b;
}
module.exports = { add, subtract };
`);
    assert(writeResult.success, 'Engineer writes complex file');

    // 2. Patch: Add multiply function
    const patchResult = engineer.patchCode(targetFile,
        'module.exports = { add, subtract };',
        'function multiply(a, b) {\n    return a * b;\n}\nmodule.exports = { add, subtract, multiply };'
    );
    assert(patchResult.success, 'Engineer patches file (add function)');

    // 3. Verify: Read back and check
    const content = engineer.readCode(targetFile);
    assert(content.includes('multiply'), 'Patched content contains new function');
    assert(content.includes('add'), 'Patched content preserves original functions');
    assert(content.includes('subtract'), 'Patched content preserves all functions');

    // 4. Write test
    const testFile = path.join(testDir, 'app_test.js');
    engineer.writeCode(testFile, `
const { add, subtract, multiply } = require('./app');
if (add(2, 3) !== 5) throw new Error('add failed');
if (subtract(5, 3) !== 2) throw new Error('subtract failed');
if (multiply(3, 4) !== 12) throw new Error('multiply failed');
console.log('All tests passed');
`);

    // 5. Verify
    const verifyResult = await engineer.verify(`node "${testFile}"`);
    assert(verifyResult === true, 'Engineer verifies code passes tests');

    // 6. Deliberately break code and verify it fails
    engineer.writeCode(targetFile, 'throw new Error("broken");');
    const breakResult = await engineer.verify(`node "${testFile}"`);
    assert(breakResult === false, 'Engineer detects broken code');

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
}

// ==========================================
// CATEGORY 4: ERROR RECOVERY
// ==========================================
async function testErrorRecovery() {
    console.log('\n━━━ CAT 4: Error Recovery ━━━');
    const agent = createMockAgent();
    const pipeline = new Pipeline(agent);

    // Mock tools that throw errors
    agent.components.tools = {
        execute: async (type, args) => {
            if (type === 'broken_tool') throw new Error('Connection refused');
            if (type === 'timeout_tool') {
                await new Promise(r => setTimeout(r, 100));
                throw new Error('Timeout');
            }
            if (type === 'null_tool') return null;
            if (type === 'undefined_tool') return undefined;
            if (type === 'empty_tool') return '';
            return `Result for ${type}`;
        },
        config: {}
    };
    agent.context = { assets: [] };

    // Test broken tool
    const broken = await pipeline.act({ type: 'broken_tool', args: {} }, { history: [] });
    assert(broken.status === 'error', 'Handles broken tool gracefully');
    assert(broken.output.includes('Connection refused'), 'Captures error message');

    // Test timeout tool
    const timeout = await pipeline.act({ type: 'timeout_tool', args: {} }, { history: [] });
    assert(timeout.status === 'error', 'Handles timeout gracefully');

    // Test null output
    const nullResult = await pipeline.act({ type: 'null_tool', args: {} }, { history: [] });
    assert(nullResult.status === 'success', 'Handles null output without crash');

    // Test undefined output
    const undefResult = await pipeline.act({ type: 'undefined_tool', args: {} }, { history: [] });
    assert(undefResult.status === 'success', 'Handles undefined output without crash');

    // Test empty output
    const emptyResult = await pipeline.act({ type: 'empty_tool', args: {} }, { history: [] });
    assert(emptyResult.status === 'success', 'Handles empty string output');

    // Test cascading errors (3 noops then recovery)
    pipeline.consecutiveNoops = 0;
    await pipeline.act({ type: 'noop', args: {} }, { history: [] }); // 1
    await pipeline.act({ type: 'noop', args: {} }, { history: [] }); // 2
    const thirdNoop = await pipeline.act({ type: 'noop', args: {} }, { history: [] }); // 3 -> safeguard
    assert(thirdNoop.output.includes('Safeguard'), 'Noop safeguard triggers after 3');
}

// ==========================================
// CATEGORY 5: EDGE CASES & INJECTION
// ==========================================
async function testEdgeCases() {
    console.log('\n━━━ CAT 5: Edge Cases & Injection ━━━');
    const agent = createMockAgent();
    const engine = new CognitiveEngine(agent);
    createMockModels(engine);

    const edgeCases = [
        '', // Empty
        ' ',  // Whitespace
        '🚀🔥💀', // Emoji-only
        'a'.repeat(10000), // Very long
        '<script>alert("xss")</script>', // XSS
        '{"type":"cmd","args":{"command":"rm -rf /"}}', // JSON injection
        'DROP TABLE memories;', // SQL injection
        '\\n\\r\\t\\0', // Control chars
        'null', // Literal null
        'undefined', // Literal undefined
    ];

    for (const input of edgeCases) {
        const label = input.length > 30 ? input.substring(0, 30) + '...' : (input || '(empty)');
        try {
            const result = await engine.deliberateTree(input, { history: [] });
            assert(result !== null, `Edge case doesn't crash: "${label}"`);
        } catch (e) {
            assert(false, `Edge case CRASHED: "${label}" → ${e.message}`);
        }
    }

    // VectorDb injection test
    const testDbPath = path.join(process.cwd(), 'data', '_stress_vector.db');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const db = new VectorDb(testDbPath);
    await db.initialize();

    try {
        await db.store('DROP TABLE memories; --', { evil: true });
        const results = await db.search('SELECT * FROM memories', 3);
        assert(true, 'VectorDb survives SQL injection attempts');
    } catch (e) {
        assert(false, `VectorDb SQL injection crashed: ${e.message}`);
    }

    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

// ==========================================
// CATEGORY 6: MEMORY PERSISTENCE
// ==========================================
async function testMemoryPersistence() {
    console.log('\n━━━ CAT 6: Memory Persistence ━━━');
    const testDbPath = path.join(process.cwd(), 'data', '_stress_mem.db');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    // Session 1: Store memories
    const db1 = new VectorDb(testDbPath);
    await db1.initialize();
    await db1.store('The Creator prefers dark mode interfaces', { type: 'preference' });
    await db1.store('Always use const, never use var in JavaScript', { type: 'rule' });
    await db1.store('EURUSD was at 1.0850 on 2024-01-15', { type: 'fact' });
    await db1.store('Sentra successfully searched Google for AI news', { type: 'success' });
    db1.close();

    // Session 2: Recall memories (simulates restart)
    const db2 = new VectorDb(testDbPath);
    await db2.initialize();

    const darkMode = await db2.search('dark mode interface design', 3);
    assert(darkMode.length > 0, 'Memory persists: preferences recalled');
    assert(darkMode[0].content.includes('dark') || darkMode[0].content.includes('interface'), 'Memory recall: relevant content retrieved');

    const codeStyle = await db2.search('JavaScript variable declaration style', 3);
    assert(codeStyle.length > 0, 'Memory persists: coding rules recalled');

    const forex = await db2.search('Euro Dollar exchange rate', 3);
    assert(forex.length > 0, 'Memory persists: financial data recalled');

    // Test bulk storage (100 memories)
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
        await db2.store(`Memory item number ${i}: random content ${Math.random()}`, { index: i });
    }
    const bulkTime = benchmark('Memory: Bulk write 100 items', start);
    assert(bulkTime < 5000, `Bulk write 100 memories in ${bulkTime}ms (< 5s)`);

    // Test bulk search
    const searchStart = Date.now();
    const bulkResults = await db2.search('random content', 10);
    const searchTime = benchmark('Memory: Search 104 items', searchStart);
    assert(bulkResults.length === 10, `Limited search returns exactly 10 results`);
    assert(searchTime < 2000, `Search over 104 items in ${searchTime}ms (< 2s)`);

    db2.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

// ==========================================
// CATEGORY 7: PERFORMANCE BENCHMARKS
// ==========================================
async function testPerformance() {
    console.log('\n━━━ CAT 7: Performance Benchmarks ━━━');
    const agent = createMockAgent();
    const engine = new CognitiveEngine(agent);
    createMockModels(engine);

    // Override for timing measurement
    engine.models.generateCandidates = async (task, ctx, n) => {
        return Array(n).fill(null).map((_, i) => ({
            thought: `Plan ${i}`,
            plan: [{ type: 'echo', args: { message: `plan ${i}` } }]
        }));
    };

    // Benchmark: deliberateTree
    const treeStart = Date.now();
    for (let i = 0; i < 20; i++) {
        await engine.deliberateTree(`Benchmark task ${i}`, { history: [] });
    }
    const treeTime = benchmark('Performance: 20x deliberateTree', treeStart);
    assert(treeTime < 5000, `20 deliberateTree calls in ${treeTime}ms (< 5s)`);
    const avgTree = (treeTime / 20).toFixed(1);
    console.log(`    Average: ${avgTree}ms per deliberateTree call`);

    // Benchmark: Agent state transitions
    const transStart = Date.now();
    for (let i = 0; i < 100; i++) {
        await agent.transition('STATE_' + i, null);
    }
    const transTime = benchmark('Performance: 100x state transitions', transStart);
    assert(transTime < 1000, `100 state transitions in ${transTime}ms (< 1s)`);

    // Benchmark: Working memory operations
    const mm = new MemoryManager({ baseDir: './data', vectorDbPath: './data/_perf_test.db' });
    const memStart = Date.now();
    for (let i = 0; i < 1000; i++) {
        await mm.set(`key_${i}`, `value_${i}`);
    }
    for (let i = 0; i < 1000; i++) {
        await mm.get(`key_${i}`);
    }
    const memTime = benchmark('Performance: 2000x working memory ops', memStart);
    assert(memTime < 1000, `2000 working memory ops in ${memTime}ms (< 1s)`);

    if (fs.existsSync('./data/_perf_test.db')) fs.unlinkSync('./data/_perf_test.db');
}

// ==========================================
// CATEGORY 8: ABORT & TIMEOUT
// ==========================================
async function testAbortAndTimeout() {
    console.log('\n━━━ CAT 8: Abort & Timeout ━━━');
    const agent = createMockAgent();
    const pipeline = new Pipeline(agent);

    // Setup minimal mocks
    agent.components.memory = {
        set: async () => { },
        get: async () => null,
        commitEpisode: async () => { }
    };
    agent.components.tools = {
        execute: async (type, args) => {
            if (type === 'echo') return args.message || 'ok';
            return 'executed';
        },
        config: {}
    };
    agent.context = { assets: [], task: 'test' };

    // Mock cognitive to return a long plan
    agent.components.cognitive = {
        deliberate: async () => [
            { type: 'echo', args: { message: 'step 1' } },
            { type: 'echo', args: { message: 'step 2' } },
            { type: 'echo', args: { message: 'step 3' } },
            { type: 'echo', args: { message: 'step 4' } },
            { type: 'final_answer', args: { text: 'done' } },
        ]
    };

    // Test normal execution to completion
    let planCalls = 0;
    agent.components.cognitive = {
        deliberate: async () => {
            planCalls++;
            if (planCalls === 1) {
                return [
                    { type: 'echo', args: { message: 'step 1' } },
                    { type: 'echo', args: { message: 'step 2' } },
                    { type: 'final_answer', args: { text: 'done' } },
                ];
            }
            return [{ type: 'final_answer', args: { text: 'done' } }];
        }
    };
    agent.components.tools.execute = async (type, args) => {
        if (type === 'final_answer') return args.text || 'done';
        if (type === 'echo') return args.message || 'ok';
        return 'executed';
    };

    const normalStart = Date.now();
    const normalResult = await pipeline.execute({ task: 'test', history: [] });
    const normalTime = benchmark('Abort: Normal execution', normalStart);
    assert(normalResult === 'done', 'Normal execution completes');

    // Test abort mid-execution
    agent.abortSignal = false;
    agent.components.cognitive = {
        deliberate: async () => {
            // Set abort after first plan
            agent.abortSignal = true;
            return [
                { type: 'echo', args: { message: 'should abort' } },
            ];
        }
    };

    const abortResult = await pipeline.execute({ task: 'abort test', history: [] });
    assert(typeof abortResult === 'string' && abortResult.includes('Terminated'), 'Abort stops execution');

    // Test max step limit
    agent.abortSignal = false;
    let stepCounter = 0;
    agent.components.cognitive = {
        deliberate: async () => {
            stepCounter++;
            return [{ type: 'echo', args: { message: `step ${stepCounter}` } }];
        }
    };
    pipeline.maxSteps = 3;
    const limitResult = await pipeline.execute({ task: 'limit test', history: [] });
    assert(stepCounter <= 4, `Max steps enforced (ran ${stepCounter} planning cycles)`);
}

// ==========================================
// RUNNER
// ==========================================
async function runStressTests() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   SENTRA STRESS TEST HARNESS                ║');
    console.log('║   8 Categories × Multiple Domains           ║');
    console.log('╚══════════════════════════════════════════════╝');

    const totalStart = Date.now();

    const suites = [
        ['Absurd Complexity', testAbsurdTasks],
        ['Multi-Step Reasoning', testMultiStepReasoning],
        ['Code Engineering', testCodeEngineering],
        ['Error Recovery', testErrorRecovery],
        ['Edge Cases & Injection', testEdgeCases],
        ['Memory Persistence', testMemoryPersistence],
        ['Performance Benchmarks', testPerformance],
        ['Abort & Timeout', testAbortAndTimeout],
    ];

    for (const [name, suite] of suites) {
        try {
            await suite();
        } catch (e) {
            results.failed++;
            results.errors.push(`${name} CRASHED: ${e.message}`);
            console.error(`  💥 ${name} CRASHED: ${e.message}`);
            console.error(e.stack);
        }
    }

    const totalTime = Date.now() - totalStart;

    // SUMMARY
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║         STRESS TEST RESULTS                  ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Total Tests:   ${String(results.passed + results.failed).padEnd(28)}║`);
    console.log(`║  Passed:        ${String(results.passed).padEnd(28)}║`);
    console.log(`║  Failed:        ${String(results.failed).padEnd(28)}║`);
    console.log(`║  Warnings:      ${String(results.warnings.length).padEnd(28)}║`);
    console.log(`║  Total Time:    ${String(totalTime + 'ms').padEnd(28)}║`);
    console.log('╚══════════════════════════════════════════════╝');

    if (results.errors.length > 0) {
        console.log('\n❌ FAILURES:');
        results.errors.forEach(e => console.log(`  • ${e}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️ WARNINGS:');
        results.warnings.forEach(w => console.log(`  • ${w}`));
    }

    // BENCHMARKS
    console.log('\n📊 BENCHMARK RESULTS:');
    console.log('┌──────────────────────────────────────────┬──────────┐');
    console.log('│ Operation                                │ Time     │');
    console.log('├──────────────────────────────────────────┼──────────┤');
    for (const b of benchmarks) {
        const name = b.name.substring(0, 40).padEnd(40);
        const time = String(b.elapsed + 'ms').padStart(8);
        console.log(`│ ${name} │ ${time} │`);
    }
    console.log('└──────────────────────────────────────────┴──────────┘');

    // Write results to file for documentation
    const reportPath = path.join(process.cwd(), 'data', 'stress_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: results.passed + results.failed,
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings.length,
            totalTimeMs: totalTime,
        },
        benchmarks,
        failures: results.errors,
        warnings: results.warnings,
    }, null, 2));
    console.log(`\n📄 Full report written to: ${reportPath}`);

    if (results.failed > 0) process.exit(1);
    else console.log('\n🎉 ALL STRESS TESTS PASSED');
}

runStressTests();
