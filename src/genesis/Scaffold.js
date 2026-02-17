/**
 * PROJECT GENESIS: COGNITIVE SCAFFOLD v0.2
 * The Structural Bias for Emergent Intelligence.
 */

class KnowledgeGraph {
    constructor() {
        this.nodes = new Map(); // ID -> Node { id, type, data, activation }
        this.edges = new Map(); // ID -> Edge { from, to, type, weight }
    }

    addNode(id, type = 'CONCEPT', data = {}, layer = 'SEMANTIC') {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id, type, data, layer,
                activation: 0,
                created: Date.now()
            });
            return true;
        }
        return false;
    }

    bindIdentity(nodeId, identityId, relation = 'OWNS') {
        if (this.nodes.has(nodeId) && this.nodes.has(identityId)) {
            this.addEdge(identityId, nodeId, relation);
        }
    }

    associate(fromId, toId, relationType = 'RELATION', weight = 1.0) {
        console.log(`[Assoc] ${fromId} -[${relationType}]-> ${toId}`);
        this.addEdge(fromId, toId, relationType, weight);
    }

    /**
     * BELIEF NODE METHODS (V3.5)
     */
    createBelief(proposition, confidence = 0.5, source = "inferred") {
        const beliefId = `BELIEF:${proposition}`;

        if (this.nodes.has(beliefId)) {
            const existing = this.nodes.get(beliefId);
            if (!existing.data) existing.data = {};
            const oldConf = existing.data.confidence || 0.5;
            existing.data.confidence = (oldConf * 0.7 + confidence * 0.3);
            existing.data.lastUpdated = Date.now();
            existing.data.updateCount = (existing.data.updateCount || 1) + 1;
            return beliefId;
        }

        this.addNode(beliefId, 'BELIEF');
        const node = this.nodes.get(beliefId);
        node.data = {
            proposition,
            confidence,
            source,
            timestamp: Date.now(),
            lastUpdated: Date.now(),
            updateCount: 1
        };

        return beliefId;
    }

    updateBeliefConfidence(beliefId, confirmed, strength = 0.5) {
        const node = this.nodes.get(beliefId);
        if (!node || node.type !== 'BELIEF') return;

        if (!node.data) node.data = {};
        const oldConf = node.data.confidence || 0.5;

        if (confirmed) {
            const increase = (1 - oldConf) * strength * 0.5;
            node.data.confidence = Math.min(1.0, oldConf + increase);
        } else {
            const decrease = oldConf * strength * 0.5;
            node.data.confidence = Math.max(0.0, oldConf - decrease);
        }

        node.data.lastUpdated = Date.now();
        node.data.updateCount = (node.data.updateCount || 1) + 1;
    }

    getBeliefs(minConfidence = 0.5) {
        const beliefs = [];
        for (const [id, node] of this.nodes) {
            if (node.type === 'BELIEF' && node.data && node.data.confidence >= minConfidence) {
                beliefs.push({ id, ...node.data });
            }
        }
        return beliefs.sort((a, b) => b.confidence - a.confidence);
    }

    addEdge(from, to, type = 'RELATION', weight = 1.0) {
        const id = `${from}|${type}|${to}`;
        if (!this.edges.has(id)) {
            this.edges.set(id, { id, from, to, type, weight, uses: 0 });
        } else {
            // Hebbian Reinforcement
            const edge = this.edges.get(id);
            edge.weight = Math.min(edge.weight + 0.1, 5.0); // Cap weight
            edge.uses++;
        }
    }

    getNeighbors(nodeId) {
        // Return outgoing edges
        return Array.from(this.edges.values()).filter(e => e.from === nodeId);
    }

    getIncoming(nodeId) {
        // Return incoming edges
        return Array.from(this.edges.values()).filter(e => e.to === nodeId);
    }

    /**
     * Spread activation from a source node to its neighbors.
     * @param {string} startNodeId - The source node.
     * @param {number} amount - Initial activation amount.
     * @param {number} decay - decay factor (0.0 - 1.0) per hop.
     */
    spreadActivation(startNodeId, amount = 1.0, decay = 0.5, visited = new Set()) {
        if (amount <= 0.1) return; // Stop if too weak
        if (visited.has(startNodeId)) return; // Prevent cycles

        visited.add(startNodeId);

        const node = this.nodes.get(startNodeId);
        if (!node) return;

        // Activate current node
        node.activation = Math.min(node.activation + amount, 50);

        // Spread to neighbors (Outgoing)
        const neighbors = this.getNeighbors(startNodeId);
        for (const edge of neighbors) {
            // Weight influences spread? Yes.
            const spreadAmount = amount * decay * edge.weight;
            this.spreadActivation(edge.to, spreadAmount, decay, visited);
        }
    }

    /**
     * Decay activation of all nodes (Forgetting)
     * @param {number} factor - Multiplier (0.0 - 1.0), lower means faster decay
     */
    decayAll(factor = 0.9) {
        for (const node of this.nodes.values()) {
            if (node.activation > 0.1) {
                node.activation *= factor;
            } else {
                node.activation = 0;
            }
        }
    }
}

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

        // Simple DFS for dependency resolution
        // Note: Real implementation needs cycle detection on stack path
        while (stack.length > 0) {
            const current = stack[stack.length - 1]; // Peek

            if (visited.has(current)) {
                stack.pop();
                continue;
            }

            // Find requirements
            const incoming = this.graph.getIncoming(current);
            const requirements = incoming
                .filter(e => e.type === 'REQUIRES') // Action -> Concept
                .map(e => e.from) // The Concept required
            // Wait, if Action REQUIRES Concept, edge is Action -> Concept ?
            // Usually "A requires B" means dependency.
            // In test_reasoning.js: scaffold.associate('READ_FILE', 'FILE_PATH', 'REQUIRES');
            // So READ_FILE --[REQUIRES]--> FILE_PATH.
            // So getting INCOMING of READ_FILE won't find it.
            // We need OUTGOING of READ_FILE with type 'REQUIRES'.

            // Correction:
            // Goals are Actions.
            // Action --REQUIRES--> Concept.
            // Concept <--PRODUCES-- Action.

            const outgoing = this.graph.getNeighbors(current);
            const requiredConcepts = outgoing
                .filter(e => e.type === 'REQUIRES')
                .map(e => e.to);

            let missingRequirement = false;

            for (const concept of requiredConcepts) {
                // Do we have a plan for this concept?
                // Or is it already known? (Not implemented in v0.3 yet)

                // Find PRODUCER of this concept
                const producers = this.graph.getIncoming(concept)
                    .filter(e => e.type === 'PRODUCES')
                    .map(e => e.from);

                if (producers.length > 0) {
                    const producer = producers[0]; // naive selection
                    if (!visited.has(producer) && !plan.includes(producer)) {
                        stack.push(producer);
                        missingRequirement = true;
                    }
                }
            }

            if (!missingRequirement) {
                visited.add(current);
                plan.push(current);
                stack.pop();
            }
        }

        return plan;
    }

    /**
     * Answer property queries about an Identity.
     * e.g. "Who are you?" -> "I am Sentra (Identity Node)"
     */
    getIdentityProp(identityId) {
        const node = this.graph.nodes.get(identityId);
        if (!node) return null;

        // Collect properties/relations
        const props = {
            id: node.id,
            type: node.type,
            facts: []
        };

        // Find outgoing edges (What do I know/own?)
        const outgoing = this.graph.getNeighbors(identityId);
        for (const edge of outgoing) {
            props.facts.push(`${edge.type} -> ${edge.to}`);
        }

        return props;
    }

    /**
     * Monte Carlo Tree Search (Simplified)
     * Finds a path from `startNode` to a state that satisfies `goalPredicate`.
     */
    plan(startNodeId, goalPredicate, maxDepth = 5) {
        // 1. Selection
        // 2. Expansion
        // 3. Simulation
        // 4. Backpropagation

        // For v0.2, implemented as weighted BFS (A* with Heuristic)
        const queue = [{ id: startNodeId, path: [], score: 0 }];
        const visited = new Set();

        while (queue.length > 0) {
            // Sort by score (DESC)
            queue.sort((a, b) => b.score - a.score);
            const current = queue.shift();

            if (goalPredicate(current.id)) {
                return current.path;
            }

            if (current.path.length >= maxDepth) continue;
            visited.add(current.id);

            const edges = this.graph.getNeighbors(current.id);
            for (const edge of edges) {
                if (!visited.has(edge.to)) {
                    // Heuristic: Edge weight + Node Activation
                    const node = this.graph.nodes.get(edge.to);
                    const heuristic = edge.weight + (node ? node.activation * 0.1 : 0);

                    queue.push({
                        id: edge.to,
                        path: [...current.path, edge],
                        score: current.score + heuristic
                    });
                }
            }
        }
        return null; // No plan found
    }
}

class ContextWindow {
    constructor(graph, capacity = 10) {
        this.graph = graph;
        this.capacity = capacity;
        this.shortTerm = []; // [IDs]
    }

    add(nodeId) {
        // Add to STM
        this.shortTerm = this.shortTerm.filter(id => id !== nodeId); // Dedupe
        this.shortTerm.push(nodeId);
        if (this.shortTerm.length > this.capacity) {
            this.shortTerm.shift(); // Forget oldest
        }
        console.log(`[Context] Added ${nodeId}. STM: ${this.shortTerm}`);
    }

    getRelevantNodes() {
        // Return STM + Activated LTM
        // For now, just return STM
        const nodes = this.shortTerm.map(id => this.graph.nodes.get(id));
        const filtered = nodes.filter(n => n);
        console.log(`[Context] getRelevantNodes: STM Size ${this.shortTerm.length} -> Resolved ${filtered.length}`);
        return filtered;
    }
}

class Scaffold {
    constructor() {
        this.memory = new KnowledgeGraph();
        this.reasoner = new ReasoningEngine(this.memory);
        this.context = new ContextWindow(this.memory);
        this.state = 'IDLE';
    }

    setMemory(newMemory) {
        this.memory = newMemory;
        this.reasoner.graph = newMemory;
        this.context.graph = newMemory;
    }

    perceive(inputToken) {
        // 1. Encode
        this.memory.addNode(inputToken, 'PERCEPT');
        const node = this.memory.nodes.get(inputToken);

        // 2. Activate & Decay
        // node.activation++; // Handled by spreadActivation now
        node.lastAccessed = Date.now();

        // 3. Spreading Activation
        // Activate the node and let it ripple
        this.memory.spreadActivation(inputToken, 2.0, 0.5); // Start strong

        // 4. Add to Context
        this.context.add(inputToken);

        return inputToken;
    }

    associate(conceptA, conceptB, type = 'NEXT') {
        this.memory.addEdge(conceptA, conceptB, type);
    }

    createBelief(proposition, confidence, source) {
        return this.memory.createBelief(proposition, confidence, source);
    }

    updateBeliefConfidence(beliefId, confirmed, strength) {
        return this.memory.updateBeliefConfidence(beliefId, confirmed, strength);
    }

    getBeliefs(minConfidence) {
        return this.memory.getBeliefs(minConfidence);
    }

    // MEMORY HELPERS
    initIdentity() {
        this.memory.addNode('IDENTITY:SENTRA', 'IDENTITY', {}, 'META');
        this.memory.addNode('IDENTITY:USER', 'IDENTITY', {}, 'META');
    }

    seedIntents() {
        // Ensure Identities Exist (Upgrade Path)
        if (!this.memory.nodes.has('IDENTITY:SENTRA')) {
            this.initIdentity();
        }

        const intents = [
            'INTENT:GREETING', 'INTENT:SELF_QUERY', 'INTENT:USER_QUERY',
            'INTENT:FACT_QUERY', 'INTENT:TEACHING', 'INTENT:UNKNOWN'
        ];

        for (const intent of intents) {
            this.memory.addNode(intent, 'INTENT', {}, 'META');
        }

        // Basic Associations (Seeds) - Multiple variants for robustness
        this.associate('hello', 'INTENT:GREETING', 'INDICATES', 2.0);
        this.associate('hi', 'INTENT:GREETING', 'INDICATES', 2.0);
        this.associate('hey', 'INTENT:GREETING', 'INDICATES', 2.0);

        // Self-query variants
        this.associate('who are you', 'INTENT:SELF_QUERY', 'INDICATES', 3.0);
        this.associate('who are you?', 'INTENT:SELF_QUERY', 'INDICATES', 3.0);
        this.associate('what are you', 'INTENT:SELF_QUERY', 'INDICATES', 2.5);

        // User-query variants
        this.associate('who am i', 'INTENT:USER_QUERY', 'INDICATES', 3.0);
        this.associate('who am i?', 'INTENT:USER_QUERY', 'INDICATES', 3.0);

        // Fact-query variants
        this.associate('what is', 'INTENT:FACT_QUERY', 'INDICATES', 2.0);
        this.associate('what is this', 'INTENT:FACT_QUERY', 'INDICATES', 2.0);

        // Teaching
        this.associate('means', 'INTENT:TEACHING', 'INDICATES', 2.0);

        // Add Natural Language Aliases (Always Ensure)
        this.memory.addNode('Sentra', 'ALIAS', { target: 'IDENTITY:SENTRA' }, 'META');
        this.associate('Sentra', 'IDENTITY:SENTRA', 'ALIAS');

        this.memory.addNode('User', 'ALIAS', { target: 'IDENTITY:USER' }, 'META');
        this.associate('User', 'IDENTITY:USER', 'ALIAS');
    }

    logSemantic(conceptId, data = {}) {
        this.memory.addNode(conceptId, 'CONCEPT', data, 'SEMANTIC');
        this.memory.bindIdentity(conceptId, 'IDENTITY:SENTRA', 'KNOWS');
    }

    logEpisodic(actionId, result) {
        const eventId = `EVENT:${Date.now()}`;
        this.memory.addNode(eventId, 'EVENT', { action: actionId, result }, 'EPISODIC');
        this.memory.bindIdentity(eventId, 'IDENTITY:SENTRA', 'DID');
        this.memory.addEdge(eventId, actionId, 'EXECUTION_OF');

        // Add to Context
        this.context.add(eventId);

        return eventId;
    }

    // ... (rest of class)
    recallAction(conceptId) {
        // 1. Exact Match via Graph Traversal
        const neighbors = this.memory.getNeighbors(conceptId);
        const triggerEdge = neighbors.find(e => e.type === 'TRIGGERS');
        if (triggerEdge) return this.memory.nodes.get(triggerEdge.to);

        // 2. Fuzzy/Keyword Match
        let bestMatch = null;
        let maxLen = 0;
        const normalizedInput = String(conceptId).toLowerCase();

        for (const edge of this.memory.edges.values()) {
            if (edge.type === 'TRIGGERS') {
                const triggerPhrase = edge.from.toLowerCase();
                if (normalizedInput.includes(triggerPhrase)) {
                    if (triggerPhrase.length > maxLen) {
                        maxLen = triggerPhrase.length;
                        bestMatch = this.memory.nodes.get(edge.to);
                    }
                }
            }
        }
        return bestMatch;
    }
}

module.exports = { Scaffold, KnowledgeGraph, ReasoningEngine, ContextWindow };
