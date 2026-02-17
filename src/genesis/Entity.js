/**
 * PROJECT GENESIS: ENTITY RESOLVER v0.2 (V4 Enhanced)
 * "The Hippocampus" - Runtime Entity Extraction & Awareness
 * V4 Features: Noun phrase chunking, entity type inference, semantic neighbor activation
 */

class EntityResolver {
    constructor(scaffold) {
        this.scaffold = scaffold;

        // V4: Initialize enhanced features safely
        try {
            // Common words to ignore in noun phrase detection
            this.stopwords = new Set([
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                'should', 'could', 'might', 'may', 'can', 'this', 'that', 'these', 'those'
            ]);

            // V4.1: 13 CORE ENTITY TYPES (optimized for Sentra)
            this.typePatterns = {
                PERSON: ['who', 'name', 'person', 'user', 'administrator', 'someone', 'he', 'she', 'they'],
                LOCATION: ['where', 'place', 'city', 'country', 'location', 'town', 'region', 'area'],
                ORGANIZATION: ['company', 'organization', 'corporation', 'team', 'group', 'agency', 'institute'],
                TECHNOLOGY: ['software', 'framework', 'library', 'tool', 'language', 'system', 'platform', 'api'],
                EVENT: ['event', 'meeting', 'conference', 'happened', 'occurred', 'celebration'],
                TIME: ['when', 'time', 'date', 'day', 'year', 'month', 'hour', 'minute'],
                NUMERIC: ['number', 'amount', 'quantity', 'count', 'measurement', 'percent', 'how many', 'how much'],
                CONCEPT: ['what', 'explain', 'define', 'about', 'is', 'means', 'idea', 'theory', 'principle'],
                OBJECT: ['thing', 'item', 'object', 'tool', 'device', 'product'],
                ACTION: ['do', 'action', 'process', 'method', 'procedure', 'task'],
                ATTRIBUTE: ['how', 'quality', 'property', 'characteristic', 'feature'],
                RELATIONSHIP: ['related to', 'connected to', 'part of', 'owned by', 'works at', 'belongs to'],
                SENTIMENT: ['feel', 'emotion', 'mood', 'happy', 'sad', 'frustrated', 'excited', 'curious',
                    'damn', 'shit', 'fuck', 'bad', 'terrible', 'hate', 'stupid', 'idiot', 'useless', 'bug']
            };

            // Known technology/language entities for quick classification
            this.knownTechnologies = new Set([
                'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
                'react', 'vue', 'angular', 'node', 'nodejs', 'django', 'flask',
                'tensorflow', 'pytorch', 'pandas', 'numpy', 'docker', 'kubernetes'
            ]);

            // V4.1: Dynamic sub-type mappings (learned on-the-fly)
            this.subTypeMapping = {
                TECHNOLOGY: {
                    'PROGRAMMING_LANGUAGE': ['python', 'javascript', 'java', 'ruby', 'go', 'rust'],
                    'FRAMEWORK': ['react', 'vue', 'angular', 'django', 'flask'],
                    'TOOL': ['docker', 'kubernetes', 'node', 'nodejs'],
                    'LIBRARY': ['tensorflow', 'pytorch', 'pandas', 'numpy']
                },
                SENTIMENT: {
                    'POSITIVE': ['happy', 'excited', 'great', 'wonderful', 'excellent'],
                    'NEGATIVE': ['sad', 'frustrated', 'angry', 'disappointed', 'terrible'],
                    'NEUTRAL': ['curious', 'interested', 'wondering']
                }
            };

        } catch (error) {
            console.error('[Entity] Initialization error:', error.message);
        }
    }

    /**
     * V4: Extract noun phrases from text (simple chunking)
     * Detects multi-word entities like "machine learning", "Python programming"
     */
    extractNounPhrases(text) {
        const phrases = [];
        const words = text.toLowerCase().split(/\s+/);

        let currentPhrase = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^\w\s]/g, '');

            // Skip stopwords at the start of a phrase
            if (currentPhrase.length === 0 && this.stopwords.has(word)) {
                continue;
            }

            // If it's a stopword mid-phrase, check if it's part of a multi-word concept
            if (this.stopwords.has(word)) {
                // If next word is not a stopword, include this one
                if (i + 1 < words.length && !this.stopwords.has(words[i + 1].replace(/[^\w\s]/g, ''))) {
                    currentPhrase.push(word);
                } else {
                    // End current phrase
                    if (currentPhrase.length > 0) {
                        phrases.push(currentPhrase.join(' '));
                        currentPhrase = [];
                    }
                }
            } else {
                currentPhrase.push(word);
            }
        }

        // Add final phrase
        if (currentPhrase.length > 0) {
            phrases.push(currentPhrase.join(' '));
        }

        return phrases;
    }

    /**
     * V4 ENHANCED: Infer entity type with expanded categories
     */
    inferEntityType(entity, context) {
        const lower = entity.toLowerCase();
        const contextLower = context.toLowerCase();

        // 1. Check if it's a known technology
        if (this.knownTechnologies.has(lower)) {
            return 'TECHNOLOGY';
        }

        // 2. Check against type patterns (context-based)
        for (const [type, keywords] of Object.entries(this.typePatterns)) {
            for (const keyword of keywords) {
                if (contextLower.includes(keyword)) {
                    return type;
                }
            }
        }

        // 3. Check for explicit location indicators
        if (contextLower.includes('place') || contextLower.includes('city') ||
            contextLower.includes('country') || contextLower.includes('location')) {
            return 'LOCATION';
        }

        // 4. Check for organization patterns
        if (entity.includes('Inc') || entity.includes('LLC') || entity.includes('Corp') ||
            contextLower.includes('company') || contextLower.includes('organization')) {
            return 'ORGANIZATION';
        }

        // 5. Check for time patterns
        if (/\d{4}/.test(entity) || // Year
            /\d{1,2}:\d{2}/.test(entity) || // Time
            ['today', 'tomorrow', 'yesterday', 'monday', 'tuesday', 'wednesday',
                'thursday', 'friday', 'saturday', 'sunday'].some(t => lower.includes(t))) {
            return 'TIME';
        }

        // 6. Heuristics based on entity structure
        // Multi-word phrases are usually CONCEPTS, not PERSON
        if (entity.includes(' ') && entity.split(' ').length > 2) {
            return 'CONCEPT';
        }

        // 7. Single capitalized word - context-dependent
        if (/^[A-Z][a-z]+$/.test(entity)) {
            // Only classify as PERSON if context strongly suggests it
            if (contextLower.includes('who') || contextLower.includes('name')) {
                return 'PERSON';
            }
            // Could be location, organization, or concept
            return 'CONCEPT';  // Default to CONCEPT to be safe
        }

        // 8. All caps might be acronym/organization
        if (entity === entity.toUpperCase() && entity.length > 1) {
            return 'ORGANIZATION';
        }

        // Default to CONCEPT for most cases
        return 'CONCEPT';
    }

    /**
     * V4: Auto-activate semantic neighbors (2-hop spreading)
     * When an entity is detected, activate related concepts
     */
    activateSemanticNeighbors(entityId, depth = 2) {
        if (depth === 0 || !this.scaffold.memory.nodes.has(entityId)) {
            return;
        }

        const node = this.scaffold.memory.nodes.get(entityId);
        const neighbors = this.scaffold.memory.getNeighbors(entityId);

        // Activate 1-hop neighbors
        for (const edge of neighbors) {
            const neighborNode = this.scaffold.memory.nodes.get(edge.to);
            if (neighborNode) {
                neighborNode.activation += 0.3; // Moderate activation boost

                // Recursively activate 2-hop neighbors (with decay)
                if (depth > 1) {
                    const secondHopNeighbors = this.scaffold.memory.getNeighbors(edge.to);
                    for (const secondEdge of secondHopNeighbors) {
                        const secondNode = this.scaffold.memory.nodes.get(secondEdge.to);
                        if (secondNode) {
                            secondNode.activation += 0.1; // Weaker activation
                        }
                    }
                }
            }
        }
    }

    /**
     * V4 ENHANCED: Extract entities with type inference and semantic activation
     */
    resolve(inputText) {
        const entities = [];
        const words = inputText.split(/\s+/);
        const normalized = inputText.toLowerCase();

        // 1. NOUN PHRASE EXTRACTION (V4 NEW!)
        const phrases = this.extractNounPhrases(inputText);
        for (const phrase of phrases) {
            // Check if phrase exists in graph
            if (this.scaffold.memory.nodes.has(phrase)) {
                const node = this.scaffold.memory.nodes.get(phrase);
                const entityType = this.inferEntityType(phrase, inputText);

                entities.push({
                    id: phrase,
                    type: 'KNOWN_PHRASE',
                    entityType,
                    node,
                    confidence: 1.0
                });

                // V4: Auto-activate semantic neighbors
                this.activateSemanticNeighbors(phrase, 2);
            } else if (phrase.split(' ').length > 1) {
                // Multi-word phrase not in graph → potential new concept
                const entityType = this.inferEntityType(phrase, inputText);
                entities.push({
                    id: phrase,
                    type: 'POTENTIAL_PHRASE',
                    entityType,
                    confidence: 0.6
                });
            }
        }

        // 2. KNOWN ENTITY LOOKUP (V3 compatibility)
        for (const word of words) {
            const clean = word.replace(/[^a-zA-Z0-9]/g, '');

            // Check original casing
            if (this.scaffold.memory.nodes.has(clean)) {
                const node = this.scaffold.memory.nodes.get(clean);
                if (node.type === 'ENTITY' || node.type === 'IDENTITY' || node.type === 'ALIAS') {
                    const entityType = this.inferEntityType(clean, inputText);
                    entities.push({
                        id: clean,
                        type: 'KNOWN',
                        entityType,
                        node,
                        confidence: 1.0
                    });

                    // V4: Auto-activate semantic neighbors
                    this.activateSemanticNeighbors(clean, 2);
                }
            }
            // Check lowercase
            else if (this.scaffold.memory.nodes.has(clean.toLowerCase())) {
                const lower = clean.toLowerCase();
                const node = this.scaffold.memory.nodes.get(lower);
                if (node.type === 'ENTITY' || node.type === 'IDENTITY' || node.type === 'ALIAS') {
                    const entityType = this.inferEntityType(lower, inputText);
                    entities.push({
                        id: lower,
                        type: 'KNOWN',
                        entityType,
                        node,
                        confidence: 1.0
                    });

                    // V4: Auto-activate semantic neighbors
                    this.activateSemanticNeighbors(lower, 2);
                }
            }
        }

        // 3. DISCOVER NEW ENTITIES (Heuristic)
        const ignored = new Set(['I', 'A', 'The', 'And', 'Or', 'But']);

        for (let i = 1; i < words.length; i++) {
            const word = words[i].replace(/[^a-zA-Z0-9]/g, '');
            if (word.length > 1 && /^[A-Z]/.test(word) && !ignored.has(word)) {
                // Check if already found
                if (!entities.find(e => e.id === word || e.id === word.toLowerCase())) {
                    const entityType = this.inferEntityType(word, inputText);
                    entities.push({
                        id: word,
                        type: 'POTENTIAL',
                        entityType,
                        confidence: 0.7
                    });
                }
            }
        }

        // 4. QUOTED ENTITIES
        const quoted = inputText.match(/"([^"]+)"/g);
        if (quoted) {
            for (const q of quoted) {
                const content = q.slice(1, -1);
                entities.push({
                    id: content,
                    type: 'LITERAL',
                    entityType: 'CONCEPT',
                    confidence: 1.0
                });
            }
        }

        // 5. SENTIMENT DETECTION
        for (const keyword of this.typePatterns.SENTIMENT) {
            if (normalized.includes(keyword)) {
                entities.push({
                    id: keyword,
                    type: 'SENTIMENT',
                    entityType: 'SENTIMENT',
                    confidence: 0.9
                });
            }
        }

        return entities;
    }

    /**
     * V4: Register a new entity with automatic concept association
     */
    register(id, type = 'ENTITY', entityType = 'CONCEPT') {
        // Add node to graph
        this.scaffold.memory.addNode(id, type, { entityType }, 'SEMANTIC');

        // V4: Build entity→concept associations automatically
        // Link to related concepts based on words in the entity
        const words = id.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 3 && this.scaffold.memory.nodes.has(word)) {
                // Create RELATES_TO edge
                this.scaffold.memory.addEdge(id, word, 'RELATES_TO', 0.5);
            }
        }

        console.log(`[Entity V4] Registered: ${id} (${entityType})`);
    }
}

module.exports = EntityResolver;

module.exports = EntityResolver;
