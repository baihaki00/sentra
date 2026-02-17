const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Reinforcement Manager (Episodic Learning)
 * Handles negative feedback ("Wrong") and stores it as "Anti-Patterns"
 * to be avoided in future tasks.
 */
class ReinforcementManager {
    constructor(agent) {
        this.agent = agent;
        this.dbPath = path.join(process.cwd(), 'data', 'corrections.json');
        this.corrections = [];
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.corrections = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            }
        } catch (e) {
            this.agent.log(`[Reinforcement] Error loading corrections: ${e.message}`);
            this.corrections = [];
        }
    }

    save() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.corrections, null, 2));
        } catch (e) {
            this.agent.log(`[Reinforcement] Error saving corrections: ${e.message}`);
        }
    }

    /**
     * Check if user input indicates a correction
     * @param {string} input - User input
     * @returns {boolean}
     */
    isCorrection(input) {
        const triggers = ['wrong', 'incorrect', 'bad', 'don\'t', 'do not', 'stop', 'failed', 'mistake'];
        const lowered = input.toLowerCase();
        return triggers.some(t => lowered.includes(t)) && input.length < 200; // Simple heuristic
    }

    /**
     * Process a correction from the user
     * @param {string} input - The user's correction text
     * @param {string} lastTask - The task that was just performed
     */
    async train(input, lastTask) {
        this.agent.log('[Reinforcement] 🛑 Correction detected. Analyzing...');

        // Ask LLM to extract the specific rule
        const prompt = `
        User Correction: "${input}"
        Original Task: "${lastTask}"

        Extract a concise "Anti-Pattern" or "Constraint" from this correction.
        What should the agent AVOID doing in the future for similar tasks?
        
        Format: "When [Context], do not [Action]. Instead, [alternative]."
        Example: "When checking stocks, do not use browser_open. Instead, use search snippets."
        
        Return JUST the rule string.
        `;

        try {
            const rule = await this.agent.components.models.chat([{ role: 'user', content: prompt }]);

            const correction = {
                id: uuidv4(),
                timestamp: Date.now(),
                task: lastTask,
                feedback: input,
                rule: rule.trim()
            };

            this.corrections.push(correction);
            this.save();
            this.agent.log(`[Reinforcement] 🧠 Learned Constraint: "${correction.rule}"`);
            return correction.rule;

        } catch (e) {
            this.agent.log(`[Reinforcement] Failed to extract rule: ${e.message}`);
        }
    }

    /**
     * Retrieve relevant corrections for a new task
     * @param {string} task 
     * @returns {string} - Combined rules to inject into prompt
     */
    getRelevantCorrections(task) {
        // Simple keyword matching for now (Upgrade to Vector Search later)
        // Check if the new task shares keywords with the original failing task
        const relevant = this.corrections.filter(c => {
            const taskWords = c.task.toLowerCase().split(' ');
            return taskWords.some(w => task.toLowerCase().includes(w) && w.length > 3);
        });

        if (relevant.length === 0) return '';

        return relevant.map(c => `- 🛑 ${c.rule}`).join('\n');
    }
}

module.exports = ReinforcementManager;
