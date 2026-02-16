const fs = require('fs');
const path = require('path');

/**
 * Episodic Memory
 * Persists task history and summaries to a JSON file.
 */
class EpisodicMemory {
    constructor(config) {
        this.config = config || {};
        this.storagePath = this.config.path || path.join(process.cwd(), 'data', 'episodic_memory.json');
        this.cache = [];
        this.ensureStorage();
    }

    ensureStorage() {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.storagePath)) {
            fs.writeFileSync(this.storagePath, JSON.stringify([], null, 2));
        }
    }

    async load() {
        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            this.cache = JSON.parse(data);
        } catch (error) {
            console.error('[EpisodicMemory] Failed to load memory:', error);
            this.cache = [];
        }
    }

    async addEpisode(episode) {
        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...episode
        };
        this.cache.push(entry);
        this.save();
        return entry.id;
    }

    save() {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(this.cache, null, 2));
        } catch (error) {
            console.error('[EpisodicMemory] Failed to save memory:', error);
        }
    }

    async query(filterFn) {
        if (!filterFn) return this.cache;
        return this.cache.filter(filterFn);
    }
}

module.exports = EpisodicMemory;
