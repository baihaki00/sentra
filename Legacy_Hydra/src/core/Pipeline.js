/**
 * Execution Pipeline
 * Manages the inner loop: PLAN -> ACT -> OBSERVE -> REFLECT
 */
const chalk = require('chalk');
const path = require('path');
const readline = require('readline');

const MAX_STEPS = 10; // User Constraint: "Do more with less" - 2026-02-16

class Pipeline {
    constructor(agent) {
        this.agent = agent;
        this.maxSteps = MAX_STEPS;
        this.consecutiveNoops = 0; // Guard against infinite loops
    }

    async execute(context) {
        let stepCount = 0;
        let isTerminated = false;
        let finalResult = null;

        while (!isTerminated && stepCount < this.maxSteps) {
            stepCount++;
            this.agent.log(`[Pipeline] Step ${stepCount}/${this.maxSteps}`);

            if (this.agent.abortSignal) {
                console.warn(chalk.red('[Pipeline] Execution Aborted by User.'));
                return "🛑 Task Terminated by User.";
            }

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
            console.log(chalk.green('[Pipeline] Episode committed successfully.'));
        }

        return finalResult;
    }

    async plan(context) {
        // console.log('  -> PLAN: generating next step...');
        if (this.currentPlan && this.currentPlan.length > 0) {
            return this.currentPlan.shift();
        }

        // Generate new plan if empty
        // V6 Upgrade: Use System 2 Cognitive Engine
        const bestPlan = await this.agent.components.cognitive.deliberate(context.task, context);
        if (bestPlan && bestPlan.length > 0) {
            // V13: Smart plan sanitizer — strip premature final_answer
            // When data-gathering tools are present, the LLM can't know the results
            // yet, so final_answer will contain placeholders like {{extracted_price}}.
            // Strip it so we re-plan AFTER seeing the data.
            const dataTools = ['web_search', 'web_fetch', 'google_search', 'browser_open', 'browser_read', 'cmd', 'execute_javascript', 'execute_python', 'read_file'];
            const hasDataTool = bestPlan.some(s => dataTools.includes(s.type));
            const hasFinalAnswer = bestPlan.some(s => s.type === 'final_answer');

            if (hasDataTool && hasFinalAnswer && bestPlan.length > 1) {
                // Keep only the data-gathering steps, strip final_answer
                this.currentPlan = bestPlan.filter(s => s.type !== 'final_answer');
                this.agent.log('[Pipeline] 🔧 Stripped premature final_answer — will re-plan after data is available.');
            } else {
                this.currentPlan = bestPlan;
            }

            return this.currentPlan.shift();
        }

        return { type: 'noop', args: {} };
    }

    async act(step, context) {
        // console.log(`  -> ACT: executing ${step.type}...`);

        try {
            // 0. Safeguard: Infinite No-op loops
            if (step.type === 'noop') {
                this.consecutiveNoops++;
                if (this.consecutiveNoops >= 3) {
                    return { status: 'error', output: 'Safeguard: Terminating due to consecutive no-ops (Agent confused).', tool: 'system' };
                }
                return { status: 'skipped', output: 'No operation', tool: 'noop' };
            }
            this.consecutiveNoops = 0; // Reset on valid action

            let output;

            // 1. ROUTING: Engineer Tools (Privileged)
            if (['read_code', 'write_code', 'patch_code', 'verify_code'].includes(step.type)) {
                if (this.agent.components.engineer) {
                    // Normalize arguments
                    const fp = step.args.filepath || step.args.filePath || step.args.file;
                    const content = step.args.content || step.args.code;
                    const search = step.args.search || step.args.pattern;
                    const replace = step.args.replace || step.args.replacement;
                    const cmd = step.args.command || step.args.cmd;

                    console.log(`[Pipeline] 🛠️ Engineer Tool: ${step.type}`, { fp, cmd });

                    let result;
                    if (step.type === 'read_code') result = this.agent.components.engineer.readCode(fp);
                    if (step.type === 'write_code') result = this.agent.components.engineer.writeCode(fp, content);
                    if (step.type === 'patch_code') result = this.agent.components.engineer.patchCode(fp, search, replace);
                    if (step.type === 'verify_code') result = await this.agent.components.engineer.verify(cmd);

                    output = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                } else {
                    throw new Error('Engineer component not initialized.');
                }
            }
            // 2. ROUTING: Standard Tools (Sandbox)
            else {
                output = await this.agent.components.tools.execute(step.type, step.args);
            }

            // Ensure output is always a string for downstream safety
            output = output != null ? String(output) : '';

            // 3. OBSERVE SIDE-EFFECTS
            // V6.1 Visual Memory: Scan for [ASSET: path] tags
            if (typeof output === 'string') {
                const assetMatch = output.match(/\[ASSET: (.*?)\]/);
                if (assetMatch && this.agent.context.assets) {
                    const assetPath = assetMatch[1].trim();
                    this.agent.context.assets.push(assetPath);
                    this.agent.log(`[Pipeline] 🖼️ Captured Asset: ${assetPath}`);
                }
            }

            // V8c Visual RAG: Auto-index analyzed images
            if (step.type === 'analyze_image' && output && !output.includes('Error')) {
                const filepath = step.args.filepath;
                if (filepath) {
                    this.agent.components.visual_memory.add(filepath, output);
                    this.agent.log(`[Pipeline] 🧠 Visual Memory Updated: Indexed description for ${path.basename(filepath)}`);
                }
            }

            // Log output for debugging (truncated)
            const logOutput = output.length > 200 ? output.substring(0, 200) + '...' : output;
            this.agent.log(`  -> ACT RESULT: ${logOutput}`);

            return { status: 'success', output, tool: step.type };

        } catch (error) {
            this.agent.log(`  -> ACT ERROR: ${error.message}`);
            this.currentPlan = []; // Force re-planning check
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
