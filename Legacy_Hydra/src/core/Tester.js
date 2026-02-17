const { exec } = require('child_process');
const path = require('path');

/**
 * Tester
 * Runs verification scripts to ensure code changes don't break functionality.
 */
class Tester {
    constructor(agent) {
        this.agent = agent;
    }

    /**
     * Run a test script and return the result.
     * @param {string} testFile - Absolute path to the test file
     * @returns {Promise<{passed: boolean, output: string}>}
     */
    async runTest(testFile) {
        return new Promise((resolve) => {
            this.agent.log(`[Tester] 🧪 Running test: ${path.basename(testFile)}...`);

            const command = `node "${testFile}"`;

            exec(command, {
                cwd: process.cwd(),
                timeout: 30000 // 30s timeout
            }, (error, stdout, stderr) => {
                const output = stdout + '\n' + stderr;

                if (error) {
                    this.agent.log(`[Tester] ❌ Test Failed: ${error.message}`);
                    resolve({ passed: false, output });
                } else {
                    this.agent.log(`[Tester] ✅ Test Passed!`);
                    resolve({ passed: true, output });
                }
            });
        });
    }
}

module.exports = Tester;
