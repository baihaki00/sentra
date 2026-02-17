const readline = require('readline');

/**
 * PROJECT GENESIS: KERNEL v0.1
 * The Associative Reasoning Engine (ARE)
 * 
 * Philosophy:
 * 1. No Pre-training.
 * 2. No Weights.
 * 3. Pure Association.
 */

class GenesisKernel {
    constructor() {
        this.graph = {
            nodes: new Map(), // ID -> { type, data, edges }
            edges: []         // { from, to, weight, type }
        };
        this.vocabulary = new Set();
    }

    // --- PERCEPTION ---
    tokenize(input) {
        // Naive whitespace tokenizer (will evolve)
        return input.trim().split(/\s+/);
    }

    // --- MEMORY ---
    learn(input) {
        const tokens = this.tokenize(input);

        // 1. Structural Learning (Vocabulary)
        tokens.forEach(token => {
            if (!this.vocabulary.has(token)) {
                this.vocabulary.add(token);
                console.log(`[Kernel] 🆕 New Concept: "${token}"`);
                // Create Node
                this.graph.nodes.set(token, { type: 'CONCEPT', activations: 0 });
            }
            // Strengthen activation
            const node = this.graph.nodes.get(token);
            node.activations++;
        });

        // 2. Associative Learning (Hebbian: Fire together, wire together)
        for (let i = 0; i < tokens.length - 1; i++) {
            const a = tokens[i];
            const b = tokens[i + 1];
            this.link(a, b, 'NEXT');
        }

        return tokens;
    }

    link(a, b, type) {
        // Simplified Edge Creation
        const edgeId = `${a}->${b}`;
        const existing = this.graph.edges.find(e => e.id === edgeId);
        if (existing) {
            existing.weight += 1;
        } else {
            this.graph.edges.push({ id: edgeId, from: a, to: b, weight: 1, type });
        }
    }

    // --- REFLECTION ---
    think(input) {
        const tokens = this.tokenize(input);
        const lastToken = tokens[tokens.length - 1];

        // Primitive Prediction: What usually comes after the last token?
        const candidates = this.graph.edges
            .filter(e => e.from === lastToken && e.type === 'NEXT')
            .sort((a, b) => b.weight - a.weight);

        if (candidates.length > 0) {
            const best = candidates[0];
            return `Projected: ${best.to} (${best.weight} confidence)`;
        }

        return "Unknown state. Please teach me.";
    }

    // --- INTERFACE ---
    start() {
        console.log("🌌 GENESIS KERNEL v0.1 ONLINE.");
        console.log("Memory is empty. I am Tabula Rasa.");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'GENESIS> '
        });

        rl.prompt();

        rl.on('line', (line) => {
            const input = line.trim();
            if (input === '/dump') {
                console.log(this.graph);
            } else if (input.startsWith('/teach ')) {
                this.learn(input.substring(7));
                console.log("[Kernel] absorbed.");
            } else {
                const thought = this.think(input);
                console.log(`[Kernel] ${thought}`);
            }
            rl.prompt();
        }).on('close', () => {
            console.log('Kernel Halting.');
            process.exit(0);
        });
    }
}

// Bootstrap
if (require.main === module) {
    const kernel = new GenesisKernel();
    kernel.start();
}
