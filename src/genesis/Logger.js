/**
 * PROJECT GENESIS: LOGGER v1.0
 * Centralized logging with file output and verbosity control
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFile = './data/debug.log') {
        this.logFile = logFile;
        this.verbose = process.argv.includes('--verbose') || process.env.VERBOSE === 'true';

        // Ensure log directory exists
        const dir = path.dirname(logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Clear old log on startup
        fs.writeFileSync(this.logFile, `=== Genesis Kernel Log - ${new Date().toISOString()} ===\n`);
    }

    /**
     * Log to file (always) and console (if verbose or priority is high)
     */
    log(message, level = 'INFO', priority = 'LOW') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;

        // Always write to file
        fs.appendFileSync(this.logFile, logEntry);

        // Console output based on verbose mode and priority
        if (this.verbose || priority === 'HIGH') {
            console.log(message);
        }
    }

    // Convenience methods
    debug(message) {
        this.log(message, 'DEBUG', 'LOW');
    }

    info(message, priority = 'LOW') {
        this.log(message, 'INFO', priority);
    }

    warn(message) {
        this.log(message, 'WARN', 'HIGH');
    }

    error(message) {
        this.log(message, 'ERROR', 'HIGH');
    }

    // Special: Always show on console
    user(message) {
        this.log(message, 'USER', 'HIGH');
    }
}

module.exports = Logger;
