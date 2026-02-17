const fs = require('fs');
const path = require('path');

/**
 * REFLEX SYSTEM (Layer 1)
 * Biological Analog: Spinal Cord / Brainstem
 * Function: Immediate, deterministic execution of strict patterns.
 * Latency: < 10ms
 */
class Reflex {
    constructor(agent) {
        this.agent = agent;
        this.patterns = new Map();
        this.initialize();
    }

    initialize() {
        // 1. Arithmetic Reflex (Calc)
        // Matches: "calc 5 + 5", "calculate 10 * 20", etc.
        this.patterns.set(
            /^(?:calc|calculate)\s+(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/i,
            (matches) => {
                const [_, a, op, b] = matches;
                const n1 = parseFloat(a);
                const n2 = parseFloat(b);
                let result;
                switch (op) {
                    case '+': result = n1 + n2; break;
                    case '-': result = n1 - n2; break;
                    case '*': result = n1 * n2; break;
                    case '/': result = n1 / n2; break;
                }
                return `Reflex (Math): ${result}`;
            }
        );

        // 2. High-Speed Echo (Testing)
        this.patterns.set(
            /^echo\s+(.+)$/i,
            (matches) => `Reflex (Echo): ${matches[1]}`
        );

        // 3. Process Control (Safety Critical)
        this.patterns.set(
            /^stop\s+process$/i,
            () => {
                console.log('🛑 REFLEX: Emergency Stop Triggered.');
                process.exit(0);
            }
        );

        // 4. Quick File Check (Read-Only)
        this.patterns.set(
            /^check\s+exists\s+(.+)$/i,
            (matches) => {
                const target = matches[1].replace(/['"]/g, ''); // Strip quotes
                const exists = fs.existsSync(target);
                return `Reflex (FS): File ${exists ? 'EXISTS' : 'NOT FOUND'}: ${target}`;
            }
        );
    }

    /**
     * Attempt to handle the input via reflex.
     * @param {string} input 
     * @returns {string|null} Result if handled, null if ignored.
     */
    process(input) {
        const cleanInput = input.trim();

        for (const [regex, handler] of this.patterns) {
            const matches = cleanInput.match(regex);
            if (matches) {
                // this.agent.log(`[Reflex] ⚡ Match found: ${regex}`);
                try {
                    return handler(matches);
                } catch (err) {
                    return `Reflex Error: ${err.message}`;
                }
            }
        }
        return null;
    }
}

module.exports = Reflex;
