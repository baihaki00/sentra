const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const SentraCore = require('../core');

// Configuration
const PROMPTS_FILE = path.join(__dirname, '../../data/evaluation/generated_prompts.json');
const LOGS_DIR = path.join(__dirname, '../../data/evaluation/run_logs');
const BATCH_SIZE = 5; // Start small for testing
const DETERMINISM_REPEATS = 3;

// Metrics Holder
const runResults = [];

async function main() {
    console.log('🤖 INITIALIZING TOM HARNESS (Phase 2/3)...');

    // 1. Load Prompts
    if (!fs.existsSync(PROMPTS_FILE)) {
        console.error(`❌ Prompts file not found: ${PROMPTS_FILE}`);
        process.exit(1);
    }
    const allPrompts = JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf8'));

    // 1b. Check for Existing Progress (Resume Capability)
    let processedIds = new Set();
    if (fs.existsSync(LOGS_DIR)) {
        const existingLogs = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
        existingLogs.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf8');
                const batch = JSON.parse(content);
                batch.forEach(run => processedIds.add(run.id));
            } catch (e) { }
        });
    }

    console.log(`🔍 Found ${processedIds.size} completed runs.`);
    const remainingPrompts = allPrompts.filter(p => !processedIds.has(p.id));

    if (remainingPrompts.length === 0) {
        console.log('✅ All prompts completed!');
        return;
    }

    const CHUNK_SIZE = 50;
    const testPrompts = remainingPrompts.slice(0, CHUNK_SIZE);

    console.log(`Loaded ${allPrompts.length} prompts. Resuming execution for next ${testPrompts.length}...`);

    // 2. Init Core
    const core = new SentraCore(); // Default config
    await core.initialize();
    const agent = core.agent;

    // 3. Harness Loop
    for (const promptData of testPrompts) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🧪 TESTING ID: ${promptData.id}`);
        console.log(`📝 PROMPT: "${promptData.prompt}"`);

        const metrics = {
            id: promptData.id,
            prompt: promptData.prompt,
            type: promptData.type,
            complexity: promptData.complexity,
            timestamp: new Date().toISOString(),
            runs: []
        };

        // Determinism Loop
        // For simple check, we run once unless flagged
        const repeats = 1; // Set to DETERMINISM_REPEATS for full test

        for (let i = 0; i < repeats; i++) {
            const runMetric = {
                attempt: i + 1,
                start: Date.now(),
                cognitive_system: 'UNKNOWN', // 1 or 2
                tool_calls: [],
                logs: [],
                error: null,
                result: null,
                latency: 0
            };

            // Capture Logs for Analysis
            const logHandler = (msg) => {
                runMetric.logs.push(msg);
                if (msg.includes('Fast Path')) {
                    runMetric.cognitive_system = 'SYSTEM_1';
                } else if (msg.includes('Tree of Thoughts') && !msg.includes('skipping')) {
                    runMetric.cognitive_system = 'SYSTEM_2';
                }
            };
            agent.on('log', logHandler);

            try {
                // Execute
                const result = await agent.startTask(promptData.prompt);
                runMetric.result = result;

                // Extract Tool Usage from Context
                if (agent.context.history) {
                    runMetric.tool_calls = agent.context.history.map(h => h.tool);
                }

            } catch (err) {
                console.error(`❌ RUN ERROR: ${err.message}`);
                runMetric.error = err.message;
            } finally {
                runMetric.latency = Date.now() - runMetric.start;
                agent.removeListener('log', logHandler); // Cleanup
            }

            console.log(`   -> Run ${i + 1}: ${runMetric.latency}ms | ${runMetric.cognitive_system} | Result: ${runMetric.result ? runMetric.result.substring(0, 50) + '...' : 'NULL'}`);
            metrics.runs.push(runMetric);
        }

        // Calculate Determinism Score (hash consistency) if repeats > 1
        if (repeats > 1) {
            const hashes = metrics.runs.map(r => crypto.createHash('md5').update(r.result || '').digest('hex'));
            const uniqueHashes = new Set(hashes);
            metrics.determinism_score = uniqueHashes.size === 1 ? 1 : 0;
        }

        runResults.push(metrics);

        // Save incremental progress
        saveResults();
    }

    console.log('\n✅ BATCH COMPLETE.');
}

function saveResults() {
    const filename = `run_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(LOGS_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(runResults, null, 2));
}

// Run
main().catch(console.error);
