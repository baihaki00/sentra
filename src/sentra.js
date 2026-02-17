/**
 * SENTRA GENESIS - Clean UI Wrapper
 * Runs Kernel with minimal console output, logs everything to file
 */

// Suppress verbose console output
const originalConsoleLog = console.log;
const Logger = require('./genesis/Logger');
const logger = new Logger('./data/debug.log');

// Override console.log to redirect to logger (except specific messages)
console.log = function (...args) {
    const message = args.join(' ');

    // Allow through: startup, user prompts, Sentra responses, errors
    if (message.includes('✓') ||  // Startup checkmark
        message.includes('You >') ||  // User prompt
        message.includes('[Sentra]') ||  // Sentra's response
        message.includes('[Error]') ||  // Errors
        message.includes('GENESIS>') ||  // Legacy prompt
        message.length === 0) {  // Empty lines
        originalConsoleLog(...args);
    } else {
        // Log everything else to file only
        logger.debug(message);
    }
};

// Now load the actual Kernel
const GenesisKernel = require('./genesis/Kernel');

async function main() {
    // Clean startup
    originalConsoleLog('');
    originalConsoleLog('\x1b[1m\x1b[32m✓ Sentra Genesis v0.2\x1b[0m');
    originalConsoleLog('\x1b[2m  Logs: ./data/debug.log\x1b[0m');
    if (process.argv.includes('--verbose')) {
        originalConsoleLog('\x1b[2m  Verbose mode: ON\x1b[0m');
        // Restore verbose console
        console.log = originalConsoleLog;
    }
    originalConsoleLog('');

    const kernel = new GenesisKernel();
    await kernel.init();
    await kernel.loop(); // ← Fixed: Kernel has loop() method, not run()
}

main().catch(err => {
    originalConsoleLog('\x1b[31m[Error]\x1b[0m', err.message);
    logger.error(err.stack);
    process.exit(1);
});
