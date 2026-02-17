/**
 * Sentra: Comprehensive Regression Test Suite
 * Tests ALL modules end-to-end and individually.
 * Run: node src/test_regression.js
 */
const path = require('path');
const fs = require('fs');

// Track results
const results = { passed: 0, failed: 0, errors: [] };

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
// 1. AGENT MODULE
// ==========================================
async function testAgent() {
    console.log('\n━━━ 1. Agent Module ━━━');
    const Agent = require('./core/Agent');

    const config = { models: { default: 'mock' }, agent: { name: 'Sentra' } };
    const agent = new Agent(config);

    assert(agent.state === 'IDLE', 'Agent starts in IDLE state');
    assert(agent.components.cognitive !== undefined, 'CognitiveEngine initialized');
    assert(agent.components.engineer !== undefined, 'Engineer initialized');
    assert(agent.components.reflector !== undefined, 'Reflector initialized');
    assert(agent.components.skills !== undefined, 'SkillManager initialized');
    assert(agent.components.reinforcement !== undefined, 'ReinforcementManager initialized');
    assert(typeof agent.log === 'function', 'Agent.log is a function');

    // Test EventEmitter
    let logReceived = false;
    agent.on('log', () => { logReceived = true; });
    agent.log('test');
    assert(logReceived === true, 'Agent emits log events');

    // Test state transition
    await agent.transition('TEST_STATE', null);
    assert(agent.state === 'TEST_STATE', 'Agent transitions states correctly');

    // Test stop
    agent.state = 'RUNNING';
    agent.stop();
    assert(agent.abortSignal === true, 'Agent sets abortSignal on stop');
}

// ==========================================
// 2. ENGINEER MODULE  
// ==========================================
async function testEngineer() {
    console.log('\n━━━ 2. Engineer Module ━━━');
    const Agent = require('./core/Agent');
    const config = { models: { default: 'mock' } };
    const agent = new Agent(config);
    const engineer = agent.components.engineer;

    // Test readCode
    const testFile = path.join(process.cwd(), 'data', '_test_engineer_target.js');
    fs.writeFileSync(testFile, 'console.log("hello");', 'utf8');
    const content = engineer.readCode(testFile);
    assert(content === 'console.log("hello");', 'readCode reads file correctly');

    // Test readCode non-existent
    const missing = engineer.readCode('/nonexistent/file.js');
    assert(missing === null, 'readCode returns null for missing file');

    // Test writeCode (with backup)
    const result = engineer.writeCode(testFile, 'console.log("world");');
    assert(result.success === true, 'writeCode succeeds');
    assert(result.backupPath !== null, 'writeCode creates backup');

    const newContent = fs.readFileSync(testFile, 'utf8');
    assert(newContent === 'console.log("world");', 'writeCode writes correct content');

    // Test patchCode
    const patchResult = engineer.patchCode(testFile, 'world', 'patched');
    assert(patchResult.success === true, 'patchCode succeeds');
    const patched = fs.readFileSync(testFile, 'utf8');
    assert(patched.includes('patched'), 'patchCode applies patch correctly');

    // Test patchCode with missing search string
    const badPatch = engineer.patchCode(testFile, 'NONEXISTENT_STRING', 'replacement');
    assert(badPatch.success === false, 'patchCode fails gracefully for missing search string');

    // Cleanup
    fs.unlinkSync(testFile);
}

// ==========================================
// 3. TESTER MODULE
// ==========================================
async function testTester() {
    console.log('\n━━━ 3. Tester Module ━━━');
    const Tester = require('./core/Tester');
    const mockAgent = { log: () => { } };
    const tester = new Tester(mockAgent);

    // Test passing script
    const passFile = path.join(process.cwd(), 'data', '_test_pass.js');
    fs.writeFileSync(passFile, 'console.log("OK"); process.exit(0);', 'utf8');
    const passResult = await tester.runTest(passFile);
    assert(passResult.passed === true, 'Tester detects passing test');

    // Test failing script
    const failFile = path.join(process.cwd(), 'data', '_test_fail.js');
    fs.writeFileSync(failFile, 'process.exit(1);', 'utf8');
    const failResult = await tester.runTest(failFile);
    assert(failResult.passed === false, 'Tester detects failing test');

    // Cleanup
    fs.unlinkSync(passFile);
    fs.unlinkSync(failFile);
}

// ==========================================
// 4. DEPLOYER MODULE
// ==========================================
async function testDeployer() {
    console.log('\n━━━ 4. Deployer Module ━━━');
    const Deployer = require('./core/Deployer');
    const mockAgent = { log: () => { } };
    const deployer = new Deployer(mockAgent);

    assert(typeof deployer.commit === 'function', 'Deployer has commit method');
    assert(typeof deployer.revert === 'function', 'Deployer has revert method');
}

// ==========================================
// 5. VECTOR MEMORY
// ==========================================
async function testVectorDb() {
    console.log('\n━━━ 5. VectorDb Module ━━━');
    const VectorDb = require('./memory/VectorDb');
    const testDbPath = path.join(process.cwd(), 'data', '_test_vector.db');

    // Clean
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const db = new VectorDb(testDbPath);
    await db.initialize();
    assert(db.db !== null, 'VectorDb initializes SQLite');

    // Store
    const id = await db.store('Open notepad editor', { type: 'test' });
    assert(id > 0, 'VectorDb stores memory and returns ID');

    // Search
    const results = await db.search('text editor', 3);
    assert(results.length > 0, 'VectorDb returns search results');
    assert(results[0].similarity > 0, 'VectorDb computes positive similarity');

    // Edge: Empty search
    const empty = await db.search('xyzzy quantum flux', 3);
    assert(Array.isArray(empty), 'VectorDb handles no-match gracefully');

    // Cosine similarity edge cases
    assert(db.cosineSimilarity([], []) === 0, 'Cosine: handles empty vectors');
    assert(db.cosineSimilarity([1, 0], [0, 1]) === 0, 'Cosine: orthogonal = 0');
    assert(db.cosineSimilarity([1, 0], [1, 0]) === 1, 'Cosine: identical = 1');

    // Cleanup
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

// ==========================================
// 6. MEMORY MANAGER
// ==========================================
async function testMemoryManager() {
    console.log('\n━━━ 6. MemoryManager Module ━━━');
    const MemoryManager = require('./memory/MemoryManager');

    const mm = new MemoryManager({ baseDir: './data', vectorDbPath: './data/_test_mm.db' });

    // Working memory
    await mm.set('key1', 'value1');
    const val = await mm.get('key1');
    assert(val === 'value1', 'Working memory set/get works');

    assert(typeof mm.rememberSuccess === 'function', 'rememberSuccess method exists');
    assert(typeof mm.searchMemory === 'function', 'searchMemory method exists');

    // Cleanup
    if (fs.existsSync('./data/_test_mm.db')) fs.unlinkSync('./data/_test_mm.db');
}

// ==========================================
// 7. COGNITIVE ENGINE
// ==========================================
async function testCognitiveEngine() {
    console.log('\n━━━ 7. CognitiveEngine Module ━━━');
    const CognitiveEngine = require('./core/CognitiveEngine');
    const Agent = require('./core/Agent');

    const config = { models: { default: 'mock' } };
    const agent = new Agent(config);
    const engine = new CognitiveEngine(agent);

    // Mock models
    engine.models.generateCandidates = async () => [
        { thought: 'A', plan: [{ type: 'echo', args: { message: 'a' } }] },
        { thought: 'B', plan: [{ type: 'echo', args: { message: 'b' } }] }
    ];
    engine.models.chat = async () => JSON.stringify({ best_index: 2, reason: 'Better' });
    engine.models.cleanJson = (t) => t;

    const winner = await engine.deliberateTree('test task', {});
    assert(winner !== null, 'deliberateTree returns a result');
    assert(winner.thought === 'B', 'deliberateTree selects correct winner');

    // Edge: All candidates fail
    engine.models.generateCandidates = async () => [
        { thought: 'bad', plan: [] },
        null
    ];
    engine.models.deliberateFast = async () => ({ thought: 'fallback', plan: [{ type: 'echo' }] });
    const fallback = await engine.deliberateTree('test', {});
    assert(fallback.thought === 'fallback', 'deliberateTree falls back when all candidates fail');

    // Edge: Single valid candidate
    engine.models.generateCandidates = async () => [
        { thought: 'solo', plan: [{ type: 'echo', args: {} }] }
    ];
    const solo = await engine.deliberateTree('test', {});
    assert(solo.thought === 'solo', 'deliberateTree handles single candidate (fast path)');
}

// ==========================================
// 8. PIPELINE MODULE
// ==========================================
async function testPipeline() {
    console.log('\n━━━ 8. Pipeline Module ━━━');
    const Pipeline = require('./core/Pipeline');
    const Agent = require('./core/Agent');

    const config = { models: { default: 'mock' } };
    const agent = new Agent(config);
    const pipeline = new Pipeline(agent);

    // Test noop safeguard
    pipeline.consecutiveNoops = 2;
    const noopResult = await pipeline.act({ type: 'noop', args: {} }, { history: [] });
    assert(noopResult.status === 'error', 'Pipeline terminates after 3 consecutive noops');
    assert(noopResult.output.includes('Safeguard'), 'Noop safeguard message is descriptive');

    // Test valid action resets noop counter
    pipeline.consecutiveNoops = 2;
    agent.components.tools = {
        execute: async () => 'mock output',
        config: {}
    };
    const validResult = await pipeline.act({ type: 'echo', args: { message: 'hi' } }, { history: [] });
    assert(pipeline.consecutiveNoops === 0, 'Valid action resets noop counter');

    // Test error handling
    agent.components.tools.execute = async () => { throw new Error('Test Error'); };
    const errorResult = await pipeline.act({ type: 'broken_tool', args: {} }, { history: [] });
    assert(errorResult.status === 'error', 'Pipeline handles tool errors gracefully');

    // Test reflect terminates on final_answer
    const decision = await pipeline.reflect({
        history: [{ tool: 'final_answer', status: 'success', output: 'done' }]
    });
    assert(decision.terminate === true, 'Pipeline terminates on final_answer');
    assert(decision.result === 'done', 'Pipeline returns final_answer result');

    // Test reflect continues on non-final
    const continueDecision = await pipeline.reflect({
        history: [{ tool: 'echo', status: 'success', output: 'hi' }]
    });
    assert(continueDecision.terminate === false, 'Pipeline continues on non-final tools');
}

// ==========================================
// 9. CONFIG LOADING
// ==========================================
async function testConfig() {
    console.log('\n━━━ 9. Config Loading ━━━');

    const configPath = path.join(process.cwd(), 'config', 'default.json');
    assert(fs.existsSync(configPath), 'Config file exists');

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert(config.server !== undefined, 'Config has server section');
    assert(config.server.port === 3000, 'Server port is 3000');
    assert(config.memory !== undefined, 'Config has memory section');
    assert(config.models !== undefined, 'Config has models section');
    assert(config.security !== undefined, 'Config has security section');
}

// ==========================================
// 10. CORE INTEGRATION (Startup)
// ==========================================
async function testCoreStartup() {
    console.log('\n━━━ 10. Core Integration (Startup) ━━━');

    // Test that core.js loads without crashing
    try {
        const SentraCore = require('./core');
        const sentra = new SentraCore();
        assert(sentra !== null, 'SentraCore instantiates without crash');
        assert(sentra.isRunning === false, 'SentraCore starts not-running');
        assert(sentra.agent !== null, 'SentraCore has an agent');
        assert(sentra.server !== null, 'SentraCore has a server');
    } catch (e) {
        assert(false, `SentraCore crashed on load: ${e.message}`);
    }
}

// ==========================================
// RUN ALL
// ==========================================
async function runAll() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   SENTRA REGRESSION TEST SUITE       ║');
    console.log('╚══════════════════════════════════════╝');

    const suites = [
        testAgent,
        testEngineer,
        testTester,
        testDeployer,
        testVectorDb,
        testMemoryManager,
        testCognitiveEngine,
        testPipeline,
        testConfig,
        testCoreStartup
    ];

    for (const suite of suites) {
        try {
            await suite();
        } catch (e) {
            results.failed++;
            results.errors.push(`${suite.name} CRASHED: ${e.message}`);
            console.error(`  💥 ${suite.name} CRASHED: ${e.message}`);
        }
    }

    // Summary
    console.log('\n══════════════════════════════════════');
    console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
    if (results.errors.length > 0) {
        console.log('Failures:');
        results.errors.forEach(e => console.log(`  ❌ ${e}`));
    }
    console.log('══════════════════════════════════════');

    if (results.failed > 0) {
        process.exit(1);
    } else {
        console.log('🎉 ALL TESTS PASSED');
    }
}

runAll();
