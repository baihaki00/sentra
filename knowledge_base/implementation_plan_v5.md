const GenesisKernel = require('./genesis/Kernel');

/**
 * GENESIS STRESS TEST (v0.6)
 * Continuous simulated workload.
 */

async function runStressTest(iterations = 100) {
    console.log(`🌌 INIT STRESS TEST (${iterations} Cycles)...`);
    const kernel = new GenesisKernel();
    await kernel.init();
    
    // Disable detailed logs for speed
    const consoleLog = console.log;
    // console.log = () => {}; 

    let successCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
        const taskType = Math.random();
        
        try {
            if (taskType < 0.33) {
                // TASK 1: TEACHING (Injection)
                const a = `CONCEPT_${Math.floor(Math.random() * 100)}`;
                const b = `CONCEPT_${Math.floor(Math.random() * 100)}`;
                kernel.scaffold.associate(a, b, 'RELATED_TO');
                successCount++;
            } else if (taskType < 0.66) {
                // TASK 2: REASONING (Query)
                const start = `CONCEPT_${Math.floor(Math.random() * 100)}`;
                const neighbors = kernel.scaffold.memory.getNeighbors(start);
                if (neighbors.length > 0) {
                    // Just verifying we can read graph
                    successCount++;
                }
            } else {
                // TASK 3: CURIOSITY (Scan)
                const suggestion = kernel.curiosity.proposeExploration();
                if (suggestion) {
                    await kernel.binder.execute(suggestion.action, suggestion.args);
                    successCount++;
                }
            }
        } catch (e) {
            process.stderr.write('X');
        }
        
        if (i % 10 === 0) process.stdout.write('.');
    }

    const duration = Date.now() - startTime;
    console.log = consoleLog; // Restore logs
    
    console.log('\n📊 RESULTS:');
    console.log(`- Total Cycles: ${iterations}`);
    console.log(`- Success Rate: ${successCount}/${iterations}`);
    console.log(`- Duration: ${duration}ms`);
    console.log(`- Avg Latency: ${(duration/iterations).toFixed(2)}ms`);
    console.log(`- Final Graph Size: ${kernel.scaffold.memory.nodes.size} Nodes`);
}

runStressTest(100);
