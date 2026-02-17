const Engineer = require('./core/Engineer');
const fs = require('fs');
const path = require('path');

// Mock Agent
const mockAgent = {
    log: (msg) => console.log(msg),
    config: {}
};

async function testEvolution() {
    console.log('--- Testing Self-Evolution ---');

    const engineer = new Engineer(mockAgent);

    // Mock Deployer to avoid actual git commits during test
    engineer.deployer.commit = async (msg) => {
        console.log(`[MockDeployer] Committing: ${msg}`);
        return true;
    };
    engineer.deployer.revert = async () => {
        console.log(`[MockDeployer] Reverting...`);
        return true;
    };

    // Prepare Test Data
    const targetFile = path.join(__dirname, '..', 'data', 'evolution_target.js');
    const testFile = path.join(__dirname, '..', 'data', 'evolution_test.js');

    const codeContent = `
        module.exports = {
            add: (a, b) => a + b
        };
    `;

    const testContent = `
        const mod = require('./evolution_target');
        if (mod.add(2, 3) === 5) {
            console.log('Math works');
        } else {
            console.error('Math failed');
            process.exit(1);
        }
    `;

    const plan = {
        taskDescription: "Add addition function",
        file: targetFile,
        content: codeContent,
        testFile: testFile,
        testContent: testContent
    };

    // Execute
    try {
        const result = await engineer.orchestrateEvolution(plan);
        console.log('Result:', result);

        // Verify
        if (result.success && fs.existsSync(targetFile) && fs.existsSync(testFile)) {
            console.log('✅ Evolution Test Passed');
        } else {
            console.error('❌ Evolution Test Failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('Test Exception:', error);
    } finally {
        // Cleanup
        if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }
}

testEvolution();
