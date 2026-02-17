const { Scaffold } = require('./genesis/Scaffold');
const Memory = require('./genesis/Memory');

/**
 * GENESIS SCAFFOLD BENCHMARK
 * Validates Graph Construction and MCTS Reasoning.
 */

console.log('🌌 INIT GENESIS SCAFFOLD...');

const scaffold = new Scaffold();
const memory = new Memory();

// 1. TEACHING (Building the Graph manually for test)
console.log('1. Teaching Associations...');
scaffold.perceive('User');
scaffold.perceive('Computer');
scaffold.perceive('Files');

scaffold.associate('User', 'Computer', 'Uses');
scaffold.associate('Computer', 'Files', 'Contains');
scaffold.associate('Files', 'Data', 'Have');

// 2. REASONING (Pathfinding)
console.log('2. Reasoning (Finding path from User -> Data)...');
const startNode = 'User';
const goalPredicate = (nodeId) => nodeId === 'Data';

const path = scaffold.reasoner.plan(startNode, goalPredicate);

if (path) {
    console.log('✅ PATH FOUND:');
    let current = startNode;
    console.log(`[${current}]`);
    path.forEach(edge => {
        console.log(`  ⬇ (${edge.type})`);
        console.log(`[${edge.to}]`);
    });
} else {
    console.error('❌ NO PATH FOUND.');
    process.exit(1);
}

// 3. PERSISTENCE
console.log('3. Testing Persistence...');
memory.save(scaffold.memory);
const loadedGraph = memory.load();

if (loadedGraph && loadedGraph.nodes.has('User')) {
    console.log('✅ Memory Persisted Correctly.');
} else {
    console.error('❌ Memory Load Failed.');
    process.exit(1);
}

console.log('🌌 GENESIS KERNEL VERIFIED.');
