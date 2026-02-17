/**
 * TEST: Semantic Intent Classification (Standalone)
 */

const Vectorizer = require('./genesis/Vectorizer');

// Import SemanticIntentClassifier from Intent.js
// We'll test it standalone
class SemanticIntentClassifier {
    constructor() {
        this.vectorizer = new Vectorizer();
        this.intentCorpus = new Map();
        this.allExamples = [];
        this.exampleToIntent = [];
        this.trained = false;
    }

    train(intentExamples) {
        this.intentCorpus = new Map(Object.entries(intentExamples));
        this.allExamples = [];
        this.exampleToIntent = [];

        for (const [intent, examples] of this.intentCorpus.entries()) {
            for (const example of examples) {
                this.allExamples.push(example);
                this.exampleToIntent.push(intent);
            }
        }

        this.vectorizer.fit(this.allExamples);
        this.trained = true;
    }

    classify(text, threshold = 0.5) {
        if (!this.trained) {
            return { intent: null, confidence: 0, matches: [] };
        }

        const result = this.vectorizer.findMostSimilar(text);
        const intent = this.exampleToIntent[result.index];

        const matches = [];
        for (let i = 0; i < this.allExamples.length; i++) {
            const exampleVec = this.vectorizer.transform(this.allExamples[i]);
            const queryVec = this.vectorizer.transform(text);
            const similarity = this.vectorizer.cosineSimilarity(queryVec, exampleVec);

            if (similarity >= threshold) {
                matches.push({
                    intent: this.exampleToIntent[i],
                    example: this.allExamples[i],
                    similarity
                });
            }
        }

        matches.sort((a, b) => b.similarity - a.similarity);

        return {
            intent: result.similarity >= threshold ? intent : null,
            confidence: result.similarity,
            matches: matches.slice(0, 3)
        };
    }
}

console.log('🧪 Testing Semantic Intent Classification (Standalone)\n');

// Initialize classifier
const classifier = new SemanticIntentClassifier();

const trainingData = {
    'INTENT:GREETING': [
        'hello', 'hi', 'hey', 'good morning', 'how are you', 'how are you doing',
        'hiya', 'yo', 'sup'
    ],
    'INTENT:SELF_QUERY': [
        'who are you', 'what are you', 'tell me about yourself',
        'what are you capable of', 'who r u'
    ],
    'INTENT:USER_QUERY': [
        'who am i', 'what is my name', 'tell me about me',
        'do you know me', 'whats my name'
    ]
};

classifier.train(trainingData);

console.log('Test 1: Exact Matches');
const exactTests = ['hello', 'who are you', 'who am i'];
for (const test of exactTests) {
    const result = classifier.classify(test);
    console.log(`  "${test}" → ${result.intent} (confidence: ${result.confidence.toFixed(3)})`);
}

console.log('\nTest 2: Paraphrased Inputs (KEY TEST!)');
const paraphraseTests = [
    'how are you doing?',
    'im asking how well are you doing??',
    'what are you capable of',
    'who r u',
    'whats my name'
];

for (const test of paraphraseTests) {
    const result = classifier.classify(test);
    const status = result.confidence >= 0.7 ? '✅' : '⚠️';
    console.log(`  ${status} "${test}" → ${result.intent || 'null'} (confidence: ${result.confidence.toFixed(3)})`);
    if (result.matches.length > 0) {
        console.log(`      Best match: "${result.matches[0].example}"`);
    }
}
