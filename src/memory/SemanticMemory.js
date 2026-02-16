const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Semantic Memory
 * Stores and retrieves knowledge using vector embeddings (mocked/simple for now).
 * 
 * In a full production env, this would use a real vector DB (Chroma/Pinecone)
 * and a real embedding model (Ollama/OpenAI).
 * 
 * For Sentra MVP, we'll implement a simple Keyword + Relevance score system
 * to simulate "semantic" retrieval without heavy dependencies.
 */
class SemanticMemory {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.memoryPath = path.join(baseDir, 'semantic_memory.json');
        this.memories = [];
    }

    async initialize() {
        try {
            const data = await fs.readFile(this.memoryPath, 'utf8');
            this.memories = JSON.parse(data);
        } catch (error) {
            this.memories = [];
        }
    }

    async add(content, metadata = {}) {
        const entry = {
            id: crypto.randomUUID(),
            content,
            metadata,
            timestamp: Date.now(),
            // In real app: embedding: await this.getEmbedding(content)
            keywords: this.extractKeywords(content)
        };
        this.memories.push(entry);
        await this.save();
        return entry.id;
    }

    async search(query, limit = 5) {
        // Simple keyword-based relevance scoring simulation
        const queryKeywords = this.extractKeywords(query);

        const scored = this.memories.map(mem => {
            let score = 0;
            queryKeywords.forEach(q => {
                if (mem.keywords.includes(q)) score += 1;
                if (mem.content.toLowerCase().includes(q)) score += 0.5;
            });
            return { ...mem, score };
        });

        // Filter valid scores and sort
        const results = scored
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return results;
    }

    async save() {
        await fs.writeFile(this.memoryPath, JSON.stringify(this.memories, null, 2));
    }

    extractKeywords(text) {
        // Very basic stop-word removal and tokenization
        const stopWords = new Set(['the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
        return text.toLowerCase()
            .split(/[\s,.]+/)
            .filter(w => w.length > 2 && !stopWords.has(w));
    }
}

module.exports = SemanticMemory;
