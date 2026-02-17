const { Scaffold } = require('./genesis/Scaffold');

/**
 * GENESIS MEMORY LAYERS BENCHMARK (v0.4)
 * Validates Identity, Semantic, and Episodic layers.
 */

console.log('🌌 INIT MEMORY BENCHMARK...');
const scaffold = new Scaffold();
scaffold.initIdentity();

// 1. IDENTITY CHECK
console.log('1. Checking Identity...');
if (scaffold.memory.nodes.has('IDENTITY:SENTRA') && scaffold.memory.nodes.has('IDENTITY:USER')) {
    console.log('✅ Identity Nodes Verified.');
} else {
    console.error('❌ Identity Missing.');
    process.exit(1);
}

// 2. SEMANTIC MEMORY (Facts)
console.log('2. Testing Semantic Memory...');
scaffold.logSemantic('FACT:SKY_IS_BLUE', { value: true });

// Check Edge: SENTRA --KNOWS--> FACT
const semanticEdges = scaffold.memory.getNeighbors('IDENTITY:SENTRA')
    .filter(e => e.to === 'FACT:SKY_IS_BLUE' && e.type === 'KNOWS');

if (semanticEdges.length > 0 && scaffold.memory.nodes.get('FACT:SKY_IS_BLUE').layer === 'SEMANTIC') {
    console.log('✅ Semantic Fact Linked to Self.');
} else {
    console.error('❌ Semantic Linking Failed.');
    process.exit(1);
}

// 3. EPISODIC MEMORY (Events)
console.log('3. Testing Episodic Memory...');
scaffold.memory.addNode('ACTION:TEST', 'ACTION');
const eventId = scaffold.logEpisodic('ACTION:TEST', 'Success');

// Check Edge: SENTRA --DID--> EVENT
const episodicEdges = scaffold.memory.getNeighbors('IDENTITY:SENTRA')
    .filter(e => e.to === eventId && e.type === 'DID');

if (episodicEdges.length > 0 && scaffold.memory.nodes.get(eventId).layer === 'EPISODIC') {
    console.log('✅ Episodic Event Logged correctly.');
} else {
    console.error('❌ Episodic Logging Failed.');
    process.exit(1);
}

console.log('🌌 MEMORY LAYERS VERIFIED.');
