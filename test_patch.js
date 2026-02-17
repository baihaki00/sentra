const SentraCore = require('./src/core');
const fs = require('fs');
const path = require('path');

async function testPatch() {
    console.log('🧪 Starting Patch Tool Verification...');

    // Setup dummy file
    const testFile = 'test_patch_target.txt';
    fs.writeFileSync(testFile, 'Hello World\nThis is a huge file.\nDo not truncate me.\nGoodbye.', 'utf8');

    const core = new SentraCore();
    await core.start();

    console.log(`\n[Test] Patching ${testFile}...`);

    // Manually invoke via Engineer check
    const engineer = core.agent.components.engineer;
    const result = engineer.patchCode(path.resolve(testFile), 'huge', 'tiny');

    if (result.success) {
        console.log('✅ Patch Result: Success');
        const content = fs.readFileSync(testFile, 'utf8');
        console.log(`[Content verify] "${content.replace(/\n/g, '\\n')}"`);

        if (content.includes('This is a tiny file.')) {
            console.log('✅ Content Verification: Passed');
        } else {
            console.error('❌ Content Verification: Failed');
            process.exit(1);
        }
    } else {
        console.error(`❌ Patch Failed: ${result.error}`);
        process.exit(1);
    }

    // Cleanup
    fs.unlinkSync(testFile);
    process.exit(0);
}

testPatch().catch(e => {
    console.error(e);
    process.exit(1);
});
