/**
 * PROJECT GENESIS: INTENT ENGINE v0.1/**
 * INTENT: Fuzzy Pattern Matching + Hebbian Learning + Semantic Classification
 * Detects user intent from input using multiple strategies:
 * - V4: Semantic similarity (TF-IDF vectorization)
 * - V3: Graph activation-based classification
 * - V2: Pattern matching with fuzzy scoring
 */

const Vectorizer = require('./Vectorizer');

/**
 * SEMANTIC INTENT CLASSIFIER (V4)
 * Uses TF-IDF vectorization to match paraphrased inputs
 */
class SemanticIntentClassifier {
    constructor() {
        this.vectorizer = new Vectorizer();
        this.intentCorpus = new Map();
        this.allExamples = [];
        this.exampleToIntent = [];
        this.trained = false;
    }

    /**
     * Initialize with training data for each intent
     */
    train(intentExamples) {
        this.intentCorpus = new Map(Object.entries(intentExamples));

        // Flatten all examples
        this.allExamples = [];
        this.exampleToIntent = [];

        for (const [intent, examples] of this.intentCorpus.entries()) {
            for (const example of examples) {
                this.allExamples.push(example);
                this.exampleToIntent.push(intent);
            }
        }

        // Train vectorizer
        this.vectorizer.fit(this.allExamples);
        this.trained = true;

        console.log(`[SemanticIntent] Trained on ${this.intentCorpus.size} intents, ${this.allExamples.length} examples`);
    }

    /**
     * Classify input text using semantic similarity
     * Returns: { intent, confidence, matches: [...] }
     */
    classify(text, threshold = 0.5) {
        if (!this.trained) {
            return { intent: null, confidence: 0, matches: [] };
        }

        const result = this.vectorizer.findMostSimilar(text);
        const intent = this.exampleToIntent[result.index];

        // Find all similar examples above threshold
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

        // Sort by similarity
        matches.sort((a, b) => b.similarity - a.similarity);

        return {
            intent: result.similarity >= threshold ? intent : null,
            confidence: result.similarity,
            matches: matches.slice(0, 3)  // Top 3 matches
        };
    }

    /**
     * Detect multiple intents in a single input
     */
    detectMultiple(text, threshold = 0.6) {
        if (!this.trained) {
            return [];
        }

        const result = this.classify(text, threshold);
        const intents = new Map();

        // Group matches by intent
        for (const match of result.matches) {
            if (!intents.has(match.intent)) {
                intents.set(match.intent, {
                    intent: match.intent,
                    confidence: match.similarity,
                    count: 1
                });
            } else {
                const existing = intents.get(match.intent);
                existing.confidence = Math.max(existing.confidence, match.similarity);
                existing.count++;
            }
        }

        // Convert to array and sort by confidence
        return Array.from(intents.values())
            .sort((a, b) => b.confidence - a.confidence);
    }
}

/**
 * INTENT MANAGER (V2/V3/V4 Combined)
 */
class IntentEngine {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.threshold = 0.5; // Similiarity threshold (0.0 - 1.0)
        this.activationHistory = [];  // Track which concepts fire for which inputs

        // V4: Semantic Intent Classifier
        this.semanticClassifier = new SemanticIntentClassifier();
        this.initializeSemanticClassifier();
    }

    /**
     * Initialize semantic classifier with training data (V4)
     */
    initializeSemanticClassifier() {
        const trainingData = {
            'INTENT:GREETING': [
                'hello',
                'hi',
                'hey',
                'good morning',
                'good evening',
                'greetings',
                'howdy',
                'how are you',
                'how are you doing',
                'how do you do',
                'what is up',
                'hiya',
                'yo',
                'sup'
            ],
            'INTENT:SELF_QUERY': [
                'who are you',
                'what are you',
                'tell me about yourself',
                'introduce yourself',
                'what is your name',
                'what do you do',
                'what are you capable of',
                'describe yourself',
                'who r u',
                'what r u'
            ],
            'INTENT:USER_QUERY': [
                'who am i',
                'what is my name',
                'tell me about me',
                'do you know me',
                'do you know who i am',
                'what do you know about me',
                'who am I',
                'what\'s my name'
            ],
            'INTENT:FACT_QUERY': [
                'what is',
                'tell me about',
                'explain',
                'define',
                'what do you know about',
                'describe'
            ],
            'INTENT:TEACHING': [
                'means',
                'is defined as',
                'is called',
                'refers to'
            ],
            'INTENT:STATEMENT': [
                'i am',
                'i like',
                'i want',
                'i feel',
                'it is',
                'there are',
                'this is',
                'that is',
                'the sky is blue',
                'python is a language',
                'paris is a city'
            ],
            'INTENT:UNKNOWN': [
                'hm',
                'hmm',
                'umm',
                'uh',
                'huh',
                'what',
                'wow',
                'damn',
                'dang',
                'ok',
                'okay',
                'cool',
                'interesting',
                'blah',
                'stuff',
                'random'
            ]
        };

        this.semanticClassifier.train(trainingData);
    }

    /**
     * Classify input using semantic similarity (V4)
     */
    classifyBySemantic(text) {
        const result = this.semanticClassifier.classify(text, 0.5);
        return {
            intent: result.intent,
            score: result.confidence,
            method: 'SEMANTIC',
            matches: result.matches
        };
    }

    /**
     * Detect multiple intents in input (V4)
     */
    detectMultipleIntents(text) {
        return this.semanticClassifier.detectMultiple(text, 0.6);
    }

    /**
     * Levenshtein Distance Calculation
     */
    match(inputText) {
        let bestMatch = null;
        let highestScore = 0;
        const normalizedInput = inputText.toLowerCase().trim();

        // 1. EXACT MATCH (Fast Path)
        if (this.scaffold.memory.nodes.has(inputText)) {
            // Check if it's an ALIAS or TRIGGERS something
            const node = this.scaffold.memory.nodes.get(inputText);
            if (node.type === 'ACTION') return { nodeId: inputText, trigger: inputText, score: 1.0, method: 'EXACT' };

            const outgoing = this.scaffold.memory.getNeighbors(inputText);
            for (const edge of outgoing) {
                if (edge.type === 'TRIGGERS' || edge.type === 'ALIAS') {
                    return this.resolveAliasChain({ nodeId: edge.to, trigger: inputText, score: 1.0, method: 'EXACT_ALIAS' });
                }
            }
            return { nodeId: inputText, trigger: inputText, score: 1.0, method: 'EXACT_CONCEPT' };
        }

        // 2. DISCOVER CANDIDATES via Edge Traversal
        for (const edge of this.scaffold.memory.edges.values()) {
            if (edge.type !== 'TRIGGERS' && edge.type !== 'ALIAS') continue;

            const triggerPhrase = edge.from.toLowerCase();
            let score = 0;
            let method = null;

            // A. CONTAINS
            if (normalizedInput.includes(triggerPhrase)) {
                score = (triggerPhrase.length / normalizedInput.length) * 0.9;
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = { nodeId: edge.to, trigger: edge.from, score, method: 'CONTAINS' };
                }
            }

            // B. FUZZY
            else if (Math.abs(normalizedInput.length - triggerPhrase.length) < 3) {
                const dist = this.levenshtein(normalizedInput, triggerPhrase); // Ensure this.levenshtein calls the helper
                const s = 1 - (dist / Math.max(normalizedInput.length, triggerPhrase.length));

                if (s > this.threshold && s > highestScore) {
                    highestScore = s;
                    bestMatch = { nodeId: edge.to, trigger: edge.from, score: s, method: 'FUZZY' };
                }
            }
        }

        // 3. RECURSIVE RESOLUTION
        if (bestMatch) {
            return this.resolveAliasChain(bestMatch);
        }

        return null;
    }

    resolveAliasChain(match) {
        let currentId = match.nodeId;
        let hops = 0;

        while (hops < 5) {
            const node = this.scaffold.memory.nodes.get(currentId);
            if (!node) break;

            if (node.type === 'ACTION') {
                match.nodeId = currentId;
                return match;
            }

            const neighbors = this.scaffold.memory.getNeighbors(currentId);
            const forward = neighbors.find(e => e.type === 'TRIGGERS' || e.type === 'ALIAS');

            if (forward) {
                currentId = forward.to;
                hops++;
            } else {
                break;
            }
        }
        return match;
    }

    /**
     * Levenshtein Helper (Internal)
     */
    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    /**
     * Detect "natural teaching" phrases.
     * e.g. "when i say X it means Y"
     */
    detectTeaching(inputText) {
        const normalized = inputText.toLowerCase().trim();

        // Pattern 1: "when i say X it means Y"
        const p1 = normalized.match(/when i say (.+) it means (.+)/);
        if (p1) return { trigger: p1[1].trim(), target: p1[2].trim() };

        // Pattern 2: "X means Y" (but careful not to match too aggressively)
        // e.g. "ls means list files"
        const p2 = normalized.match(/^(.+) means (.+)$/);
        if (p2) return { trigger: p2[1].trim(), target: p2[2].trim() };

        return null;
    }

    /**
     * Detect SVO statements: "Subject is Object"
     */
    detectStatement(inputText) {
        const normalized = inputText.toLowerCase().trim();
        // Avoid questions
        if (normalized.startsWith('what') || normalized.startsWith('who') || normalized.includes('?')) return null;

        // "X is a Y", "X is Y", "X has Y", "X can Y"
        // Improved Regex: Capture full subject (non-greedy) and object
        const match = normalized.match(/^(.+?)\s+(is an|is a|is|are|has|can)\s+(.+)$/);
        if (match) {
            return {
                subject: match[1].trim(),
                predicate: match[2].trim(),
                object: match[3].trim()
            };
        }
        return null;
    }

    /**
     * Detect affirmative/negative confirmation
     */
    detectConfirmation(inputText) {
        const normalized = inputText.toLowerCase().trim().replace(/[^\w\s]/g, '');
        if (['yes', 'yeah', 'yep', 'correct', 'sure', 'true', 'right'].includes(normalized)) return 'YES';
        if (['no', 'nope', 'nah', 'wrong', 'false', 'incorrect'].includes(normalized)) return 'NO';
        return null;
    }

    /**
     * Reinforce a connection (Hebbian Learning)
     * If user confirms "Yes, I meant X", we strengthen the link.
     */
    reinforce(input, actualTrigger) {
        // If input != trigger, maybe we should add a new alias?
        // E.g. "lst" -> "ls"
        // For now, we just increase weights of existing edges if found.
        this.scaffold.associate(input, actualTrigger, 'ALIAS');
        console.log(`[Intent] Learned Alias: "${input}" -> "${actualTrigger}"`);
    }


    /**
     * Classify Intent based on Graph Activation.
     * @returns {string} The ID of the highest activated INTENT node.
     */
    classifyByActivation() {
        let bestIntent = 'INTENT:UNKNOWN';
        let maxActivation = 0;

        for (const [id, node] of this.scaffold.memory.nodes) {
            if (node.type === 'INTENT') {
                if (node.activation > maxActivation) {
                    maxActivation = node.activation;
                    bestIntent = id;
                }
            }
        }

        // AGGRESSIVE RESET: Clear ALL activations after classification
        // This prevents intent "ringing" across turns
        // Context/semantic activation is preserved via edges, not raw activation values
        if (maxActivation > 0) {
            for (const [id, node] of this.scaffold.memory.nodes) {
                node.activation *= 0.1; // Reset to 10% (near-zero)
            }
        }

        return { intent: bestIntent, score: maxActivation };
    }
}

module.exports = IntentEngine;
