const fs = require('fs');
const path = require('path');
const ModelOrchestrator = require('../models/ModelOrchestrator');

/**
 * Skill Manager (Procedural Memory)
 * Handles the storage and retrieval of "Skills" (parameterized workflows).
 */
class SkillManager {
    constructor(agent) {
        this.agent = agent;
        this.models = new ModelOrchestrator(agent.config);
        this.dbPath = path.join(process.cwd(), 'data', 'skills.json');
        this.cache = [];
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.cache = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            }
        } catch (e) {
            this.agent.log(`[SkillManager] Error loading skills: ${e.message}`);
            this.cache = [];
        }
    }

    save() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.cache, null, 2));
        } catch (e) {
            this.agent.log(`[SkillManager] Error saving skills: ${e.message}`);
        }
    }

    /**
     * Search for a relevant skill for the given task
     * @param {string} task - User task description
     * @returns {object|null} - Parameterized plan or null
     */
    async findSkill(task) {
        // Simple keyword matching for now (Optimization: Use Vector Search later)
        // We ask the LLM to match the task to a skill ID and extract params
        if (this.cache.length === 0) return null;

        const skillsSummary = this.cache.map((s, i) => `${i}. ID: ${s.id} | Desc: ${s.description}`).join('\n');

        const prompt = `
        You are the Procedural Memory System.
        User Task: "${task}"

        AVAILABLE SKILLS:
        ${skillsSummary}

        INSTRUCTIONS:
        1. Determine if the task matches one of the skills EXACTLY (ignoring variable values).
        2. If yes, extract the variables.
        3. If no, return null.

        Example:
        Task: "Check AAPL price"
        Skill: "check_price" (Desc: Current price of {{asset}})
        Output: { "skillIndex": 0, "params": { "asset": "AAPL" } }

        Return JSON ONLY. If no match, return null.
        `;

        try {
            const response = await this.models.chat([{ role: 'user', content: prompt }]);
            const result = JSON.parse(this.models.cleanJson(response));

            if (result && typeof result.skillIndex === 'number' && this.cache[result.skillIndex]) {
                const skill = this.cache[result.skillIndex];
                this.agent.log(`[SkillManager] ⚡ Skill Hit: ${skill.id}`);
                const params = this.parameterizePlan(skill.plan, result.params);
                return { id: skill.id, plan: params };
            }
        } catch (e) {
            // Ignore errors, fall back to normal planning
        }
        return null;
    }

    parameterizePlan(templatePlan, params) {
        let planStr = JSON.stringify(templatePlan);
        for (const [key, value] of Object.entries(params)) {
            // Replace {{key}} with value
            planStr = planStr.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        const hydratedPlan = JSON.parse(planStr);

        // Usage fix: User might manually edit skills.json to be "flat" (without args wrapper).
        // We need to normalize it back to { type: "...", args: { ... } }
        return hydratedPlan.map(step => {
            if (step.args) return step; // Already correct

            // Extract 'type' and treating everything else as 'args'
            const { type, ...args } = step;
            return { type, args };
        });
    }

    /**
     * Learn a new skill from a successful execution
     * @param {string} task - Original user task
     * @param {Array} plan - The successful plan
     */
    async learnSkill(task, plan, result) {
        if (plan.length < 2) return; // Don't learn trivial 1-step tasks

        // Filter out failures
        const failureKeywords = ['failed', 'error', 'could not', 'cannot', 'unable', 'sorry'];
        if (typeof result === 'string' && failureKeywords.some(kw => result.toLowerCase().includes(kw))) {
            this.agent.log('[SkillManager] ⚠️ Skipping skill learning: Task appeared to fail.');
            return;
        }

        this.agent.log('[SkillManager] 🧠 Analyzing successful workflow for potential storage...');

        const prompt = `
        Analyze this successful task and plan. Can it be generalized into a reusable skill?

        Task: "${task}"
        Plan: ${JSON.stringify(plan)}

        INSTRUCTIONS:
        1. Identify the core "variables" in the task (e.g., "AAPL" -> {{asset}}).
        2. Replace those values in the plan with {{variable}}.
        3. Create a short ID and Description.
        4. Return JSON.

        Format:
        {
            "id": "check_asset_price",
            "description": "Checks price of an asset",
            "parameters": ["asset"],
            "plan": [ ... plan with {{asset}} ... ]
        }
        
        If it's too specific or one-off, return null.
        `;

        try {
            const response = await this.models.chat(
                [{ role: 'user', content: prompt }],
                { silent: true }  // Suppress [Models] logs during background analysis
            );
            const newSkill = JSON.parse(this.models.cleanJson(response));

            if (newSkill && newSkill.id && newSkill.plan) {

                // Sanitize: Truncate after first final_answer
                const sanitizedPlan = [];
                for (const step of newSkill.plan) {
                    sanitizedPlan.push(step);
                    if (step.type === 'final_answer') break;
                }
                newSkill.plan = sanitizedPlan;

                // Validate: Reject trivial 1-step final_answer skills
                if (newSkill.plan.length < 2 && newSkill.plan[0].type === 'final_answer') {
                    this.agent.log(`[SkillManager] ⚠️ Skill '${newSkill.id}' rejected: Trivial 1-step plan.`);
                    return;
                }

                // Check uniqueness (ID match)
                if (this.cache.some(s => s.id === newSkill.id)) {
                    this.agent.log(`[SkillManager] ⚠️ Skill '${newSkill.id}' already exists. Skipping.`);
                    return;
                }

                this.cache.push(newSkill);
                this.save();
                this.agent.log(`[SkillManager] 💾 Saved new skill: ${newSkill.id}`);
            }
        } catch (e) {
            // Analysis failed, ignore
        }
    }
}

module.exports = SkillManager;
