const fs = require('fs');
const path = require('path');
const { KnowledgeGraph } = require('./Scaffold');

/**
 * GENESIS MEMORY SYSTEM
 * Handles persistence of the Knowledge Graph.
 */
class Memory {
    constructor() {
        // ROBUST PATH: Always look in project_root/data/memory.json
        // __dirname = src/genesis
        this.memoryFile = path.join(__dirname, '../../data/memory.json');
        this.init();
    }

    init() {
        const dir = path.dirname(this.memoryFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    save(graph) {
        const data = {
            nodes: Array.from(graph.nodes.entries()),
            edges: Array.from(graph.edges.entries()),
            meta: { savedAt: Date.now() }
        };
        fs.writeFileSync(this.memoryFile, JSON.stringify(data, null, 2));
        // console.log(`[Memory] Saved ${graph.nodes.size} nodes, ${graph.edges.size} edges.`);
    }

    load() {
        if (!fs.existsSync(this.memoryFile)) return null;

        try {
            const raw = fs.readFileSync(this.memoryFile, 'utf8');
            const data = JSON.parse(raw);

            const graph = new KnowledgeGraph();
            graph.nodes = new Map(data.nodes);
            graph.edges = new Map(data.edges);

            console.log(`[Memory] Loaded ${graph.nodes.size} nodes from disk.`);
            return graph;
        } catch (e) {
            console.error('[Memory] Corrupt memory file:', e);
            return null;
        }
    }
}

module.exports = Memory;
