const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Tester = require('./Tester');
const Deployer = require('./Deployer');

/**
 * The Engineer
 * Responsible for safely modifying the agent's own source code.
 * Includes backup, write, test, and rollback capabilities.
 */
class Engineer {
    constructor(agent) {
        this.agent = agent;
        this.backupDir = path.join(process.cwd(), 'src', 'backups');
        this.evolutionLogPath = path.join(process.cwd(), 'data', 'evolution_log.json');

        // Ensure directories exist
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        if (!fs.existsSync(path.dirname(this.evolutionLogPath))) {
            fs.mkdirSync(path.dirname(this.evolutionLogPath), { recursive: true });
        }

        // Initialize sub-components
        this.tester = new Tester(agent);
        this.deployer = new Deployer(agent);
    }

    /**
     * Reads a file from the codebase.
     */
    readCode(filepath) {
        try {
            if (!fs.existsSync(filepath)) return null;
            return fs.readFileSync(filepath, 'utf8');
        } catch (e) {
            this.agent.log(`[Engineer] Error reading file: ${e.message}`);
            return null;
        }
    }

    /**
     * Creates a backup of a file.
     * Returns the backup path.
     */
    backup(filepath) {
        try {
            const filename = path.basename(filepath);
            const timestamp = Date.now();
            const backupPath = path.join(this.backupDir, `${filename}.${timestamp}.bak`);

            if (fs.existsSync(filepath)) {
                fs.copyFileSync(filepath, backupPath);
                this.agent.log(`[Engineer] 🛡️ Backup created: ${filename} -> ${path.basename(backupPath)}`);
                return backupPath;
            }
            return null;
        } catch (e) {
            this.agent.log(`[Engineer] Backup failed: ${e.message}`);
            throw e; // Critical failure
        }
    }

    /**
     * Restores a file from a specific backup.
     */
    restore(filepath, backupPath) {
        try {
            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, filepath);
                this.agent.log(`[Engineer] ↺ Restored ${path.basename(filepath)} from backup.`);
                return true;
            }
            return false;
        } catch (e) {
            this.agent.log(`[Engineer] Restore failed: ${e.message}`);
            return false;
        }
    }

    /**
     * Writes new code to a file (with auto-backup).
     */
    writeCode(filepath, content) {
        // 1. Backup first
        const backupPath = this.backup(filepath);

        try {
            // 2. Write new content
            fs.writeFileSync(filepath, content, 'utf8');
            this.agent.log(`[Engineer] ✏️ Modified ${path.basename(filepath)}`);

            // 3. Log the attempt
            this.logEvolution(filepath, 'MODIFICATION', 'Attempted change');

            return { success: true, backupPath };
        } catch (e) {
            this.agent.log(`[Engineer] Write failed: ${e.message}`);
            // Try to restore immediately if write failed halfway
            if (backupPath) this.restore(filepath, backupPath);
            return { success: false, error: e.message };
        }
    }

    /**
     * Patches a file by replacing a specific string.
     * Safer than writeCode for large files.
     */
    patchCode(filepath, search, replace) {
        // 1. Read original
        const content = this.readCode(filepath);
        if (content === null) return { success: false, error: "File not found" };

        // 2. Validate Search
        if (!content.includes(search)) {
            return { success: false, error: "Search string not found in file." };
        }

        // Safety: Check for multiple occurrences if not intended? 
        // For now, we'll just replace the first one (standard replace) 
        // or all if global flag used (but we keep it simple for now).

        // 3. Backup
        const backupPath = this.backup(filepath);

        try {
            // 4. Apply Patch
            const newContent = content.replace(search, replace);
            fs.writeFileSync(filepath, newContent, 'utf8');
            this.agent.log(`[Engineer] 🩹 Patched ${path.basename(filepath)}`);
            this.logEvolution(filepath, 'PATCH', 'Applied patch');
            return { success: true, backupPath };
        } catch (e) {
            this.agent.log(`[Engineer] Patch failed: ${e.message}`);
            if (backupPath) this.restore(filepath, backupPath);
            return { success: false, error: e.message };
        }
    }

    /**
     * Runs a verification command (e.g., "node src/cli.js --test").
     * Returns true if exit code is 0.
     */
    async verify(testCommand) {
        this.agent.log(`[Engineer] 🧪 Running verification: ${testCommand}`);
        try {
            const { stdout, stderr } = await execPromise(testCommand);
            this.agent.log(`[Engineer] Tests passed.`);
            return true;
        } catch (e) {
            this.agent.log(`[Engineer] ❌ Tests failed: ${e.message}`);
            return false;
        }
    }

    /**
     * Logs evolution events.
     */
    logEvolution(file, type, details) {
        let logs = [];
        try {
            if (fs.existsSync(this.evolutionLogPath)) {
                logs = JSON.parse(fs.readFileSync(this.evolutionLogPath, 'utf8'));
            }
        } catch (e) { }

        logs.push({
            timestamp: Date.now(),
            file,
            type,
            details
        });

        fs.writeFileSync(this.evolutionLogPath, JSON.stringify(logs, null, 2));
    }

    /**
     * Orchestrates the full evolution cycle: Write -> Test -> Commit/Revert
     * @param {Object} plan - { file, content, testFile, testContent, taskDescription }
     */
    async orchestrateEvolution(plan) {
        this.agent.log(`[Engineer] 🧬 Starting Evolution: ${plan.taskDescription}`);

        // 1. Create/Update Test File
        // We write the test first to ensure we have a verification mechanism
        if (plan.testFile && plan.testContent) {
            this.writeCode(plan.testFile, plan.testContent);
        }

        // 2. Apply Code Change
        const writeResult = this.writeCode(plan.file, plan.content);
        if (!writeResult.success) {
            return { success: false, error: "Failed to write code." };
        }

        // 3. Run Test
        const testResult = await this.tester.runTest(plan.testFile);

        if (testResult.passed) {
            // 4. Success -> Commit
            this.agent.log(`[Engineer] ✅ Transformation Successful. Committing...`);
            await this.deployer.commit(plan.taskDescription);
            return { success: true, message: "Evolution applied and verified." };
        } else {
            // 5. Failure -> Revert
            this.agent.log(`[Engineer] ❌ Transformation Failed. Reverting...`);
            // We revert using git to be safe, or just restore the backup if we want to be surgical.
            // Since we might have modified the test file too, git revert is safer if we want to undo ALL changes.
            // But if we want to keep the test file for debugging, we should only revert the code file.
            // Let's rely on Deployer's revert which does 'git reset --hard'.
            // This is the safest "abort" button.
            await this.deployer.revert();

            return {
                success: false,
                error: `Test failed: ${testResult.output}`,
                details: testResult.output
            };
        }
    }
}

module.exports = Engineer;
