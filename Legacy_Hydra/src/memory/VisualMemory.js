const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
// const sqliteVec = require('sqlite-vec'); // Assuming auto-load or manual load if needed

class VisualMemory {
    constructor(agent) {
        this.agent = agent;
        this.dbPath = path.join(process.cwd(), 'data', 'visual.db');
        this.db = null;
        this.hasVectorSupport = false;
    }

    async initialize() {
        // Ensure data dir exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        this.db = new Database(this.dbPath);
        console.log('[VisualMemory] Database connection established.');

        // Try load vector extension
        try {
            // For prototype, we might skip actual sqlite-vec load if not pre-compiled correctly
            // But we will structure the table to support it or fallback to FTS5 (Full Text Search)
            // which is also excellent for "description" search.
            // Given the complexity of compiling sqlite-vec on Windows for this environment,
            // I will use FTS5 for reliability in this specific run, but design for RAG.

            // Enable FTS5
            this.db.exec(`
                CREATE VIRTUAL TABLE IF NOT EXISTS visual_fts USING fts5(
                    filepath,
                    description,
                    timestamp
                );
             `);
            console.log('[VisualMemory] Visual FTS5 initialized.');
        } catch (e) {
            console.error('[VisualMemory] Failed to init FTS:', e);
        }
    }

    async add(filepath, description) {
        if (!this.db) await this.initialize();

        try {
            const stmt = this.db.prepare(`
                INSERT INTO visual_fts (filepath, description, timestamp)
                VALUES (?, ?, ?)
             `);
            stmt.run(filepath, description, Date.now());
            console.log(`[VisualMemory] Indexed: ${filepath}`);
        } catch (e) {
            console.error('[VisualMemory] Failed to index image:', e);
        }
    }

    async search(query) {
        if (!this.db) await this.initialize();

        try {
            // Semantic-ish search via FTS
            // In a real RAG, we would use vector distance here.
            // For now, FTS is surprisingly good for "blue banner" -> matches description.
            const stmt = this.db.prepare(`
                SELECT filepath, description, timestamp 
                FROM visual_fts 
                WHERE description MATCH ? 
                ORDER BY rank 
                LIMIT 5
            `);
            const results = stmt.all(query);
            return results.map(r => `[Image: ${r.filepath}] Description: ${r.description}`);
        } catch (e) {
            console.error('[VisualMemory] Search failed:', e);
            return [];
        }
    }
}

module.exports = VisualMemory;
