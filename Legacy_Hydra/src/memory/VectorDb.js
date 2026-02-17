const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * VectorDb - Semantic Memory Layer
 * Uses sqlite-vec for vector similarity search.
 */
class VectorDb {
    constructor(dbPath = './data/memory.db') {
        this.dbPath = dbPath;
        this.db = null;

        // Ensure directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async initialize() {
        console.log('[VectorDb] Initializing semantic memory...');

        this.db = new Database(this.dbPath);

        // Load sqlite-vec extension
        // NOTE: sqlite-vec should auto-load if installed via npm

        // Create memories table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                embedding TEXT,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at);
        `);

        console.log('[VectorDb] Memory initialized.');
    }

    /**
     * Store a memory with its vector embedding
     */
    async store(content, metadata = {}) {
        if (!this.db) await this.initialize();

        // Generate embedding (simplified - using hash for now)
        // In production, use actual embeddings from LLM
        const embedding = this.simpleEmbed(content);
        const embeddingJson = JSON.stringify(embedding);

        const stmt = this.db.prepare(`
            INSERT INTO memories (content, embedding, metadata)
            VALUES (?, ?, ?)
        `);

        const result = stmt.run(
            content,
            embeddingJson,
            JSON.stringify(metadata)
        );

        return result.lastInsertRowid;
    }

    /**
     * Search for similar memories
     */
    async search(query, limit = 5) {
        if (!this.db) await this.initialize();

        const queryEmbedding = this.simpleEmbed(query);

        // Get all memories and compute similarity (brute force for now)
        const memories = this.db.prepare('SELECT * FROM memories').all();

        const results = [];
        for (const mem of memories) {
            try {
                if (!mem.embedding) continue;
                const memEmbedding = JSON.parse(mem.embedding);
                const similarity = this.cosineSimilarity(queryEmbedding, memEmbedding);

                results.push({
                    id: mem.id,
                    content: mem.content,
                    metadata: JSON.parse(mem.metadata || '{}'),
                    similarity,
                    created_at: mem.created_at
                });
            } catch (e) {
                // Skip corrupt memories instead of crashing
                continue;
            }
        }

        // Sort by similarity and return top N
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }

    /**
     * Improved embedding: Word hashing + Character N-grams
     * Char n-grams capture subword similarity (e.g., "interface" ↔ "interaction")
     */
    simpleEmbed(text) {
        const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        const vector = new Array(256).fill(0);

        // Layer 1: Word-level hashing (first 128 dims)
        words.forEach(word => {
            const hash = this.hashCode(word);
            vector[Math.abs(hash) % 128] += 1;
        });

        // Layer 2: Character trigram hashing (dims 128-255)
        // This captures subword patterns for semantic similarity
        for (const word of words) {
            const padded = `_${word}_`;
            for (let i = 0; i < padded.length - 2; i++) {
                const trigram = padded.substring(i, i + 3);
                const hash = this.hashCode(trigram);
                vector[128 + (Math.abs(hash) % 128)] += 1;
            }
        }

        // Normalize
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return vector.map(v => magnitude > 0 ? v / magnitude : 0);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    cosineSimilarity(a, b) {
        const len = Math.min(a.length, b.length);
        if (len === 0) return 0;

        let dotProduct = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < len; i++) {
            dotProduct += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);

        if (magA === 0 || magB === 0) return 0;
        return dotProduct / (magA * magB);
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

module.exports = VectorDb;
