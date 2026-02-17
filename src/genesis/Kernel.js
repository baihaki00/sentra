const readline = require('readline');
const { Scaffold } = require('./Scaffold');
const Memory = require('./Memory');

// TOOL IMPORTS
const FileSystemTools = require('./tools/FileSystemTools');

class ActionBinder {
    constructor() {
        console.log(`[Kernel] CWD: ${process.cwd()}`);
        this.fs = new FileSystemTools(process.cwd());
        this.actions = new Map();
        this.registerbasicActions();
    }

    registerbasicActions() {
        this.register('LIST_FILES', async (args) => {
            const dirpath = args && args.path ? args.path : '.';
            return await this.fs.list_dir({ dirpath });
        });
        this.register('ECHO', async (args) => {
            return args.message;
        });
    }

    register(name, fn) {
        this.actions.set(name, fn);
    }

    async execute(actionName, args) {
        if (this.actions.has(actionName)) {
            try {
                return await this.actions.get(actionName)(args);
            } catch (e) {
                return `Error: ${e.message}`;
            }
        }
        return `Unknown Action: ${actionName}`;
    }
}

const CuriosityModule = require('./Curiosity');
const Responder = require('./Responder');
const IntentEngine = require('./Intent');
const EntityResolver = require('./Entity');
const ExpectationModule = require('./Expectation');
const AttentionFilter = require('./Attention');
const ReflectionEngine = require('./Reflection');
const LinguisticsEngine = require('./Linguistics'); // V4.2 Minimal Primitives
const KnowledgeLoader = require('./Loader'); // V4.3 Seeding

const colors = {
    reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
    black: '\x1b[30m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m'
};

const log = {
    sentra: (msg) => `${colors.bright}${colors.cyan}[Sentra]${colors.reset} ${colors.cyan}${msg}${colors.reset}`,
    perception: (msg) => `${colors.dim}${colors.white}[Perception]${colors.reset} ${msg}`,
    entity: (msg) => `${colors.green}[Entity V3]${colors.reset} ${msg}`,
    intent: (msg) => `${colors.yellow}[Intent V3]${colors.reset} ${msg}`,
    reasoning: (msg) => `${colors.magenta}[Reasoning]${colors.reset} ${msg}`,
    teaching: (msg) => `${colors.blue}[Teaching]${colors.reset} ${msg}`,
    error: (msg) => `${colors.red}[Error]${colors.reset} ${msg}`
};

class GenesisKernel {
    constructor() {
        this.scaffold = new Scaffold();
        this.memory = new Memory();
        this.binder = new ActionBinder();
        this.curiosity = new CuriosityModule(this.scaffold);
        this.responder = new Responder();
        this.intent = new IntentEngine(this.scaffold);
        this.entityResolver = new EntityResolver(this.scaffold);
        this.expectation = new ExpectationModule(this.scaffold);
        this.attention = new AttentionFilter(this.scaffold);
        this.reflection = new ReflectionEngine(this.scaffold);
        this.linguistics = new LinguisticsEngine(this.scaffold);
        this.loader = new KnowledgeLoader(this.scaffold);

        this.identity = 'SENTRA';
        this.autoPilot = null;
        this.lastActivity = Date.now();

        // V4.1: Conversational State Tracking
        this.conversationState = {
            mode: 'IDLE',
            context: null,
            timestamp: 0
        };
    }

    async init() {
        // Load persistent memory
        const loadedGraph = this.memory.load();
        if (loadedGraph) {
            this.scaffold.memory = loadedGraph;
            console.log(`${colors.dim}[Kernel] Resumed memory state (${this.scaffold.memory.nodes.size} nodes).${colors.reset}`);
        } else {
            console.log(`${colors.dim}[Kernel] Starting with fresh memory. Seeding basic concepts...${colors.reset}`);
            // Seed Knowledge
            const seedPath = require('path').join(process.cwd(), 'data/seeds/basic_concepts.json');
            this.loader.ingest(seedPath);
            this.memory.save(this.scaffold.memory);
        }

        console.log(`${colors.bright}✓ Sentra Genesis v0.2${colors.reset}`);
        console.log(`  Logs: ./data/debug.log\n`);
        return true;
    }

    async loop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'GENESIS> '
        });

        rl.prompt();

        // Idle Timer
        setInterval(() => {
            const idleTime = Date.now() - this.lastActivity;
            if (idleTime > 10000 && this.scaffold.state !== 'DREAMING') {
                this.scaffold.state = 'DREAMING';
                this.reflection.reflect().then(() => {
                    this.scaffold.state = 'IDLE';
                    this.memory.save(this.scaffold.memory);
                });
            }
        }, 10000);

        rl.on('line', async (line) => {
            this.lastActivity = Date.now();
            const input = line.trim();
            if (input === '/exit') process.exit(0);

            // 0. RESET & DECAY
            this.scaffold.memory.decayAll(0.6);

            // STAGE 0.5: COMMAND OVERRIDES (Pattern Teaching)
            if (input.startsWith('Format:')) {
                const raw = input.substring(7).trim();
                const success = this.linguistics.learnPattern('INTENT:STATEMENT', raw);
                if (success) {
                    console.log(log.teaching(`Pattern learned: "${raw}"`));
                    console.log(log.sentra("I have integrated this new linguistic pattern."));
                } else {
                    console.log(log.teaching(`Pattern already known: "${raw}"`));
                }
                rl.prompt();
                return;
            }

            // STAGE 1: INPUT RECEPTION & TOKENIZATION
            // Punctuation-aware: "right?" -> ["right", "?", ""]
            const cleanInput = input.toLowerCase().replace(/([?.!,;])/g, ' $1 ');
            const tokens = cleanInput.split(/\s+/).filter(t => t.length > 0);

            // STAGE 2: PERCEPTION
            console.log(`${colors.dim}[Pipeline] Stage 1/7: Perception${colors.reset}`);
            const conceptId = this.scaffold.perceive(cleanInput);
            console.log(log.perception(`Active Concept: ${conceptId}`));

            for (const token of tokens) {
                if (this.scaffold.memory.nodes.has(token)) {
                    this.scaffold.memory.spreadActivation(token, 1.5, 0.5);
                }
            }

            // SYNC HANDLER
            if (input === '/sync') {
                console.log('[Kernel] Syncing Graph to UI...');
                for (const [id, node] of this.scaffold.memory.nodes) {
                    console.log(`[Perception] Node: ${id} | Type: ${node.type || 'CONCEPT'}`);
                }
                for (const edge of this.scaffold.memory.edges) {
                    console.log(`[Teaching] Learned: "${edge.from}" -> [${edge.to}]`);
                }
                rl.prompt();
                return;
            }

            // STAGE 3: ENTITY EXTRACTION
            console.log(`${colors.dim}[Pipeline] Stage 2/7: Entity Extraction${colors.reset}`);
            let extractedEntities = [];
            try {
                extractedEntities = this.entityResolver.resolve(cleanInput);
                if (extractedEntities.length > 0) {
                    const names = extractedEntities.map(e => `${e.id} (${e.entityType || 'unknown'})`).join(', ');
                    console.log(`${colors.dim}[Entities] Detected: ${names}${colors.reset}`);
                }
            } catch (error) {
                console.error(`${colors.red}[Entity Error] ${error.message}${colors.reset}`);
            }

            // Activated Entity Spread
            if (extractedEntities.length > 0) {
                console.log(log.entity(`Detected ${extractedEntities.length}: ${extractedEntities.map(e => e.id).join(', ')}`));
                for (const entity of extractedEntities) {
                    if (entity.node) {
                        entity.node.activation += 0.8;
                        this.scaffold.memory.spreadActivation(entity.node.id, 1.5, 0.5);
                    }
                }
            }

            // STAGE 3.5: ATTENTION GATING
            console.log(`${colors.dim}[Pipeline] Stage 3/7: Attention Gating${colors.reset}`);
            const relevantNodes = this.attention.filterRelevant(null, extractedEntities, this.scaffold.context.shortTerm.slice(-3));
            if (relevantNodes.length > 0) {
                const summary = this.attention.getFocusSummary(relevantNodes);
                console.log(`${colors.dim}${summary}${colors.reset}`);
                this.attention.applyGating(relevantNodes);
            }

            // STAGE 3.6: STRUCTURAL ANALYSIS (Statements/Confirmations)
            // A. Confirmations
            const confirmation = this.intent.detectConfirmation(input);
            if (this.conversationState.mode.startsWith('AWAITING_CONFIRMATION') && confirmation) {
                if (confirmation === 'YES') {
                    if (this.conversationState.mode === 'AWAITING_CONFIRMATION_INFER') {
                        const entityId = this.conversationState.context.entity;
                        this.scaffold.memory.addNode(entityId, 'CONCEPT', { source: 'USER_CONFIRMED' }, 'SEMANTIC');
                        console.log(log.sentra(`Understood. "${entityId}" is now a known concept.`));
                    }
                } else {
                    console.log(log.sentra("Understanding updated."));
                }
                this.conversationState = { mode: 'IDLE', context: null, timestamp: 0 };
                rl.prompt();
                return;
            }

            // B. Statements
            const statement = this.intent.detectStatement(input);
            if (statement) {
                console.log(`${colors.dim}[Structure] SVO Detected: ${statement.subject} -> ${statement.predicate} -> ${statement.object}${colors.reset}`);
                const subjId = statement.subject;
                const objId = statement.object;
                this.scaffold.memory.addNode(subjId, 'CONCEPT', { source: 'USER_TAUGHT' }, 'SEMANTIC');
                this.scaffold.memory.addNode(objId, 'CONCEPT', { source: 'USER_TAUGHT' }, 'SEMANTIC');

                let relation = 'RELATED_TO';
                if (statement.predicate === 'is a' || statement.predicate === 'is an') relation = 'IS_A';
                if (statement.predicate === 'is') relation = 'IS';
                if (statement.predicate === 'has') relation = 'HAS';
                if (statement.predicate === 'can') relation = 'CAN';
                if (statement.predicate === 'means') relation = 'MEANS';

                this.scaffold.associate(subjId, objId, relation, 2.0);
                this.memory.save(this.scaffold.memory);

                // Linguistics Generation for Response
                const context = { REF1: subjId, ACT: relation.toLowerCase().replace('_', ' '), REF2: objId };
                const response = this.linguistics.generate('INTENT:STATEMENT', [], context);
                console.log(log.sentra(response));

                rl.prompt();
                return;
            }

            // STAGE 4: INTENT CLASSIFICATION
            console.log(`${colors.dim}[Pipeline] Stage 4/7: Intent Classification${colors.reset}`);

            let finalIntent = null;
            let intentConfidence = 0;
            let intentMethod = null;

            // TOPIC RESUME CHECK
            if (extractedEntities.length === 1 && (tokens.length <= 2 || input.split(' ').length <= 2) && !finalIntent) {
                const entity = extractedEntities[0];
                const node = this.scaffold.memory.nodes.get(entity.id);
                if (node && node.data && node.type !== 'PERCEPT') {
                    console.log(log.reasoning(`Single entity detected: "${entity.id}". Treating as Fact Query.`));
                    finalIntent = 'INTENT:FACT_QUERY';
                    intentConfidence = 1.0;
                    intentMethod = 'TOPIC_RESUME';
                }
            }

            // SEMANTIC CLASSIFICATION
            if (!finalIntent) {
                const semanticResult = this.intent.classifyBySemantic(input);
                if (semanticResult.score >= 0.7) {
                    finalIntent = semanticResult.intent;
                    intentConfidence = semanticResult.score;
                    intentMethod = 'V4_SEMANTIC';
                    console.log(`${colors.green}[Intent V4] Semantic Match: ${finalIntent} (${semanticResult.score.toFixed(3)})${colors.reset}`);
                } else if (semanticResult.score >= 0.5) {
                    const v3Intent = this.intent.classifyByActivation();
                    if (semanticResult.intent === v3Intent.intent) {
                        finalIntent = semanticResult.intent;
                        intentConfidence = (semanticResult.score * 0.6) + (v3Intent.score * 0.4);
                        intentMethod = 'V4+V3_HYBRID';
                        console.log(`${colors.cyan}[Intent Hybrid] ${finalIntent} matched.`);
                    } else {
                        if (semanticResult.score > v3Intent.score) {
                            finalIntent = semanticResult.intent;
                            intentConfidence = semanticResult.score;
                            intentMethod = 'V4_PREFERRED';
                        } else {
                            finalIntent = v3Intent.intent;
                            intentConfidence = v3Intent.score;
                            intentMethod = 'V3_PREFERRED';
                        }
                    }
                } else {
                    const v3Intent = this.intent.classifyByActivation();
                    finalIntent = v3Intent.intent;
                    intentConfidence = v3Intent.score;
                    intentMethod = 'V3_FALLBACK';
                }
            }

            const v3Intent = { intent: finalIntent, score: intentConfidence };

            // STAGE 5: EXPECTATION
            console.log(`${colors.dim}[Pipeline] Stage 5/7: Expectation Prediction${colors.reset}`);
            const prediction = this.expectation.predict(v3Intent.intent, extractedEntities, this.scaffold.context.shortTerm.slice(-5));
            console.log(`[Expectation] Predicting ${prediction.responseType} (Confidence: ${prediction.confidence.toFixed(2)})${colors.reset}`);

            // STAGE 6: RESPONSE GENERATION
            if (v3Intent.score > 0.5) {
                console.log(`${colors.dim}[Pipeline] Stage 6/7: Response Generation${colors.reset}`);
                console.log(log.intent(`Detected: ${v3Intent.intent} (Score: ${v3Intent.score.toFixed(2)})`));

                if (v3Intent.intent === 'INTENT:GREETING') {
                    // Greeting Guard
                    const isGreeting = /^(hello|hi|hey|greetings|good\s|yo\b|sup\b|howdy|what'?s\sup)/i.test(input);
                    if (!isGreeting && intentMethod !== 'V4_SEMANTIC') {
                        console.log(log.reasoning(`Ignoring weak greeting match for "${input}"`));
                    } else {
                        const response = this.linguistics.generate('INTENT:GREETING', [], {});
                        console.log(log.sentra(response));
                        rl.prompt();
                        return;
                    }
                }

                if (v3Intent.intent === 'INTENT:FACT_QUERY') {
                    let response = null;
                    let responseEntities = [];
                    const subject = extractedEntities[0];

                    if (subject) {
                        // Check Relations
                        const subjectId = subject.id.replace(/^(what|who)\s+is\s+/, '').replace(/\?$/, '').trim();
                        const node = this.scaffold.memory.nodes.get(subjectId);
                        const neighbors = this.scaffold.memory.getNeighbors(subjectId);
                        const relations = neighbors.filter(e => ['IS_A', 'IS', 'HAS', 'CAN', 'MEANS', 'RELATED_TO'].includes(e.type));

                        if (relations.length > 0) {
                            const r = relations[0];
                            const context = { REF1: subjectId, ACT: r.type.toLowerCase().replace('_', ' '), REF2: r.to };
                            response = this.linguistics.generate('INTENT:FACT_QUERY', [subject], context);
                            responseEntities = [subject];
                        } else if (node && node.data && node.type !== 'PERCEPT') {
                            response = `${subject.id} is a ${node.type}.`;
                            responseEntities = [subject];
                        }
                    }

                    if (response) {
                        console.log(log.sentra(response));
                        rl.prompt();
                        return;
                    }
                }

                // Generic Responder Fallback
                const response = this.responder.get(v3Intent.intent);
                console.log(log.sentra(response));
                rl.prompt();
                return;
            }

            // STAGE 7: UNKNOWN HANDLING (Curiosity)
            // Falls through if intent score is low OR if specific handlers (like Fact Query) failed to find data
            console.log(`${colors.dim}[Pipeline] Stage 7/7: Unknown Handling${colors.reset}`);
            const curiosityResult = this.curiosity.handleUnknown(input, extractedEntities);
            console.log(log.sentra(curiosityResult.response));

            // Set state based on mode
            if (curiosityResult.mode === 'CLARIFY' || curiosityResult.mode === 'INFER') {
                this.conversationState = {
                    mode: 'AWAITING_CONFIRMATION_' + curiosityResult.mode,
                    context: { entity: extractedEntities.length > 0 ? extractedEntities[0].id : null },
                    timestamp: Date.now()
                };
            }

            rl.prompt();
        });
    }
}

module.exports = GenesisKernel;
