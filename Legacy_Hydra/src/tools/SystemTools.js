const { exec } = require('child_process');
const os = require('os');

/**
 * System Tools
 * Provides OS information and command execution.
 */
class SystemTools {
    async get_os_info() {
        return {
            platform: os.platform(),
            release: os.release(),
            type: os.type(),
            arch: os.arch(),
            hostname: os.hostname()
        };
    }

    async cmd({ command }) {
        console.log(`[SystemTools] Executing: ${command}`);
        return new Promise((resolve) => {
            exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    // Start-Process in PowerShell might return immediately, which is fine for GUI apps.
                    // But standard exec waits.
                    // For "open notepad", if checking error, notepad might block until closed.
                    // We might need to handle detached processes if user wants to "launch" apps, 
                    // but for now strict execution is safer.
                    resolve(`Error: ${error.message}\nStderr: ${stderr}`);
                    return;
                }
                resolve(stdout || stderr || 'Command executed successfully');
            });
        });
    }
}

module.exports = SystemTools;
