const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());
const logDir = path.join(process.cwd(), 'data');
console.log('Log Dir:', logDir);

try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'session_debug.log');
    fs.appendFileSync(logFile, `[TEST] Logging check at ${new Date().toISOString()}\n`);
    console.log('Successfully wrote to session_debug.log');
} catch (e) {
    console.error('Failed to write:', e);
}
