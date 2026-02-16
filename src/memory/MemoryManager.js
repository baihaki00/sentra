const EpisodicMemory = require('./EpisodicMemory');

const SemanticMemory = require('./SemanticMemory');

/**
 * Memory Manager
 * Facade for Working, Episodic, and Semantic memory layers.
 */
class MemoryManager {
    constructor(config) {
        this.config = config;
        this.working = new Map();   // RAM - Volatile
        this.episodic = new EpisodicMemory(config);
        this.semantic = new SemanticMemory(config.baseDir || './data');  // Facts/Rules - Persistent (JSON/Vector)
    }

    async initialize(task) {
        console.log('[Memory] Initializing layered memory...');
        this.working.clear();
        this.working.set('current_task', task);

        await this.episodic.load();
        await this.semantic.initialize();

        // Retrieve relevant semantic context
        const context = await this.semantic.search(task);
        if (context.length > 0) {
            console.log(`[Memory] Found ${context.length} relevant memories.`);
            this.working.set('context', context.map(c => c.content).join('\n'));
        }
    }

    // --- Working Memory ---
    async get(key) {
        return this.working.get(key);
    }

    async set(key, value) {
        this.working.set(key, value);
    }

    // --- Episodic Memory ---
    async commitEpisode(summary) {
        console.log('[Memory] Committing episode...');
        await this.episodic.addEpisode({
            summary,
            task: this.working.get('current_task')
        });
    }

    // --- Semantic Memory ---
    async retrieveFact(query) {
        // Mock retrieval
        return this.semantic.get(query);
    }
}

module.exports = MemoryManager;
