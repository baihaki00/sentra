/**
 * PROJECT GENESIS: EXPECTATION MODULE v0.1
 * "Predictive Coding" - Brain-inspired prediction and verification.
 */

class ExpectationModule {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.history = []; // Track prediction vs reality for learning
    }

    /**
     * Predict expected response characteristics based on intent and context.
     * @param {string} intent - Detected intent (e.g., 'INTENT:GREETING')
     * @param {Array} entities - Detected entities
     * @param {Array} recentHistory - Recent conversation turns
     * @returns {Object} - { responseType, expectedEntities, confidence }
     */
    predict(intent, entities = [], recentHistory = []) {
        let responseType = 'UNKNOWN';
        let expectedEntities = [];
        let confidence = 0.5;

        // BAYESIAN INFERENCE: Use past patterns to predict response type
        switch (intent) {
            case 'INTENT:GREETING':
                responseType = 'GREETING';
                expectedEntities = [];
                confidence = 0.95;
                break;

            case 'INTENT:SELF_QUERY':
                responseType = 'IDENTITY_STATEMENT';
                expectedEntities = ['IDENTITY:SENTRA'];
                confidence = 0.9;
                break;

            case 'INTENT:USER_QUERY':
                responseType = 'IDENTITY_STATEMENT';
                expectedEntities = ['IDENTITY:USER'];
                confidence = 0.9;
                break;

            case 'INTENT:FACT_QUERY':
                responseType = 'FACTUAL';
                // Expect subject entity to be mentioned in response
                const subject = entities.find(e => e.type === 'KNOWN' || e.type === 'POTENTIAL');
                if (subject) {
                    expectedEntities = [subject.id];
                    confidence = 0.8;
                } else {
                    confidence = 0.4; // Low confidence if no subject
                }
                break;

            case 'INTENT:TEACHING':
                responseType = 'ACKNOWLEDGMENT';
                expectedEntities = [];
                confidence = 0.85;
                break;

            case 'INTENT:UNKNOWN':
                responseType = 'CLARIFICATION';
                expectedEntities = [];
                confidence = 0.3;
                break;

            default:
                responseType = 'UNKNOWN';
                confidence = 0.2;
        }

        // CONTEXTUAL ADJUSTMENT: Modify confidence based on history
        if (recentHistory.length > 0) {
            const lastTurn = recentHistory[recentHistory.length - 1];
            if (lastTurn.intent === intent) {
                // Repeated intent → slightly lower confidence (might be confused)
                confidence *= 0.9;
            }
        }

        return {
            responseType,
            expectedEntities,
            confidence,
            timestamp: Date.now()
        };
    }

    /**
     * Compare predicted vs actual response to compute adequacy.
     * @param {Object} prediction - Output from predict()
     * @param {string} actualResponse - Generated response text
     * @param {Array} responseEntities - Entities mentioned in response
     * @returns {Object} - { adequacy, mismatchReason }
     */
    checkAdequacy(prediction, actualResponse, responseEntities = []) {
        let adequacy = 1.0;
        let mismatchReason = null;

        // 1. RESPONSE TYPE MATCH
        const responseTypeLower = actualResponse.toLowerCase();

        if (prediction.responseType === 'GREETING') {
            if (!responseTypeLower.includes('hello') && !responseTypeLower.includes('hi')) {
                adequacy *= 0.5;
                mismatchReason = 'Expected greeting phrase not found';
            }
        } else if (prediction.responseType === 'IDENTITY_STATEMENT') {
            if (!responseTypeLower.includes('i am') && !responseTypeLower.includes('you are')) {
                adequacy *= 0.6;
                mismatchReason = 'Expected identity statement not found';
            }
        } else if (prediction.responseType === 'FACTUAL') {
            // Check if response is informative (length check as heuristic)
            if (actualResponse.length < 10) {
                adequacy *= 0.7;
                mismatchReason = 'Response too short for factual query';
            }
        } else if (prediction.responseType === 'ACKNOWLEDGMENT') {
            if (!responseTypeLower.includes('understood') && !responseTypeLower.includes('learned') && !responseTypeLower.includes('ok')) {
                adequacy *= 0.6;
                mismatchReason = 'Expected acknowledgment not found';
            }
        } else if (prediction.responseType === 'CLARIFICATION') {
            if (!responseTypeLower.includes('?') && !responseTypeLower.includes('mean')) {
                adequacy *= 0.5;
                mismatchReason = 'Expected clarification question not found';
            }
        }

        // 2. ENTITY PRESENCE CHECK
        if (prediction.expectedEntities.length > 0) {
            const mentionedEntities = responseEntities.map(e => e.id);
            const expectedMentioned = prediction.expectedEntities.filter(e =>
                mentionedEntities.includes(e) || actualResponse.includes(e)
            );

            const entityCoverage = expectedMentioned.length / prediction.expectedEntities.length;
            adequacy *= (0.5 + (0.5 * entityCoverage)); // Min 0.5, max 1.0

            if (entityCoverage < 0.5) {
                mismatchReason = `Expected entities missing: ${prediction.expectedEntities.join(', ')}`;
            }
        }

        // 3. CONFIDENCE-WEIGHTED ADEQUACY
        // Low-confidence predictions are less strict
        const adjustedAdequacy = adequacy * (0.7 + (0.3 * prediction.confidence));

        // Log for learning
        this.history.push({
            prediction,
            actualResponse,
            adequacy: adjustedAdequacy,
            mismatchReason,
            timestamp: Date.now()
        });

        return {
            adequacy: adjustedAdequacy,
            mismatchReason
        };
    }

    /**
     * Learn from past predictions to improve future ones.
     * (Placeholder for Bayesian updating - Phase 4.2)
     */
    learn() {
        if (this.history.length < 10) return; // Need data

        // Count successes vs failures per intent
        const intentStats = {};
        for (const record of this.history) {
            const intent = record.prediction.responseType;
            if (!intentStats[intent]) {
                intentStats[intent] = { successes: 0, failures: 0 };
            }

            if (record.adequacy > 0.7) {
                intentStats[intent].successes++;
            } else {
                intentStats[intent].failures++;
            }
        }

        // Log insights (for now, just awareness)
        console.log('[Expectation] Learning from history:', intentStats);
    }
}

module.exports = ExpectationModule;
