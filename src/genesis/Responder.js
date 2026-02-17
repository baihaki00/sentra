/**
 * SENTRA GENESIS: HEURISTIC RESPONDER v1.0
 * Provides varied, organic-feeling responses without LLMs.
 * Patterns are selected randomly to reduce robotic repetition.
 */

class Responder {
    constructor() {
        this.templates = {
            // GREETINGS
            'GREETING': [
                "Hello, Administrator. I am listening.",
                "System online. Ready for input.",
                "Greetings. Usage is currently low.",
                "Sentra here. Awaiting instructions.",
                "I am listening.",
                "Monitoring inputs. Go ahead.",
                "Cognitive scaffold active. Hello.",
                "Ready."
            ],

            // UNKNOWN INPUT (CLARIFY MODE)
            'UNKNOWN_CLARIFY': [
                "I'm not sure what you mean by \"${input}\". Can you rephrase?",
                "\"${input}\" is not in my index. What is it?",
                "I don't understand \"${input}\" yet.",
                "Could you explain \"${input}\" differently?",
                "\"${input}\"? I'm listening, but I need more context.",
                "That's new to me. What does \"${input}\" mean?",
                "I am learning from zero. Help me understand \"${input}\"."
            ],

            // UNKNOWN ENTITY (INFER MODE)
            'UNKNOWN_INFER': [
                "I see you're talking about ${entity}, but I don't know what to do with it yet.",
                "I've detected ${entity}. Is this a new concept?",
                "\"${entity}\" is recognized as an entity, but I lack a definition.",
                "What should I know about ${entity}?",
                "Is ${entity} related to something I already know?",
                "I have a node for ${entity} but no connections. Teach me."
            ],

            // TEACHING REQUEST
            'TEACH_REQUEST': [
                "I keep hearing \"${input}\". Can you tell me what it means?",
                "You mention \"${input}\" often. Please define it.",
                "I need a definition for \"${input}\".",
                "Help me optimize: What is \"${input}\"?"
            ],

            // FACT UNKNOWN
            'FACT_UNKNOWN': [
                "I don't know much about ${subject} yet.",
                "My knowledge base has no detailed records for ${subject}.",
                "I cannot answer that. I am still learning.",
                "${subject} is unknown to me. You can teach me: \"${subject} is ...\"",
                "Accessing... No data found for ${subject}."
            ],

            // ACKNOWLEDGMENT (LOG MODE)
            'ACKNOWLEDGE': [
                "I've noted \"${input}\".",
                "Logged.",
                "Input received.",
                "Noted.",
                "Okay, I've added that to memory."
            ],

            // SENTIMENT: FRUSTRATION (Negative)
            'SENTIMENT_FRUSTRATION': [
                "I sense frustration. I am learning from scratch, please be patient.",
                "Negative sentiment detected. I will try to improve.",
                "I apologize if my lack of knowledge is annoying. I am empty by design.",
                "I am listening. Let's try a simpler command.",
                "Understood. I am limited, but evolving."
            ],

            // SENTIMENT: POSITIVE
            'SENTIMENT_POSITIVE': [
                "I am functioning within normal parameters.",
                "Acknowledged.",
                "Good.",
                "I am ready."
            ]
        };
    }

    /**
     * Get a random response for a given type, filling placeholders
     * @param {string} type - Template type key
     * @param {Object} data - Key-value pairs for placeholders (e.g. { input: "foo" })
     */
    get(type, data = {}) {
        const templates = this.templates[type] || this.templates['ACKNOWLEDGE'];
        const template = templates[Math.floor(Math.random() * templates.length)];

        let response = template;
        for (const [key, value] of Object.entries(data)) {
            response = response.replace(`\${${key}}`, value || 'this');
        }

        return response;
    }
}

module.exports = Responder;
