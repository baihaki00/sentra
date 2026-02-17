/**
 * TEST: Vectorizer TF-IDF Semantic Similarity
 */

const Vectorizer = require('./genesis/Vectorizer');

console.log('🧪 Testing TF-IDF Vectorizer\n');

// Test 1: Basic TF-IDF Calculation
console.log('Test 1: Basic Tokenization & TF-IDF');
const vectorizer = new Vectorizer();
const trainingDocs = [
    'hello world',
    'hello there',
    'how are you',
    'how are you doing',
    'what is your name'
];

vectorizer.fit(trainingDocs);

const vec1 = vectorizer.transform('hello');
const vec2 = vectorizer.transform('world');
console.log(`  "hello" vector (first 5): [${vec1.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
console.log(`  "world" vector (first 5): [${vec2.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);

// Test 2: Cosine Similarity
console.log('\nTest 2: Cosine Similarity');
const testPairs = [
    ['hello', 'hello'],
    ['hello', 'hi'],
    ['hello', 'world'],
    ['how are you', 'how are you doing'],
    ['what is your name', 'hello']
];

for (const [text1, text2] of testPairs) {
    const v1 = vectorizer.transform(text1);
    const v2 = vectorizer.transform(text2);
    const similarity = vectorizer.cosineSimilarity(v1, v2);
    console.log(`  "${text1}" vs "${text2}": ${similarity.toFixed(3)}`);
}

// Test 3: Paraphrase Matching
console.log('\nTest 3: Paraphrase Detection');
const greetingVectorizer = new Vectorizer();
greetingVectorizer.fit([
    'hello',
    'hi',
    'hey',
    'good morning',
    'how are you',
    'how are you doing',
    'what is your name',
    'who are you',
    'tell me about yourself'
]);

const paraphrases = [
    'hello',
    'how are you doing?',
    'im asking how well are you doing??',
    'hiya',
    'whats up',
    'who r u'
];

for (const phrase of paraphrases) {
    const result = greetingVectorizer.findMostSimilar(phrase);
    console.log(`  "${phrase}" → "${result.document}" (similarity: ${result.similarity.toFixed(3)})`);
}

// Test 4: Intent Classification Simulation
console.log('\nTest 4: Intent Classification');
const intentCorpus = new Map([
    ['GREETING', ['hello', 'hi', 'hey', 'how are you', 'how are you doing']],
    ['SELF_QUERY', ['who are you', 'what are you', 'tell me about yourself']],
    ['USER_QUERY', ['who am i', 'what is my name', 'tell me about me']],
    ['FACT_QUERY', ['what is X', 'tell me about X', 'explain X']]
]);

// Flatten all examples
const allExamples = [];
const exampleToIntent = [];
for (const [intent, examples] of intentCorpus.entries()) {
    for (const example of examples) {
        allExamples.push(example);
        exampleToIntent.push(intent);
    }
}

const intentVectorizer = new Vectorizer();
intentVectorizer.fit(allExamples);

const testInputs = [
    'hello',
    'how are you doing?',
    'im asking how well are you doing??',
    'who r u',
    'what are you capable of',
    'who am i?',
    'whats my name'
];

for (const input of testInputs) {
    const result = intentVectorizer.findMostSimilar(input);
    const predictedIntent = exampleToIntent[result.index];
    console.log(`  "${input}" → ${predictedIntent} (confidence: ${result.similarity.toFixed(3)})`);
}

console.log('\n✅ All vectorizer tests complete!');
