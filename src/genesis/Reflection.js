/**
 * PROJECT GENESIS: REFLECTION ENGINE v0.2 (V4 Enhanced)
 * "The Subconscious" - Cleaning up while sleeping.
 * V4: Pattern consolidation, semantic clustering, dynamic intent weights
 */

const Vectorizer = require('./Vectorizer');

class ReflectionEngine {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.pruneThreshold = 0;
        this.ageThreshold = 1000 * 60 * 60 * 24; // 24 Hours

        // V4: Track interaction patterns for generalization
        this.interactionLog = []; // { input, intent, entities, timestamp }
        this.semanticVectorizer = new Vectorizer(); // For clustering similar phrases
    }

    /**
     * REINFORCEMENT LEARNING (V3.5)
     * Assign reward/punishment based on adequacy scores.
     */
    assignReward(intent, adequacy, entities = []) {
        const reward = adequacy > 0.7 ? 1.0 : -0.5;

        // HEBBIAN LEARNING: Strengthen co-activated associations
        if (reward > 0) {
            for (const entity of entities) {
                const edgeList = Array.from(this.scaffold.memory.edges.values());
                const edges = edgeList.filter(e =>
                    (e.from === intent && e.to === entity.id) ||
                    (e.from === entity.id && e.to === intent)
                );

                for (const edge of edges) {
                    edge.weight = Math.min(edge.weight * 1.2, 5.0);
                }
            }

            const intentNode = this.scaffold.memory.nodes.get(intent);
            if (intentNode) {
                if (!intentNode.data) intentNode.data = {};
                intentNode.data.successCount = (intentNode.data.successCount || 0) + 1;
            }
        } else {
            for (const entity of entities) {
                const edgeList = Array.from(this.scaffold.memory.edges.values());
                const edges = edgeList.filter(e =>
                    (e.from === intent && e.to === entity.id) ||
                    (e.from === entity.id && e.to === intent)
                );

                for (const edge of edges) {
                    edge.weight = Math.max(edge.weight * 0.9, 0.1);
                }
            }

            const intentNode = this.scaffold.memory.nodes.get(intent);
            if (intentNode) {
                if (!intentNode.data) intentNode.data = {};
                intentNode.data.failureCount = (intentNode.data.failureCount || 0) + 1;
            }
        }

        console.log(`[Reinforcement] ${reward > 0 ? 'Reward' : 'Punishment'} for ${intent} (Adequacy: ${adequacy.toFixed(2)})`);
    }

    /**
     * V4: Log interaction for pattern learning
     */
    logInteraction(input, intent, entities) {
        this.interactionLog.push({
            input: input.toLowerCase(),
            intent,
            entities,
            timestamp: Date.now()
        });

        // Keep last 100 interactions
        if (this.interactionLog.length > 100) {
            this.interactionLog.shift();
        }
    }

    /**
     * V4: Consolidate patterns - merge semantically similar phrases
     */
    consolidatePatterns() {
        if (this.interactionLog.length < 5) return 0;

        // Group interactions by intent
        const intentGroups = {};
        for (const log of this.interactionLog) {
            if (!intentGroups[log.intent]) {
                intentGroups[log.intent] = [];
            }
            intentGroups[log.intent].push(log.input);
        }

        let consolidated = 0;

        // For each intent, find semantic clusters
        for (const [intent, inputs] of Object.entries(intentGroups)) {
            if (inputs.length < 3) continue;

            // Get unique inputs
            const uniqueInputs = [...new Set(inputs)];
            if (uniqueInputs.length < 2) continue;

            // Train vectorizer on these inputs
            this.semanticVectorizer.fit(uniqueInputs);

            // Find similar pairs (similarity > 0.7)
            for (let i = 0; i < uniqueInputs.length; i++) {
                for (let j = i + 1; j < uniqueInputs.length; j++) {
                    const vec1 = this.semanticVectorizer.transform(uniqueInputs[i]);
                    const vec2 = this.semanticVectorizer.transform(uniqueInputs[j]);
                    const similarity = this.semanticVectorizer.cosineSimilarity(vec1, vec2);

                    if (similarity > 0.7) {
                        // Merge: create ALIAS edge if not exists
                        const exists = Array.from(this.scaffold.memory.edges.values()).some(e =>
                            (e.from === uniqueInputs[i] && e.to === uniqueInputs[j]) ||
                            (e.from === uniqueInputs[j] && e.to === uniqueInputs[i])
                        );

                        if (!exists) {
                            this.scaffold.memory.addEdge(uniqueInputs[i], uniqueInputs[j], 'ALIAS', similarity);
                            console.log(`[Reflection] Linked "${uniqueInputs[i]}" ↔ "${uniqueInputs[j]}" (${similarity.toFixed(2)})`);
                            consolidated++;
                        }
                    }
                }
            }
        }

        return consolidated;
    }

    /**
     * V4: Update intent weights based on usage frequency
     */
    updateIntentWeights() {
        const intentCounts = {};

        for (const log of this.interactionLog) {
            intentCounts[log.intent] = (intentCounts[log.intent] || 0) + 1;
        }

        for (const [intent, count] of Object.entries(intentCounts)) {
            const intentNode = this.scaffold.memory.nodes.get(intent);
            if (intentNode) {
                if (!intentNode.data) intentNode.data = {};
                intentNode.data.usageWeight = count / this.interactionLog.length;
            }
        }
    }

    /**
     * V4: Prune redundant phrases - keep semantic exemplars
     */
    pruneRedundantPhrases() {
        // Find nodes with ALIAS edges
        const aliasGroups = new Map();

        for (const edge of this.scaffold.memory.edges.values()) {
            if (edge.type === 'ALIAS') {
                if (!aliasGroups.has(edge.from)) {
                    aliasGroups.set(edge.from, []);
                }
                aliasGroups.get(edge.from).push(edge.to);
            }
        }

        let pruned = 0;

        // For each group, keep the shortest phrase (likely the canonical form)
        for (const [canonical, aliases] of aliasGroups.entries()) {
            const allPhrases = [canonical, ...aliases];
            allPhrases.sort((a, b) => a.length - b.length);

            // Keep the shortest, mark others as redundant
            for (let i = 1; i < allPhrases.length; i++) {
                const node = this.scaffold.memory.nodes.get(allPhrases[i]);
                if (node) {
                    node.data = node.data || {};
                    node.data.redundant = true;
                    pruned++;
                }
            }
        }

        return pruned;
    }

    /**
     * Update edge weights based on co-activation (Hebbian Learning).
     */
    updateHebbianWeights() {
        const activeNodes = Array.from(this.scaffold.memory.nodes.values()).filter(n => n.activation > 0.5);

        for (let i = 0; i < activeNodes.length; i++) {
            for (let j = i + 1; j < activeNodes.length; j++) {
                const nodeA = activeNodes[i];
                const nodeB = activeNodes[j];

                const edgeList = Array.from(this.scaffold.memory.edges.values());
                const edge = edgeList.find(e =>
                    (e.from === nodeA.id && e.to === nodeB.id) ||
                    (e.from === nodeB.id && e.to === nodeA.id)
                );

                if (edge) {
                    const strengthIncrease = nodeA.activation * nodeB.activation * 0.1;
                    edge.weight = Math.min(edge.weight + strengthIncrease, 5.0);
                }
            }
        }
    }

    /**
     * Prune weak associations (connections that haven't been used).
     */
    pruneWeakAssociations() {
        const edgeList = Array.from(this.scaffold.memory.edges.values());
        const beforeCount = edgeList.length;

        // Remove edges with very low weight
        const toRemove = [];
        for (const [id, edge] of this.scaffold.memory.edges.entries()) {
            if (edge.weight <= 0.05) {
                toRemove.push(id);
            }
        }

        for (const id of toRemove) {
            this.scaffold.memory.edges.delete(id);
        }

        const removed = beforeCount - this.scaffold.memory.edges.size;
        if (removed > 0) {
            console.log(`[Reflection] Pruned ${removed} weak associations`);
        }
    }

    async reflect() {
        console.log(`[Reflection] Dreaming... (Graph Size: ${this.scaffold.memory.nodes.size})`);

        // V4: Pattern consolidation and learning
        const consolidated = this.consolidatePatterns();
        const redundant = this.pruneRedundantPhrases();
        this.updateIntentWeights();

        // V3.5: Existing pruning
        const removed = this.prune();

        if (removed > 0 || consolidated > 0 || redundant > 0) {
            console.log(`[Reflection] Pruned: ${removed}, Consolidated: ${consolidated}, Redundant: ${redundant}`);
        }
    }

    /**
     * Remove weak/old memories
     */
    prune() {
        let count = 0;
        const now = Date.now();

        for (const [id, node] of this.scaffold.memory.nodes) {
            if (node.type === 'IDENTITY' || node.type === 'ACTION' || node.type === 'SYSTEM') continue;

            const age = now - (node.created || 0);

            if (node.activation <= this.pruneThreshold && age > this.ageThreshold) {
                const degree = this.scaffold.memory.getNeighbors(id).length +
                    this.scaffold.memory.getIncoming(id).length;

                if (degree === 0) {
                    console.log(`[Reflection] Forgetting "${id}" (Unused)`);
                    this.scaffold.memory.nodes.delete(id);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * @deprecated - Replaced by consolidatePatterns() in V4
     */
    consolidate() {
        return this.consolidatePatterns();
    }
}

module.exports = ReflectionEngine;
