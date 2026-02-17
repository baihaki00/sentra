const SentraCore = require('./src/core');
const fs = require('fs');
const path = require('path');

async function testPatchPipeline() {
    console.log('🧪 Starting Patch Pipeline Verification...');

    // Setup dummy file
    const testFile = 'test_pipeline_patch.txt';
    const absPath = path.resolve(testFile);
    fs.writeFileSync(testFile, 'Target: [OLD_VALUE]', 'utf8');

    const core = new SentraCore();
    await core.start();

    // Force the agent to use patch_code
    const task = `
    Use the 'patch_code' tool to change "[OLD_VALUE]" to "[NEW_VALUE]" in the file "${absPath}".
    Do not use write_code. Use patch_code specifically.
    `;

    console.log(`\n[Input Task] ${task}\n`);

    try {
        await core.agent.startTask(task);
    } catch (e) {
        console.error('Task failed:', e);
    }

    // Verify
    const content = fs.readFileSync(testFile, 'utf8');
    console.log(`[Content verify] "${content}"`);

    if (content.includes('[NEW_VALUE]')) {
        console.log('✅ Pipeline Verification: Passed');
    } else {
        console.error('❌ Pipeline Verification: Failed');
        process.exit(1);
    }

    // Cleanup
    fs.unlinkSync(testFile);
    process.exit(0);
}

testPatchPipeline().catch(e => {
    console.error(e);
    process.exit(1);
});
