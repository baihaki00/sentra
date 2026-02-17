/**
 * PROJECT GENESIS: ATTENTION MODULE v0.1
 * "Selective Focus" - Only relevant memories influence reasoning.
 */

class AttentionFilter {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.relevanceThreshold = 0.3; // Min activation to be considered
        this.maxRelevantNodes = 20; // Limit for working memory capacity
    }

    /**
     * Filter memory nodes based on current context and activation.
     * @param {string} intent - Current intent
     * @param {Array} entities - Detected entities
     * @param {Array} recentContext - Recent conversation context
     * @returns {Array} - Filtered nodes with relevance scores
     */
    filterRelevant(intent, entities = [], recentContext = []) {
        const relevantNodes = [];

        // 1. INTENT-BASED FILTERING
        // Nodes directly connected to current intent are highly relevant
        if (intent) {
            const intentNode = this.scaffold.memory.nodes.get(intent);
            if (intentNode && intentNode.activation > this.relevanceThreshold) {
                relevantNodes.push({
                    id: intent,
                    node: intentNode,
                    relevance: intentNode.activation,
                    reason: 'INTENT'
                });
            }

            // Get neighbors of intent
            const neighbors = this.scaffold.memory.getNeighbors(intent);
            for (const neighborId of neighbors) {
                const neighbor = this.scaffold.memory.nodes.get(neighborId);
                if (neighbor && neighbor.activation > this.relevanceThreshold) {
                    relevantNodes.push({
                        id: neighborId,
                        node: neighbor,
                        relevance: neighbor.activation * 0.8, // Slightly lower than direct intent
                        reason: 'INTENT_NEIGHBOR'
                    });
                }
            }
        }

        // 2. ENTITY-BASED FILTERING
        // Nodes related to detected entities are relevant
        for (const entity of entities) {
            const entityNode = this.scaffold.memory.nodes.get(entity.id);
            if (entityNode && entityNode.activation > this.relevanceThreshold) {
                relevantNodes.push({
                    id: entity.id,
                    node: entityNode,
                    relevance: entityNode.activation,
                    reason: 'ENTITY'
                });
            }

            // Get entity neighbors
            const neighbors = this.scaffold.memory.getNeighbors(entity.id);
            for (const neighborId of neighbors) {
                const neighbor = this.scaffold.memory.nodes.get(neighborId);
                if (neighbor && neighbor.activation > this.relevanceThreshold) {
                    relevantNodes.push({
                        id: neighborId,
                        node: neighbor,
                        relevance: neighbor.activation * 0.7,
                        reason: 'ENTITY_NEIGHBOR'
                    });
                }
            }
        }

        // 3. CONTEXT-BASED FILTERING
        // Nodes from recent conversation are moderately relevant
        for (const contextItem of recentContext) {
            const contextNode = this.scaffold.memory.nodes.get(contextItem);
            if (contextNode && contextNode.activation > this.relevanceThreshold) {
                relevantNodes.push({
                    id: contextItem,
                    node: contextNode,
                    relevance: contextNode.activation * 0.6,
                    reason: 'CONTEXT'
                });
            }
        }

        // 4. ACTIVATION-BASED FILTERING
        // Highly activated nodes (regardless of connection) are relevant
        for (const [id, node] of this.scaffold.memory.nodes) {
            if (node.activation > 0.8) { // Very high activation
                // Check if not already added
                if (!relevantNodes.find(r => r.id === id)) {
                    relevantNodes.push({
                        id,
                        node,
                        relevance: node.activation,
                        reason: 'HIGH_ACTIVATION'
                    });
                }
            }
        }

        // 5. DEDUPLICATE AND SORT
        const uniqueNodes = new Map();
        for (const item of relevantNodes) {
            if (!uniqueNodes.has(item.id) || uniqueNodes.get(item.id).relevance < item.relevance) {
                uniqueNodes.set(item.id, item);
            }
        }

        // Sort by relevance (descending) and limit to working memory capacity
        const sorted = Array.from(uniqueNodes.values())
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, this.maxRelevantNodes);

        return sorted;
    }

    /**
     * Apply attention gating: suppress irrelevant nodes.
     * @param {Array} relevantNodes - Output from filterRelevant()
     */
    applyGating(relevantNodes) {
        const relevantIds = new Set(relevantNodes.map(r => r.id));

        // Suppress activation for non-relevant nodes
        for (const [id, node] of this.scaffold.memory.nodes) {
            if (!relevantIds.has(id)) {
                // Don't completely zero out, just reduce significantly
                node.activation *= 0.2; // Gating suppression
            }
        }

        console.log(`[Attention] Focused on ${relevantNodes.length} relevant nodes, suppressed ${this.scaffold.memory.nodes.size - relevantNodes.length} irrelevant`);
    }

    /**
     * Get a summary of what's currently in focus.
     * @param {Array} relevantNodes - Output from filterRelevant()
     * @returns {string} - Human-readable summary
     */
    getFocusSummary(relevantNodes) {
        const byReason = {
            INTENT: [],
            ENTITY: [],
            CONTEXT: [],
            HIGH_ACTIVATION: []
        };

        for (const item of relevantNodes) {
            const category = item.reason.includes('INTENT') ? 'INTENT' :
                item.reason.includes('ENTITY') ? 'ENTITY' :
                    item.reason.includes('CONTEXT') ? 'CONTEXT' : 'HIGH_ACTIVATION';
            byReason[category].push(item.id);
        }

        let summary = '[Attention] Focus: ';
        if (byReason.INTENT.length > 0) summary += `Intent-related: ${byReason.INTENT.slice(0, 3).join(', ')}; `;
        if (byReason.ENTITY.length > 0) summary += `Entities: ${byReason.ENTITY.slice(0, 3).join(', ')}; `;
        if (byReason.CONTEXT.length > 0) summary += `Context: ${byReason.CONTEXT.slice(0, 2).join(', ')}; `;

        return summary.trim();
    }
}

module.exports = AttentionFilter;
