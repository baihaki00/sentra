/**
 * PROJECT GENESIS: KNOWLEDGE LOADER v0.1
 * Ingests structured data (JSON) into the Knowledge Graph.
 */
const fs = require('fs');
const path = require('path');

class KnowledgeLoader {
    constructor(scaffold) {
        this.scaffold = scaffold;
    }

    ingest(filePath) {
        if (!fs.existsSync(filePath)) {
            console.error(`[Loader] File not found: ${filePath}`);
            return false;
        }

        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            let count = 0;

            for (const item of data) {
                // Expecting { subject, predicate, object }
                if (item.subject && item.predicate && item.object) {
                    const subj = item.subject.toLowerCase();
                    const obj = item.object.toLowerCase();
                    let relation = 'RELATED_TO';

                    // Map predicates
                    if (item.predicate === 'is a') relation = 'IS_A';
                    if (item.predicate === 'is') relation = 'IS';
                    if (item.predicate === 'has') relation = 'HAS';

                    // Create nodes explicitly if needed, but associate does it
                    this.scaffold.associate(subj, obj, relation, 1.0);
                    count++;
                }
            }
            console.log(`[Loader] Ingested ${count} facts from ${path.basename(filePath)}`);
            return true;
        } catch (e) {
            console.error(`[Loader] Error loading ${filePath}:`, e);
            return false;
        }
    }
}

module.exports = KnowledgeLoader;
