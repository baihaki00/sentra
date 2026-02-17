const Thalamus = require('./core/Thalamus');
const Agent = require('./core/Agent');

// Mock Agent for testing (we don't want to load full models)
class MockAgent {
    constructor() {
        this.logs = [];
    }
    log(msg) { this.logs.push(msg); }
}

async function runBenchmark() {
    console.log('⚡ HYDRA THALAMUS BENCHMARK ⚡');
    console.log('Generating 20,000 synthetic prompts...');

    // Mock Agent and Process.exit
    const agent = new MockAgent();
    // Override process.exit for safety during test
    const originalExit = process.exit;
    process.exit = (code) => { console.log(`[Mock] process.exit(${code}) called.`); };

    const thalamus = new Thalamus(agent);

    // Generate Dataset (Realistic Mix)
    const reflexPrompts = [];
    const cortexPrompts = [];

    for (let i = 0; i < 10000; i++) {
        if (i % 5 === 0) reflexPrompts.push(`calc ${Math.floor(Math.random() * 100)} + ${Math.floor(Math.random() * 100)}`);
        else if (i % 5 === 1) reflexPrompts.push(`calculate ${Math.random().toFixed(2)} * ${Math.random().toFixed(2)}`);
        else if (i % 5 === 2) reflexPrompts.push(`echo System Status: ${Math.random()}`);
        else if (i % 5 === 3) reflexPrompts.push(`check exists "config.json"`);
        else reflexPrompts.push(`stop process`);
    }

    for (let i = 0; i < 10000; i++) {
        if (i % 5 === 0) cortexPrompts.push(`Write a poem about AI number ${i}`);
        else if (i % 5 === 1) cortexPrompts.push(`Analyze the sentiment of this text: "Hello world"`);
        else if (i % 5 === 2) cortexPrompts.push(`Find the latest news about OpenAI`);
        else if (i % 5 === 3) cortexPrompts.push(`Debug this python script: def foo(): pass`);
        else cortexPrompts.push(`Plan a trip to Tokyo`);
    }

    // Save dataset for transparency
    const fs = require('fs');
    const path = require('path');
    const outDir = path.join(__dirname, '../data/evaluation');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
        path.join(outDir, 'hydra_benchmark_prompts.json'),
        JSON.stringify({ reflex: reflexPrompts, cortex: cortexPrompts }, null, 2)
    );
    console.log(`✅ Dataset Saved to data/evaluation/hydra_benchmark_prompts.json`);
    console.log('✅ Dataset Ready. Starting processing...');

    // 1. Benchmark Reflex Layer
    const startReflex = process.hrtime();
    let reflexHits = 0;
    for (const p of reflexPrompts) {
        const route = await thalamus.route(p);
        if (route.layer === 'REFLEX') reflexHits++;
    }
    const endReflex = process.hrtime(startReflex);
    const timeReflex = (endReflex[0] * 1000 + endReflex[1] / 1e6).toFixed(2);

    // 2. Benchmark Cortex Routing
    const startCortex = process.hrtime();
    let cortexHits = 0;
    for (const p of cortexPrompts) {
        const route = await thalamus.route(p);
        if (route.layer === 'CORTEX') cortexHits++;
    }
    const endCortex = process.hrtime(startCortex);
    const timeCortex = (endCortex[0] * 1000 + endCortex[1] / 1e6).toFixed(2);

    // Results
    console.log('\n📊 RESULTS:');
    console.log('--------------------------------------------------');
    console.log(`REFLEX LAYER (10,000 items)`);
    console.log(`Time: ${timeReflex}ms`);
    console.log(`Avg:  ${(timeReflex / 10000).toFixed(4)}ms / request`);
    console.log(`Accuracy: ${reflexHits}/10000`);
    console.log('--------------------------------------------------');
    console.log(`ROUTER OVERHEAD (10,000 items)`);
    console.log(`Time: ${timeCortex}ms`);
    console.log(`Avg:  ${(timeCortex / 10000).toFixed(4)}ms / request`);
    console.log(`Accuracy: ${cortexHits}/10000`);
    console.log('--------------------------------------------------');

    if (reflexHits === 10000 && cortexHits === 10000) {
        console.log('✅ PASS: Perfect Routing Accuracy.');
    } else {
        console.error('❌ FAIL: Routing errors detected.');
        process.exit(1);
    }
}

runBenchmark();
