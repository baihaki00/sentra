const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const SQLiteAdapter = require('./SQLiteAdapter');

/**
 * Semantic Memory (SQLite + Vector)
 * Stores and retrieves knowledge using local vector database.
 */
class SemanticMemory {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.dbPath = path.join(baseDir, 'memory.db');
        this.adapter = null;
        this.modelName = 'nomic-embed-text'; // Optimized for embeddings
    }

    async initialize() {
        if (!this.adapter) {
            this.adapter = new SQLiteAdapter(this.dbPath);
        }
    }

    async getEmbedding(text) {
        try {
            const response = await axios.post('http://localhost:11434/api/embeddings', {
                model: this.modelName,
                prompt: text
            });
            return response.data.embedding;
        } catch (error) {
            console.error('[Memory] Embedding failed:', error.message);
            // Fallback: return zero vector or throw?
            // For now, return null to skip vector indexing
            return null;
        }
    }

    async add(content, metadata = {}) {
        const id = crypto.randomUUID();
        const embedding = await this.getEmbedding(content);

        if (!embedding) {
            console.warn('[Memory] Storing without embedding (search will rely on keywords currently not impl).');
        }

        this.adapter.addMemory(id, content, metadata, embedding);
        return id;
    }

    async search(query, limit = 5) {
        const queryEmbedding = await this.getEmbedding(query);
        if (!queryEmbedding) return [];

        return this.adapter.search(queryEmbedding, limit);
    }
}

module.exports = SemanticMemory;
