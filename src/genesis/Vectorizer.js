/**
 * VECTORIZER: TF-IDF Text Vectorization for Semantic Similarity
 * No external dependencies - pure JavaScript implementation
 */

class Vectorizer {
    constructor() {
        this.vocabulary = new Map();  // word -> index
        this.idf = new Map();         // word -> IDF score
        this.documents = [];          // Training corpus
    }

    /**
     * Tokenize and normalize text
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')  // Remove punctuation
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    /**
     * Calculate term frequency for a document
     */
    calculateTF(tokens) {
        const tf = new Map();
        const totalTokens = tokens.length;

        for (const token of tokens) {
            tf.set(token, (tf.get(token) || 0) + 1);
        }

        // Normalize by document length
        for (const [token, count] of tf.entries()) {
            tf.set(token, count / totalTokens);
        }

        return tf;
    }

    /**
     * Build vocabulary and calculate IDF from training documents
     */
    fit(documents) {
        this.documents = documents;
        const docFrequency = new Map();
        const numDocs = documents.length;

        // Count document frequency for each word
        for (const doc of documents) {
            const tokens = new Set(this.tokenize(doc));
            for (const token of tokens) {
                docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
            }
        }

        // Build vocabulary and calculate IDF
        let index = 0;
        for (const [token, df] of docFrequency.entries()) {
            this.vocabulary.set(token, index++);
            // IDF = log(N / df) where N = total docs, df = docs containing term
            this.idf.set(token, Math.log(numDocs / df));
        }

        console.log(`[Vectorizer] Vocabulary size: ${this.vocabulary.size}`);
    }

    /**
     * Transform text into TF-IDF vector
     */
    transform(text) {
        const tokens = this.tokenize(text);
        const tf = this.calculateTF(tokens);
        const vector = new Array(this.vocabulary.size).fill(0);

        for (const [token, tfScore] of tf.entries()) {
            if (this.vocabulary.has(token)) {
                const index = this.vocabulary.get(token);
                const idfScore = this.idf.get(token) || 0;
                vector[index] = tfScore * idfScore;
            }
        }

        return vector;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same length');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (norm1 * norm2);
    }

    /**
     * Find most similar document from training corpus
     */
    findMostSimilar(text) {
        const queryVector = this.transform(text);
        let maxSimilarity = 0;
        let bestMatch = null;
        let bestIndex = -1;

        for (let i = 0; i < this.documents.length; i++) {
            const docVector = this.transform(this.documents[i]);
            const similarity = this.cosineSimilarity(queryVector, docVector);

            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatch = this.documents[i];
                bestIndex = i;
            }
        }

        return {
            document: bestMatch,
            index: bestIndex,
            similarity: maxSimilarity
        };
    }
}

module.exports = Vectorizer;
