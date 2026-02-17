const EpisodicMemory = require('./EpisodicMemory');
const SemanticMemory = require('./SemanticMemory');
const VectorDb = require('./VectorDb');

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
        this.vectorDb = new VectorDb(config.vectorDbPath || './data/memory.db'); // Semantic Search
    }

    async initialize(task) {
        console.log('[Memory] Initializing layered memory...');
        // Only reset task-specific context, preserve persistent entries
        this.working.set('current_task', task);
        this.working.delete('context');
        this.working.delete('relevant_memories');

        await this.episodic.load();
        await this.semantic.initialize();
        await this.vectorDb.initialize();

        // Retrieve relevant semantic context from Vector DB
        const memories = await this.vectorDb.search(task, 3);
        if (memories.length > 0) {
            console.log(`[Memory] Found ${memories.length} relevant memories (Vector).`);
            this.working.set('relevant_memories', memories);
        }

        // Also check legacy semantic memory
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

    // --- Vector Memory ---
    async rememberSuccess(plan, outcome) {
        const content = `Task: ${this.working.get('current_task')}\nPlan: ${JSON.stringify(plan)}\nOutcome: ${outcome}`;
        await this.vectorDb.store(content, {
            type: 'success',
            timestamp: Date.now(),
            plan
        });
        console.log('[Memory] Success pattern stored in vector memory.');
    }

    async searchMemory(query) {
        return await this.vectorDb.search(query);
    }
}

module.exports = MemoryManager;
