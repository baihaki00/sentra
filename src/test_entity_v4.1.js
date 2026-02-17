/**
 * Test V4.1 Entity Typing with Sub-types
 */

const EntityResolver = require('./genesis/Entity');
const { Scaffold } = require('./genesis/Scaffold');

const scaffold = new Scaffold();
const entity = new EntityResolver(scaffold);

console.log('=== V4.1 Entity Type Test (13 Core Types + Dynamic Sub-typing) ===\n');

const tests = [
    ['Python', 'tell me about Python'],
    ['50%', 'growth is 50%'],
    ['happy', 'I feel happy'],
    ['123', 'count is 123'],
    ['Paris', 'Paris is a city'],
    ['React', 'I love React'],
    ['frustrated', 'I am frustrated'],
    ['2024', 'in the year 2024'],
    ['Google Inc', 'Google Inc is a company']
];

for (const [ent, ctx] of tests) {
    const result = entity.inferEntityType(ent, ctx);
    if (typeof result === 'object') {
        console.log(`"${ent}" → ${result.baseType}${result.subType ? ` (${result.subType})` : ''}`);
    } else {
        console.log(`"${ent}" → ${result}`);
    }
}
