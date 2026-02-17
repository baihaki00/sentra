const ModelOrchestrator = require('../models/ModelOrchestrator');

/**
 * Cognitive Engine (System 2)
 * Implements "Tree of Thoughts" reasoning to simulate and select the best plan.
 */
class CognitiveEngine {
    constructor(agent) {
        this.agent = agent;
        this.models = new ModelOrchestrator(agent.config);
    }

    /**
     * The core "Think" method.
     * Generates multiple plans, critiques them, and returns the winner.
     */
    async deliberate(task, context) {
        // V11: Procedural Memory (Fast Path)
        if (this.agent.components.skills) {
            // Check if we've already tried this skill in the current session
            if (!context.usedSkills) context.usedSkills = new Set();

            // Only search if we haven't already used a skill for this task
            // (Simplistic check: If we have ANY used skills, maybe we should stop trying fast path to avoid loops)
            // Better: Check if the specific skill ID is in the set (need findSkill to return ID first)

            // Let's modify findSkill to return metadata
            const cachedPlan = await this.agent.components.skills.findSkill(task);

            if (cachedPlan && cachedPlan.id && !context.usedSkills.has(cachedPlan.id)) {
                this.agent.log(`[Cognitive] ⚡ Fast-Tracking: Using learned skill (${cachedPlan.id}).`);
                context.usedSkills.add(cachedPlan.id);
                return cachedPlan.plan;
            } else if (cachedPlan && context.usedSkills.has(cachedPlan.id)) {
                this.agent.log(`[Cognitive] ⚠️ Skipping used skill (${cachedPlan.id}) to prevent loops.`);
            }
        }

        // V12: Fast-path for simple queries (skip Tree of Thoughts)
        if (this._isSimpleQuery(task, context)) {
            this.agent.log('[Cognitive] ⚡ Fast Path: Simple query, skipping Tree of Thoughts...');
            const result = await this.models.deliberateFast(task, context);
            this.agent.log(`[Cognitive] 💭 Thought: "${result.thought}"`);
            this.agent.log(`[Cognitive] 📋 Plan: ${JSON.stringify(result.plan, null, 2)}`);
            return result.plan;
        }

        this.agent.log('[Cognitive] 🧠 System 2 Activated: Full Deliberation...');
        const result = await this.deliberateTree(task, context);

        this.agent.log(`[Cognitive] 💭 Winner Thought: "${result.thought}"`);
        this.agent.log(`[Cognitive] 📋 Winner Plan: ${JSON.stringify(result.plan, null, 2)}`);

        // V12: Trust the LLM's plan. Don't strip final_answer.
        // Old V6.5 sanitizer forced a 2nd planning cycle, adding 4+ LLM calls.
        // System prompt now teaches snippet-first answering.
        return result.plan;
    }

    /**
     * Tree of Thoughts: 
     * 1. Generate 3 Candidates.
     * 2. Critique each (Fast).
     * 3. Select Best.
     */
    async deliberateTree(task, context) {
        this.agent.log('[Cognitive] 🌳 Tree of Thoughts: Sprouting branches...');

        // 1. Generate Candidates (Parallel)
        const candidates = await this.models.generateCandidates(task, context, 3);

        // Filter out failures
        const validCandidates = candidates.filter(c => c && c.plan && c.plan.length > 0);
        if (validCandidates.length === 0) {
            this.agent.log('[Cognitive] ❌ All thoughts withered. Falling back to simple generation.');
            return this.models.deliberateFast(task, context);
        }

        // 2. Evaluate (LLM Ranking)
        this.agent.log(`[Cognitive] ⚖️ Weighing ${validCandidates.length} possibilities...`);

        try {
            // fast path for single candidate
            if (validCandidates.length === 1) return validCandidates[0];

            const candidatesText = validCandidates.map((c, i) => {
                return `PLAN ${i + 1}:\nThought: ${c.thought}\nSteps: ${JSON.stringify(c.plan)}`;
            }).join('\n\n');

            const prompt = `
            Task: "${task}"
            
            I have generated ${validCandidates.length} possible plans.
            
            ${candidatesText}
            
            INSTRUCTIONS:
            1. Analyze which plan is the MOST EFFICIENT and SAFE.
            2. Return the index (1-based) of the best plan.
            3. Return JSON ONLY: { "best_index": 1, "reason": "..." }
            `;

            const response = await this.models.chat([{ role: 'user', content: prompt }]);
            const safeJson = this.models.cleanJson(response);
            const decision = JSON.parse(safeJson);

            const winnerIndex = (decision.best_index || 1) - 1;
            const winner = validCandidates[winnerIndex] || validCandidates[0];

            this.agent.log(`[Cognitive] 🏆 Selected Plan ${decision.best_index}: ${decision.reason}`);
            return winner;

        } catch (e) {
            this.agent.log(`[Cognitive] ⚠️ Judging failed (${e.message}). Picking first valid plan.`);
            return validCandidates[0];
        }
    }

    /**
     * Detect simple queries that don't need Tree of Thoughts.
     * Simple = factual lookups, single-step questions, info retrieval.
     * Complex = multi-step tasks, code generation, system operations.
     */
    _isSimpleQuery(task, context) {
        const t = task.toLowerCase();

        // If history is long, it might be a complex evolving task -> use full planning
        // But for short sequences (search -> answer), stick to fast path
        if (context.history && context.history.length > 2) return false;

        // CRITICAL: If we already tried fetching data, and we are back here, it means
        // the fast path FAILED or needs more work. Force System 2 to handle fallbacks.
        const usedDataTools = context.history && context.history.some(h =>
            h.tool === 'web_fetch' || h.tool === 'web_search' || h.tool.startsWith('browser_')
        );
        if (usedDataTools) return false;

        // Simple patterns: questions, lookups, greetings
        const simplePatterns = [
            /^(what|who|when|where|how|why|which|is|are|was|were|do|does|did|can|could|will|would)\s/i,
            /^(tell me|show me|find|search|look up|get|fetch|check|price of|weather in)/i,
            /^(hello|hi|hey|greetings|good morning|good afternoon|good evening)/i,
            /\?$/,  // Ends with question mark
        ];

        // Complex patterns: multi-step operations
        const complexPatterns = [
            /^(build|create|write|implement|deploy|install|setup|configure|modify|edit|fix|debug|refactor)/i,
            /^(analyze|compare|benchmark|test|run|execute|schedule)/i,
            /(and then|step by step|first.*then|multiple|all|every)/i,
        ];

        const isSimple = simplePatterns.some(p => p.test(t));
        const isComplex = complexPatterns.some(p => p.test(t));

        return isSimple && !isComplex;
    }
}

module.exports = CognitiveEngine;
