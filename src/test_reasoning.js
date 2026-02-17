const { Scaffold } = require('./genesis/Scaffold');

/**
 * ARE v0.3 BENCHMARK (Backward Chaining)
 * Goal: Prove multi-step planning.
 */

console.log('🌌 INIT ARE BENCHMARK...');
const scaffold = new Scaffold();

// 1. TEACHING (Dependency Graph)
console.log('1. Teaching Dependencies...');

// Actions
scaffold.memory.addNode('FIND_FILE', 'ACTION');
scaffold.memory.addNode('READ_FILE', 'ACTION');

// Concepts
scaffold.memory.addNode('FILE_PATH', 'CONCEPT');

// Relationships (Logic)
// FIND_FILE --(PRODUCES)--> FILE_PATH
scaffold.associate('FIND_FILE', 'FILE_PATH', 'PRODUCES');

// FILE_PATH --(REQUIRED_BY)--> READ_FILE
// Or in our graph: READ_FILE --(REQUIRES)--> FILE_PATH
// Let's stick to consistent direction:
// Action -> Concept (Produces)
// Action -> Concept (Requires) ?? No, usually Action -> Requires -> Concept
// Let's use:
// READ_FILE --(REQUIRES)--> FILE_PATH
scaffold.associate('READ_FILE', 'FILE_PATH', 'REQUIRES');


// 2. REASONING
console.log('2. Reasoning (Goal: READ_FILE)...');
const plan = scaffold.reasoner.findPlan('READ_FILE');

if (plan && plan.length === 2 && plan[0] === 'FIND_FILE' && plan[1] === 'READ_FILE') {
    console.log('✅ PLAN DISCOVERED:', plan.join(' -> '));
} else {
    console.error('❌ PLANNING FAILED:', plan);
    process.exit(1);
}

console.log('🌌 ARE v0.3 VERIFIED.');
