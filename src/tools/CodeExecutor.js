const vm = require('vm');
const { spawn } = require('child_process');

/**
 * Code Execution Sandbox
 * Provides safe(r) execution of code snippets.
 * 
 * NOTE: This is NOT a perfect sandbox. It uses:
 * - JS: Node.js 'vm' module (context isolation, but not full security).
 * - Python: Child process with timeout.
 */
class CodeExecutor {
    constructor(timeoutMs = 5000) {
        this.timeoutMs = timeoutMs;
    }

    async execute_javascript({ code }) {
        try {
            // Create a context with basic globals
            const context = {
                console: {
                    log: (...args) => { this.lastLog = args.join(' '); },
                    error: (...args) => { this.lastError = args.join(' '); }
                },
                result: null
            };
            vm.createContext(context);

            // Wrap code to extract result
            const wrappedCode = `
                try {
                    result = (function() {
                        ${code}
                    })();
                } catch (e) {
                    console.error(e.message);
                }
            `;

            const script = new vm.Script(wrappedCode);

            // Execute with timeout
            script.runInContext(context, { timeout: this.timeoutMs });

            if (context.lastError) return `Error: ${context.lastError}`;

            // Prefer explicit return, otherwise console log, otherwise 'undefined'
            if (context.result !== undefined && context.result !== null) {
                return typeof context.result === 'object' ? JSON.stringify(context.result) : String(context.result);
            }
            if (this.lastLog) return this.lastLog;

            return "Executed successfully (no output)";

        } catch (error) {
            return `Execution Error: ${error.message}`;
        }
    }

    async execute_python({ code }) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', ['-c', code]);

            let stdout = '';
            let stderr = '';
            let timedOut = false;

            // Timeout handler
            const timer = setTimeout(() => {
                timedOut = true;
                pythonProcess.kill();
                resolve('Error: Execution timed out.');
            }, this.timeoutMs);

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timer);
                if (timedOut) return;

                if (code !== 0) {
                    resolve(`Python Error: ${stderr || 'Unknown error'}`);
                } else {
                    resolve(stdout.trim() || 'Executed successfully (no output)');
                }
            });

            pythonProcess.on('error', (err) => {
                clearTimeout(timer);
                resolve(`Failed to start Python: ${err.message}`);
            });
        });
    }
}

module.exports = CodeExecutor;
