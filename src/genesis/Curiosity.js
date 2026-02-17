/**
 * PROJECT GENESIS: CURIOSITY ENGINE v4.0
 * Intelligent Unknown Handling & Active Learning
 * Modes: CLARIFY, INFER, LOG, TEACH
 */

const Responder = require('./Responder');

class CuriosityModule {
    constructor(scaffold) {
        this.scaffold = scaffold;
        this.responder = new Responder();
        this.unknownLog = new Map(); // Track frequency of unknown inputs
    }

    /**
     * Handle unknown input when no intent is matched
     * @param {string} input - The raw user input
     * @param {Array} entities - Extracted entities
     * @param {Array} context - Recent context
     * @returns {Object} { response, entities }
     */
    handleUnknown(input, entities, context) {
        // 1. Log occurrence
        const freq = (this.unknownLog.get(input) || 0) + 1;
        this.unknownLog.set(input, freq);

        // 2. Select Component (Mode)
        const mode = this.selectMode(input, entities, freq);

        console.log(`[Curiosity] Mode: ${mode} (Freq: ${freq})`);

        switch (mode) {
            case 'SENTIMENT':
                return { ...this.modeSentiment(input, entities), mode: 'SENTIMENT' };
            case 'CLARIFY':
                return { ...this.modeClarify(input), mode: 'CLARIFY' };
            case 'INFER':
                return { ...this.modeInfer(input, entities), mode: 'INFER' };
            case 'TEACH':
                return { ...this.modeTeach(input), mode: 'TEACH' };
            case 'LOG':
            default:
                return { ...this.modeLog(input), mode: 'LOG' };
        }
    }

    /**
     * Select the best curiosity mode based on heuristics
     */
    selectMode(input, entities, frequency) {
        // 1. If we detected SENTIMENT (frustration, anger, joy) → SENTIMENT mode
        const sentiment = entities.find(e => e.entityType === 'SENTIMENT');
        if (sentiment) {
            return 'SENTIMENT';
        }

        // 2. If input is very short or looks like a question → CLARIFY
        if (input.split(' ').length <= 2 || input.endsWith('?')) {
            return 'CLARIFY';
        }

        // If we detected OTHER entities but don't know the intent → INFER
        if (entities.length > 0) {
            return 'INFER';
        }

        // If we've seen this 3+ times → TEACH (ask for help)
        if (frequency >= 3) {
            return 'TEACH';
        }

        // Default → LOG (just acknowledge and move on)
        return 'LOG';
    }

    // --- MODES ---

    modeSentiment(input, entities) {
        const sentiment = entities.find(e => e.entityType === 'SENTIMENT');
        // Simple distinct: if subType contains 'negative' or words like 'bad', 'damn'
        // For now, let's assume unknown sentiment is usually frustration in this context
        return {
            response: this.responder.get('SENTIMENT_FRUSTRATION'),
            entities: []
        };
    }

    modeClarify(input) {
        return {
            response: this.responder.get('UNKNOWN_CLARIFY', { input }),
            entities: []
        };
    }

    modeInfer(input, entities) {
        // Construct a response based on the entities found
        const entityNames = entities.map(e => e.id).join(' or ');
        return {
            response: this.responder.get('UNKNOWN_INFER', { entity: entityNames }),
            entities: entities
        };
    }

    modeTeach(input) {
        return {
            response: this.responder.get('TEACH_REQUEST', { input }),
            entities: []
        };
    }

    modeLog(input) {
        return {
            response: this.responder.get('ACKNOWLEDGE', { input }),
            entities: []
        };
    }
}

module.exports = CuriosityModule;
