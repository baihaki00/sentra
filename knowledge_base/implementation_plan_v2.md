/**
 * PROJECT GENESIS: COGNITIVE SCAFFOLD v0.3 (ARE Enhancement)
 * Upgrading Reasoning for Backward Chaining (Goal -> Prerequisites).
 */

// ... (Existing KnowledgeGraph) ...
// ADD:
// getIncoming(nodeId) { return this.edges.filter(e => e.to === nodeId); }

class ReasoningEngine {
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * Backward Chaining: "I want to do X. What do I need?"
     */
    findPlan(goalActionId) {
        const plan = [];
        const visited = new Set();
        const stack = [goalActionId];

        while (stack.length > 0) {
            const current = stack.pop();
            if (visited.has(current)) continue;
            visited.add(current);

            plan.unshift(current); // Add to start of plan

            // Find requirements
            const requirements = this.graph.getIncoming(current)
                .filter(e => e.type === 'REQUIRES')
                .map(e => e.from); // e.g. "PATH"
            
            for (const req of requirements) {
                // Who produces this requirement?
                const producers = this.graph.getIncoming(req)
                    .filter(e => e.type === 'PRODUCES')
                    .map(e => e.from); // e.g. "FIND_FILE"
                
                if (producers.length > 0) {
                    // Primitive: Just pick the first producer
                    // Future: MCTS to pick best producer
                    stack.push(producers[0]);
                }
            }
        }
        
        return plan;
    }
}
