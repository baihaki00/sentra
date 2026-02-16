const { EventEmitter } = require('events');

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
            memory: null,
            tools: null,
            models: null,
            pipeline: null
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
    }

    async startTask(taskDescription) {
        try {
            if (this.state !== 'IDLE') {
                throw new Error(`Cannot start task in state: ${this.state}`);
            }

            this.abortSignal = false;

            // 1. INIT_TASK
            await this.transition('INIT', async () => {
                this.log('[Agent] Initializing Task...');
                this.context.task = taskDescription;
                this.context.startTime = Date.now();
            });

            // 2. LOAD_CAPABILITIES
            await this.transition('LOAD', async () => {
                this.log('[Agent] Loading Capabilities (Pre-loaded)...');
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
            });

            // 5. LOOP
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
}

module.exports = Agent;
