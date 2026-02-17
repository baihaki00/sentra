/**
 * TEST: Enhanced Entity Extraction (V4)
 */

const { Scaffold } = require('./genesis/Scaffold');
const EntityResolver = require('./genesis/Entity');

async function runTests() {
    console.log('🧪 Testing Enhanced Entity Extraction (V4)\n');

    // Initialize
    const scaffold = new Scaffold();
    await scaffold.init('./data/memory.json');
    const resolver = new EntityResolver(scaffold);

    // Add some test entities to the graph
    scaffold.memory.addNode('python', 'CONCEPT', {}, 'SEMANTIC');
    scaffold.memory.addNode('javascript', 'CONCEPT', {}, 'SEMANTIC');
    scaffold.memory.addNode('programming', 'CONCEPT', {}, 'SEMANTIC');
    scaffold.memory.addNode('machine learning', 'CONCEPT', {}, 'SEMANTIC');

    // Create semantic links
    scaffold.memory.addEdge('python', 'programming', 'RELATES_TO', 0.8);
    scaffold.memory.addEdge('javascript', 'programming', 'RELATES_TO', 0.8);
    scaffold.memory.addEdge('machine learning', 'python', 'RELATES_TO', 0.6);

    console.log('Test 1: Noun Phrase Extraction');
    const phrases1 = resolver.extractNounPhrases('what is machine learning');
    console.log(`  Input: "what is machine learning"`);
    console.log(`  Phrases: ${JSON.stringify(phrases1)}`);

    const phrases2 = resolver.extractNounPhrases('tell me about Python programming and machine learning');
    console.log(`  Input: "tell me about Python programming and machine learning"`);
    console.log(`  Phrases: ${JSON.stringify(phrases2)}`);

    console.log('\nTest 2: Entity Type Inference');
    const tests = [
        ['John', 'who is John'],
        ['Python', 'what is Python'],
        ['machine learning', 'explain machine learning'],
        ['New York', 'where is New York']
    ];

    for (const [entity, context] of tests) {
        const type = resolver.inferEntityType(entity, context);
        console.log(`  "${entity}" in "${context}" → ${type}`);
    }

    console.log('\nTest 3: Enhanced Entity Resolution');
    const inputs = [
        'tell me about Python programming',
        'what is machine learning',
        'explain JavaScript and Python',
        'who is John Smith'
    ];

    for (const input of inputs) {
        const entities = resolver.resolve(input);
        console.log(`  Input: "${input}"`);
        for (const entity of entities) {
            console.log(`    → ${entity.id} (${entity.type}, ${entity.entityType || 'N/A'}, conf: ${entity.confidence?.toFixed(2) || 'N/A'})`);
        }
    }

    console.log('\nTest 4: Semantic Neighbor Activation');
    console.log('  Before activation:');
    console.log(`    python.activation: ${scaffold.memory.nodes.get('python').activation.toFixed(3)}`);
    console.log(`    programming.activation: ${scaffold.memory.nodes.get('programming').activation.toFixed(3)}`);

    resolver.activateSemanticNeighbors('python', 2);

    console.log('  After activating neighbors of "python":');
    console.log(`    python.activation: ${scaffold.memory.nodes.get('python').activation.toFixed(3)}`);
    console.log(`    programming.activation: ${scaffold.memory.nodes.get('programming').activation.toFixed(3)}`);

    console.log('\nTest 5: Auto-Registration with Concept Association');
    resolver.register('deep learning', 'CONCEPT', 'CONCEPT');
    const deepLearning = scaffold.memory.nodes.get('deep learning');
    console.log(`  Registered: ${deepLearning.id} (${deepLearning.data.entityType})`);

    const edges = scaffold.memory.getNeighbors('deep learning');
    console.log(`  Auto-created associations: ${edges.length}`);
    for (const edge of edges) {
        console.log(`    → ${edge.to} (${edge.type})`);
    }

    console.log('\n✅ Entity extraction tests complete!');
}

runTests().catch(console.error);
