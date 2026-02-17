const { EventEmitter } = require('events');
const CognitiveEngine = require('./CognitiveEngine');
const VisualMemory = require('../memory/VisualMemory');
const Reflector = require('./Reflector');
const SkillManager = require('./SkillManager');
const Thalamus = require('./Thalamus');
const LimbicSystem = require('./LimbicSystem');

/**
 * Sentra Agent
 * Implements a strict state machine for agent execution.
 */
class Agent extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.state = 'IDLE'; // IDLE, INIT, LOAD, ALLOCATE, MEM_INIT, LOOP, TERMINATED
        this.components = {
            memory: new LayeredMemory(this), // Initialized
            tools: null,
            models: null,
            pipeline: new Pipeline(this), // Initialized
            cognitive: new CognitiveEngine(this), // System 2
            // Project Hydra: Neuromorphic Stack
            thalamus: new Thalamus(this), // Router (L3)
            limbic: new LimbicSystem(this), // Cache/Safety (L2)
            visual_memory: new VisualMemory(this), // Phase 8c
            reflector: new Reflector(this), // Phase 10: The Subconscious
            skills: new SkillManager(this), // Phase 11: Procedural Memory
            reinforcement: new ReinforcementManager(this), // Phase 12: Episodic Reinforcement
            engineer: new Engineer(this) // Phase 13: Self-Evolving Code
        };
        this.context = {};
        this.abortSignal = false;
    }

    /**
     * Start the agent with a specific task
     */
    log(message) {
        console.log(message);
        this.emit('log', message);

        // Flight Recorder: Save to session.log
        try {
            const fs = require('fs');
            const path = require('path');
            const logDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

            const timestamp = new Date().toISOString();
            const logFile = path.join(logDir, 'session.log');
            fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
        } catch (e) {
            // Flatten error to avoid recursion
            console.error('Logging failed');
        }
    }

    async startTask(taskDescription) {
        try {
            if (this.state === 'ERROR') {
                this.log('[Agent] ⚠️ Recovering from previous ERROR state. Resetting to IDLE.');
                this.state = 'IDLE';
            }

            if (this.state !== 'IDLE') {
                throw new Error(`Cannot start task in state: ${this.state}`);
            }

            this.abortSignal = false;

            // 1. INIT_TASK
            await this.transition('INIT', async () => {
                this.log('[Agent] Initializing Task...');
                this.context.task = taskDescription;
                this.context.startTime = Date.now();
                this.context.assets = []; // Visual Memory (Screenshots, etc.)

                // V12: Episodic Reinforcement (Apply "Anti-Patterns")
                if (this.components.reinforcement) {
                    const corrections = this.components.reinforcement.getRelevantCorrections(taskDescription);
                    if (corrections) {
                        this.log('[Agent] 🛑 Applying Learned Constraints (Anti-Patterns)...');
                        this.context.corrections = corrections;
                    }
                }
            });

            // 2. LOAD_CAPABILITIES
            await this.transition('LOAD', async () => {
                this.log('[Agent] Loading Capabilities (Pre-loaded)...');
                // Ensure ToolSandbox has access to agent for vision
                if (this.components.tools) {
                    this.components.tools.config.agent = this;
                }
            });

            // 3. ALLOCATE_MODELS
            await this.transition('ALLOCATE', async () => {
                this.log('[Agent] Allocating Models...');
                if (this.components.models) await this.components.models.allocate();
            });

            // 4. INIT_WORKING_MEMORY
            await this.transition('MEM_INIT', async () => {
                this.log('[Agent] Initializing Working Memory...');
                if (this.components.memory) {
                    await this.components.memory.initialize(this.context.task);
                }
                if (this.components.visual_memory) {
                    await this.components.visual_memory.initialize();
                }
            });

            // 4. NEUROMORPHIC ROUTING (Project Hydra)
            if (this.components.thalamus) {
                const routing = await this.components.thalamus.route(taskDescription);

                if (routing.handled) {
                    if (routing.layer === 'CEREBELLUM') {
                        // Execute the skill immediately
                        const skillMatch = routing.result; // output of findSkill
                        this.log(`[Agent] 🦾 Executing Skill: ${skillMatch.skill.id}`);
                        this.context.result = await this.components.skills.executeSkill(skillMatch.skill, taskDescription);
                    } else {
                        // Reflex or Limbic result is already final
                        this.context.result = routing.result;
                    }

                    const duration = ((Date.now() - this.context.startTime) / 1000).toFixed(4);
                    this.log(`[Agent] ✅ Task Completed via ${routing.layer} in ${duration}s.`);
                    this.state = 'IDLE';
                    return this.context.result;
                }
            }

            // 5. LOOP (Cortex Execution)
            await this.transition('LOOP', async () => {
                this.log('[Agent] Entering Execution Loop...');
                if (this.components.pipeline) {
                    const result = await this.components.pipeline.execute(this.context);
                    this.context.result = result;
                } else {
                    console.warn('[Agent] No pipeline attached, simulating loop...');
                }
            });

            this.state = 'IDLE'; // Reset for next task
            this.resetIdleTimer(); // Go back to sleep/waiting

            const duration = ((Date.now() - this.context.startTime) / 1000).toFixed(2);
            this.log(`[Agent] ✅ Task Completed in ${duration}s.`);

            // V11: Procedural Learning (Workflow Capture)
            // If the task was successful, try to learn a skill from it
            if (this.components.skills && this.context.history && this.context.history.length > 0) {
                // We recreate a "plan" from the history of executed steps
                const executedPlan = this.context.history.map(h => ({ type: h.tool, args: h.args }));
                // Fire and forget (don't await) - let it happen in background
                this.components.skills.learnSkill(this.context.task, executedPlan, this.context.result).catch(e => console.error(e));
            }

            // V12: Episodic Reinforcement (Learning Loop)
            // If the user says "Wrong", learn from the PREVIOUS task.
            if (this.components.reinforcement && this.components.reinforcement.isCorrection(taskDescription)) {
                // We need the LAST task description, but Agent state is reset. 
                // We'll rely on CLI to persist history or (simpler) just check memory/logs.
                // For now, let's assume the user corrects immediately.
                // We need a way to know what the 'last task' was.
                // Let's store `lastTask` in the agent instance.
                if (this.lastTask) {
                    const rule = await this.components.reinforcement.train(taskDescription, this.lastTask);
                    if (rule) return `Learned New Constraint: ${rule}`;
                } else {
                    return "I understand you are correcting me, but I don't remember the last task to associate this with.";
                }
            }

            // Save current task for future correction
            this.lastTask = taskDescription;

            return this.context.result;

        } catch (error) {
            console.error('[Agent] Fatal Error:', error);
            this.state = 'ERROR';
            throw error;
        }
    }

    /**
     * Transition to a new state with side effects
     */
    async transition(newState, action) {
        this.log(`[State] ${this.state} -> ${newState}`);
        this.state = newState;
        this.emit('stateChange', { state: newState });
        if (action) await action();
    }

    stop() {
        if (this.state !== 'IDLE') {
            this.abortSignal = true;
            this.log('[Agent] 🛑 Stop Signal Received. Terminating...');
        }
    }

    resetIdleTimer() {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        // 5 minutes (300,000 ms) idle trigger
        this.idleTimer = setTimeout(() => {
            if (this.state === 'IDLE' && this.components.reflector) {
                this.components.reflector.reflect();
            }
        }, 300000);
    }
}

module.exports = Agent;
