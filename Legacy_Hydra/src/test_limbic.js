const Thalamus = require('./core/Thalamus');
const LimbicSystem = require('./core/LimbicSystem');
const fs = require('fs');

// Mock components
class MockAgent {
    constructor() {
        this.logMsgs = [];
        this.components = { visual_memory: new MockVisualMemory() };
    }
    log(msg) {
        this.logMsgs.push(msg);
        // console.log(msg); 
    }
}

class MockVisualMemory {
    constructor() {
        this.cache = [];
    }
    async search(query, limit, collection) {
        // Simple string matching simulation of vector search
        return this.cache
            .filter(m => m.content === query) // Exact match for mock, real would use vectors
            .map(m => ({
                content: m.content,
                metadata: { result: m.result },
                similarity: 1.0
            }));
    }
    async store(content, result) {
        this.cache.push({ content, result });
    }
}

async function runBenchmark() {
    console.log('🧠 LIMBIC SYSTEM BENCHMARK 🧠');
    const agent = new MockAgent();
    // Manually attach components
    agent.components.limbic = new LimbicSystem(agent);

    // We need to inject the mock visual memory into the limbic system context if needed
    // But LimbicSystem uses agent.components.visual_memory, which we mocked.

    const thalamus = new Thalamus(agent);

    const question = "What is the capital of France?";
    const answer = "Paris";

    console.log(`\n1. Cold Start: Asking "${question}" (No Cache)`);
    const start1 = process.hrtime();

    // First run: Should hit Cortex (simulated)
    // We need to manually populate the cache if Cortex runs, but Thalamus routes.
    // Thalamus returns { handled: false } if no cache.
    let route1 = await thalamus.route(question);

    // Simulate Cortex execution and caching
    if (!route1.handled) {
        await agent.components.visual_memory.store(question, answer);
    }

    const end1 = process.hrtime(start1);
    const time1 = (end1[0] * 1000 + end1[1] / 1e6).toFixed(2);
    console.log(`   Route: ${route1.layer} | Time: ${time1}ms`);


    console.log(`\n2. Warm Cache: Asking "${question}" (Cached)`);
    const start2 = process.hrtime();

    // Second run: Should hit Limbic
    let route2 = await thalamus.route(question);

    const end2 = process.hrtime(start2);
    const time2 = (end2[0] * 1000 + end2[1] / 1e6).toFixed(2);
    console.log(`   Route: ${route2.layer} | Time: ${time2}ms`);

    // Validation
    if (route1.layer === 'CORTEX' && route2.layer === 'LIMBIC' && route2.result === answer) {
        console.log('\n✅ PASS: Semantic Cache correctly intercepted the request.');
        console.log(`   Speedup: ${(time1 / time2).toFixed(1)}x`);
    } else {
        console.error('\n❌ FAIL: Cache logic failed.');
        console.log(`   Run 1: ${route1.layer}`);
        console.log(`   Run 2: ${route2.layer}`);
        process.exit(1);
    }
}

runBenchmark();
