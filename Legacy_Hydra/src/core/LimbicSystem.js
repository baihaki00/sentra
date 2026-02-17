/**
 * LIMBIC SYSTEM (Layer 2)
 * Biological Analog: Hippocampus (Memory) / Amygdala (Safety)
 * Function: Semantic Caching and Safety Filtering.
 * Latency: < 50ms
 */
class LimbicSystem {
    constructor(agent) {
        this.agent = agent;
        this.similarityThreshold = 0.95; // Very strict for cache hits
    }

    /**
     * Check if we have seen this exact intent before.
     * @param {string} input 
     * @returns {object|null} Cached result or null
     */
    async process(input) {
        // 1. Safety Check (Amygdala) - [Future Expansion]

        // 2. Semantic Cache (Hippocampus)
        // We leverage the existing VisualMemory (which uses vector embeddings)
        // Reuse the "episodic_memory" table or a new "semantic_cache" table?
        // For now, let's query the 'history' collection in VisualMemory.

        if (!this.agent.components.visual_memory) return null;

        try {
            // "Recalling" is effectively a semantic search
            const memories = await this.agent.components.visual_memory.search(input, 1, 'history');

            if (memories && memories.length > 0) {
                const bestMatch = memories[0];
                if (bestMatch.similarity >= this.similarityThreshold) {
                    // Cache Hit!
                    // this.agent.log(`[Limbic] ⚡ Cache Hit (${bestMatch.similarity.toFixed(4)}): "${bestMatch.content}"`);
                    return bestMatch.metadata.result || null;
                }
            }
        } catch (e) {
            // Ignore cache errors, fail open to Cortex
            // console.error('[Limbic] Cache Lookup Failed:', e.message);
        }

        return null;
    }
}

module.exports = LimbicSystem;
