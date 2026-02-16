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
    }

    /**
     * Start the agent with a specific task
     */
    async startTask(taskDescription) {
        try {
            if (this.state !== 'IDLE') {
                throw new Error(`Cannot start task in state: ${this.state}`);
            }

            // 1. INIT_TASK
            await this.transition('INIT', async () => {
                console.log('[Agent] Initializing Task...');
                this.context.task = taskDescription;
                this.context.startTime = Date.now();
            });

            // 2. LOAD_CAPABILITIES
            await this.transition('LOAD', async () => {
                console.log('[Agent] Loading Capabilities...');
                // In a real impl, this would load tools from registry
                if (this.components.tools) await this.components.tools.load();
            });

            // 3. ALLOCATE_MODELS
            await this.transition('ALLOCATE', async () => {
                console.log('[Agent] Allocating Models...');
                if (this.components.models) await this.components.models.allocate();
            });

            // 4. INIT_WORKING_MEMORY
            await this.transition('MEM_INIT', async () => {
                console.log('[Agent] Initializing Working Memory...');
                if (this.components.memory) {
                    await this.components.memory.initialize(this.context.task);
                }
            });

            // 5. LOOP
            await this.transition('LOOP', async () => {
                console.log('[Agent] Entering Execution Loop...');
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
        console.log(`[State] ${this.state} -> ${newState}`);
        this.state = newState;
        this.emit('stateChange', { state: newState });
        if (action) await action();
    }
}

module.exports = Agent;
