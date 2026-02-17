const { exec } = require('child_process');

/**
 * Deployer
 * Manages git operations to save or revert changes.
 */
class Deployer {
    constructor(agent) {
        this.agent = agent;
    }

    async commit(message) {
        return new Promise((resolve, reject) => {
            const cmd = `git add . && git commit -m "Auto-evolution: ${message}"`;
            this.agent.log(`[Deployer] 💾 Committing: "${message}"...`);

            exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (error) {
                    this.agent.log(`[Deployer] ⚠️ Commit failed: ${error.message}`);
                    // It might fail if no changes, which is fine-ish
                    resolve(false);
                } else {
                    this.agent.log(`[Deployer] ✅ Commit successful.`);
                    resolve(true);
                }
            });
        });
    }

    async revert() {
        return new Promise((resolve) => {
            const cmd = `git reset --hard HEAD`; // Revert uncommitted changes
            // Or HEAD~1 if we want to undo the last commit, but usually we revert *pending* changes if test fails.
            // For now, let's assume we are testing *before* committing.
            // If we are testing *modified* files, 'git reset --hard HEAD' wipes them.

            this.agent.log(`[Deployer] ↩️ Reverting changes...`);

            exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (error) {
                    this.agent.log(`[Deployer] ❌ Revert failed: ${error.message}`);
                    resolve(false);
                } else {
                    this.agent.log(`[Deployer] ✅ Reverted to safely.`);
                    resolve(true);
                }
            });
        });
    }
}

module.exports = Deployer;
