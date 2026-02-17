const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');
const path = require('path');
const fs = require('fs');

class SQLiteAdapter {
    constructor(dbPath) {
        // Ensure directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(dbPath);
        sqliteVec.load(this.db);
        this.initialize();
    }

    initialize() {
        // Create table for semantic memory with vector support
        // We use a separate virtual table for vector search if needed, or normalized tables?
        // sqlite-vec usually works with virtual tables like `vec0`

        // 1. Main content table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                metadata TEXT,
                created_at INTEGER
            );
        `);

        // 2. Vector table (using sqlite-vec)
        // dimension 4096 for qwen3:8b (or whatever model we use)
        // Let's assume 4096 for now, but we should probably configure it.
        // Qwen 2.5 7B is 3584 dims? 
        // mxbai-embed-large is 1024.
        // We need to know the dimension. 
        // For now, let's just use a standard float32 blob in a normal table and use vec_distance?
        // Or use the virtual table `vec0`? 

        // Simple approach: Store embedding as BLOB in the main table or side table
        // and use vec_distance_cosine(embedding, ?) in the query.

        // Let's add embedding column to memories if not exists?
        // SQLite doesn't support adding BLOB easily with specific structure, but we can just use a column.

        // Actually, sqlite-vec recommends using `vec0` virtual table for optimized search
        // CREATE VIRTUAL TABLE vec_items USING vec0(embedding float[1024]);

        // We will create a virtual table linked to memories via rowid? or just ID?
        // virtual tables in sqlite-vec integrate with rowid.

        try {
            this.db.exec(`
              CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
                  embedding float[768]
              );
          `);
        } catch (e) {
            console.error('[SQLite] Failed to create vector table. Is sqlite-vec loaded?', e);
        }
    }

    addMemory(id, content, metadata, embedding) {
        const stmt = this.db.prepare(`
            INSERT INTO memories (id, content, metadata, created_at)
            VALUES (?, ?, ?, ?)
        `);

        const vecStmt = this.db.prepare(`
            INSERT INTO vec_memories (rowid, embedding)
            VALUES (CAST(? AS INTEGER), ?)
        `);

        const transaction = this.db.transaction(() => {
            const info = stmt.run(id, content, JSON.stringify(metadata), Date.now());

            if (embedding) {
                // We need the rowid from the main table. 
                // Convert Float32Array to Buffer for better-sqlite3
                const buffer = Buffer.from(new Float32Array(embedding).buffer);
                // Cast rowid to Number just in case it's BigInt
                vecStmt.run(Number(info.lastInsertRowid), buffer);
            }
        });

        transaction();
    }

    async search(query, limit = 5) {
        if (!query) return [];

        let vector = query;

        // If string, try to trim. If empty string, return empty.
        // If we can't embed (no embedder), return empty.
        if (typeof query === 'string') {
            if (!query.trim()) return [];
            // If we have an embedder, use it (future proofing), otherwise fail
            if (this.embedder) {
                vector = await this.embedder.embed(query);
            } else {
                return [];
            }
        }

        if (!vector || vector.length === 0) return [];

        const stmt = this.db.prepare(`
            SELECT m.id, m.content, m.metadata, m.created_at, v.distance
            FROM vec_memories v
            LEFT JOIN memories m ON v.rowid = m.rowid
            WHERE v.embedding MATCH ? AND k = ?
            ORDER BY v.distance
        `);

        const results = stmt.all(new Float32Array(vector), limit); // Use 'vector' here
        return results.map(r => ({
            ...r,
            metadata: JSON.parse(r.metadata || '{}')
        }));
    }
}

module.exports = SQLiteAdapter;
