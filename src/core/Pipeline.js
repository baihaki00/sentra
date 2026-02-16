/**
 * Execution Pipeline
 * Manages the inner loop: PLAN -> ACT -> OBSERVE -> REFLECT
 */
const chalk = require('chalk');

class Pipeline {
    constructor(agent) {
        this.agent = agent;
        this.maxSteps = 30;
    }

    async execute(context) {
        let stepCount = 0;
        let isTerminated = false;
        let finalResult = null;

        while (!isTerminated && stepCount < this.maxSteps) {
            stepCount++;
            console.log(chalk.gray(`[Pipeline] Step ${stepCount}/${this.maxSteps}`));

            // 1. PLAN
            const step = await this.plan(context);

            // 2. ACT
            const actionResult = await this.act(step, context);

            // 3. OBSERVE
            await this.observe(actionResult, context);

            // 4. REFLECT
            const decision = await this.reflect(context);

            if (decision.terminate) {
                isTerminated = true;
                finalResult = decision.result;
            }

            // 5. CHECKPOINT (Simulated)
            await this.checkpoint(context);
        }

        if (!isTerminated) {
            console.warn(chalk.yellow('[Pipeline] Max steps reached.'));
        } else {
            await this.agent.components.memory.commitEpisode({
                result: finalResult,
                steps: stepCount,
                history: context.history
            });
        }

        return finalResult;
    }

    async plan(context) {
        // console.log('  -> PLAN: generating next step...');
        if (this.currentPlan && this.currentPlan.length > 0) {
            return this.currentPlan.shift();
        }

        // Generate new plan if empty
        const steps = await this.agent.components.models.generatePlan(context);
        if (steps && steps.length > 0) {
            this.currentPlan = steps;
            return this.currentPlan.shift();
        }

        return { type: 'noop', args: {} };
    }

    async act(step, context) {
        // console.log(`  -> ACT: executing ${step.type}...`);

        // ReAct Pattern: Clear the remaining plan after any action to force re-evaluation
        this.currentPlan = [];

        try {
            if (step.type === 'noop') return { status: 'skipped', output: 'No operation', tool: 'noop' };
            const output = await this.agent.components.tools.execute(step.type, step.args);

            // Log output for debugging (truncated)
            const logOutput = output.length > 200 ? output.substring(0, 200) + '...' : output;
            console.log(chalk.gray(`  -> ACT RESULT: ${logOutput}`));

            return { status: 'success', output, tool: step.type };
        } catch (error) {
            console.error(chalk.red(`  -> ACT ERROR: ${error.message}`));
            return { status: 'error', output: error.message, tool: step.type };
        }
    }

    async observe(result, context) {
        // console.log('  -> OBSERVE: updating memory...');
        if (!context.history) context.history = [];
        context.history.push(result);
        // In real impl, update working memory
        await this.agent.components.memory.set('last_result', result);
    }

    async reflect(context) {
        // console.log('  -> REFLECT: evaluating progress...');
        const last = context.history[context.history.length - 1];

        // Terminate check: Only explicit final_answer terminates the task
        if (last && last.tool === 'final_answer' && last.status === 'success') {
            return { terminate: true, result: last.output };
        }

        if (context.history.length >= this.maxSteps) {
            return { terminate: true, result: 'Max Steps Reached' };
        }

        // If plan is empty, we just continue to next loop iteration to re-plan
        return { terminate: false };
    }

    async checkpoint(context) {
        // Mock checkpoint
    }
}

module.exports = Pipeline;
