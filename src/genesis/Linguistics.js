/**
 * SENTRA GENESIS: LINGUISTICS ENGINE v0.2
 * Minimal Linguistic Primitives & Emergent Pattern Generation.
 * Replaces hardcoded grammar with Role-Based Tokenization.
 * v0.2: Adds Pattern Learning & Persistence
 */

const fs = require('fs');
const path = require('path');

class LinguisticsEngine {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.patternsPath = path.join(process.cwd(), 'data', 'patterns.json');

        // Learned Patterns (Intent -> [Pattern List])
        this.patterns = new Map();

        // Minimal Primitives (Roles)
        this.ROLES = {
            REFERENCE: 'REF',   // Who/What (Entities)
            ACTION: 'ACT',      // Doing (Verbs)
            QUALIFIER: 'QUAL',  // How/Which (Adjectives)
            CONNECTOR: 'CONN',  // Logic (And/Or)
            SIGNAL: 'SIG'       // Mood (?, !)
        };

        this.loadPatterns();
    }

    initializeSeedPatterns() {
        // Only used if no patterns.json exists
        this.patterns.set('INTENT:GREETING', [
            { template: "System online. Ready.", weight: 1.0 },
            { template: "I am listening.", weight: 1.0 },
            { template: "Cognition active.", weight: 0.8 }
        ]);

        this.patterns.set('INTENT:FACT_QUERY', [
            { template: "${REF1} ${ACT} ${REF2}", weight: 1.0 }, // Tokyo is place
            { template: "${REF1} is a ${REF2}", weight: 0.8 },   // Tokyo is a place
            { template: "Relation: ${REF1} -> ${ACT} -> ${REF2}", weight: 0.5 }
        ]);

        this.patterns.set('INTENT:STATEMENT', [
            { template: "I have learned that ${REF1} ${ACT} ${REF2}.", weight: 1.0 },
            { template: "Noted: ${REF1} ${ACT} ${REF2}.", weight: 0.8 },
            { template: "Knowledge updated.", weight: 0.5 }
        ]);

        this.savePatterns();
    }

    loadPatterns() {
        try {
            if (fs.existsSync(this.patternsPath)) {
                const data = fs.readFileSync(this.patternsPath, 'utf8');
                const json = JSON.parse(data);
                for (const [intent, list] of Object.entries(json)) {
                    this.patterns.set(intent, list);
                }
            } else {
                this.initializeSeedPatterns();
            }
        } catch (e) {
            console.error(`[Linguistics] Error loading patterns: ${e.message}`);
            this.initializeSeedPatterns();
        }
    }

    savePatterns() {
        try {
            const json = {};
            for (const [intent, list] of this.patterns.entries()) {
                json[intent] = list;
            }
            // Ensure directory exists
            const dir = path.dirname(this.patternsPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(this.patternsPath, JSON.stringify(json, null, 2));
        } catch (e) {
            console.error(`[Linguistics] Error saving patterns: ${e.message}`);
        }
    }

    /**
     * Learn a new pattern from user input
     * @param {string} intent - Target intent
     * @param {string} rawTemplate - User template (e.g. "[Subject] is definitely [Object]")
     */
    learnPattern(intent, rawTemplate) {
        // Convert User Placeholders to System Slots
        let template = rawTemplate
            .replace(/\[Subject\]|\[Ref1\]/gi, '${REF1}')
            .replace(/\[Object\]|\[Ref2\]/gi, '${REF2}')
            .replace(/\[Action\]|\[Act\]/gi, '${ACT}')
            .replace(/\[Qualifier\]|\[Qual\]/gi, '${QUAL}');

        // Initialize Intent list if missing
        if (!this.patterns.has(intent)) {
            this.patterns.set(intent, []);
        }

        const list = this.patterns.get(intent);

        // Prevent duplicates
        if (!list.find(p => p.template === template)) {
            // New patterns get high initial weight (recency bias)
            list.push({ template: template, weight: 2.0 });
            this.savePatterns();
            return true;
        }
        return false;
    }

    /**
     * Classify a token into a Linguistic Role
     */
    classifyToken(token) {
        const node = this.scaffold.memory.nodes.get(token.toLowerCase());

        // 1. Memory Lookup
        if (node) {
            if (node.type === 'ACTION') return this.ROLES.ACTION;
            if (node.type === 'PROPERTY') return this.ROLES.QUALIFIER;
            if (node.type === 'RELATION') return this.ROLES.ACTION;
            return this.ROLES.REFERENCE;
        }

        // 2. Heuristics
        const lower = token.toLowerCase();
        if (['is', 'are', 'run', 'execute', 'do'].includes(lower)) return this.ROLES.ACTION;
        if (['the', 'a', 'an'].includes(lower)) return this.ROLES.QUALIFIER;
        if (['and', 'or', 'but'].includes(lower)) return this.ROLES.CONNECTOR;
        if (['?', '!', 'not'].includes(lower)) return this.ROLES.SIGNAL;

        return this.ROLES.REFERENCE;
    }

    /**
     * Generate Output from Cognition
     */
    generate(intent, entities, context = {}) {
        let candidates = this.patterns.get(intent) || [];
        if (candidates.length === 0) {
            return this.fallbackGeneration(intent, entities);
        }

        // Weighted Random Selection
        // Calculate total weight
        const totalWeight = candidates.reduce((sum, p) => sum + p.weight, 0);
        let r = Math.random() * totalWeight;
        let selected = candidates[0];

        for (const p of candidates) {
            r -= p.weight;
            if (r <= 0) {
                selected = p;
                break;
            }
        }

        let output = selected.template;

        // Context-aware slot filling
        if (context.REF1) output = output.split('${REF1}').join(context.REF1);
        if (context.REF2) output = output.split('${REF2}').join(context.REF2);
        if (context.ACT) output = output.split('${ACT}').join(context.ACT);
        if (context.QUAL) output = output.split('${QUAL}').join(context.QUAL);

        // Generic ${REF} filling
        if (output.includes('${REF}')) {
            const ref = entities.find(e => this.classifyToken(e.id) === this.ROLES.REFERENCE) || entities[0];
            if (ref) output = output.split('${REF}').join(ref.id);
        }

        return output.replace(/\$\{\w+\}/g, '?');
    }

    fallbackGeneration(intent, entities) {
        const refs = entities.map(e => e.id).join(', ');
        return `Cognition active. Intent: ${intent}. Entities: ${refs || 'None'}.`;
    }
}

module.exports = LinguisticsEngine;
