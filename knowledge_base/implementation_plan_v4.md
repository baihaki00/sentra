/**
 * PROJECT GENESIS: CURIOSITY ENGINE v0.5
 * Entropy-based Active Learning.
 */

class CuriosityModule {
    constructor(scaffold) {
        this.scaffold = scaffold;
    }

    /**
     * Find nodes that need exploration.
     * Heuristic: Nodes with high activation (seen often) but low connectivity (unknown properties).
     */
    findInterestingNodes() {
        const candidates = [];
        for (const [id, node] of this.scaffold.memory.nodes) {
            // Ignore system nodes
            if (node.type === 'IDENTITY' || node.type === 'ACTION') continue;
            
            // Calculate Entropy (Simulation)
            const degree = this.scaffold.memory.getNeighbors(id).length;
            const familiarity = node.activation;
            
            // High familiarity, low degree = "I see this often but don't know what it is"
            if (familiarity > 0 && degree < 3) {
                candidates.push({ id, score: familiarity - degree });
            }
        }
        return candidates.sort((a, b) => b.score - a.score);
    }

    /**
     * Propose an action to reduce entropy.
     */
    proposeExploration() {
        const interesting = this.findInterestingNodes();
        if (interesting.length === 0) return null;

        const targetNodeId = interesting[0].id;
        const targetNode = this.scaffold.memory.nodes.get(targetNodeId);

        // SIMPLE HEURISTICS (Will be replaced by Graph Learning later)
        // If it looks like a directory (no extension?), List it.
        // If it looks like a file (extension?), Read it.
        
        // Check if we already did something?
        // Assume we bind "PROCESSED" edge if done.
        
        if (targetNode.type === 'CONCEPT') {
             // For now, blindly try to LIST it if it might be a dir
             return { action: 'LIST_FILES', args: { path: targetNodeId } };
        }
        
        return null;
    }
}

module.exports = CuriosityModule;
