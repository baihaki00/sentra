const fs = require('fs');
const path = require('path');
const ModelOrchestrator = require('../models/ModelOrchestrator');

/**
 * Reflector (The "Subconscious")
 * Analyzes session logs during idle time to learn from mistakes and successes.
 */
class Reflector {
    constructor(agent) {
        this.agent = agent;
        this.models = new ModelOrchestrator(agent.config);
        this.logFile = path.join(process.cwd(), 'data', 'session.log');
        this.rulesFile = path.join(process.cwd(), 'data', 'learned_rules.json');
    }

    async reflect() {
        this.agent.log('[Reflector] 🌙 Entering Dream Cycle (Reflection)...');

        // 1. Read recent logs
        if (!fs.existsSync(this.logFile)) {
            this.agent.log('[Reflector] No logs to reflect on.');
            return;
        }
        const logs = fs.readFileSync(this.logFile, 'utf8');
        const lines = logs.split('\n').filter(l => l.trim().length > 0);

        // Only look at the last 100 lines to keep context small
        const recentLogs = lines.slice(-100).join('\n');

        // 2. Ask LLM to extract lessons
        const prompt = `
        You are the "Reflector" module of an AI agent. 
        Your job is to analyze the execution logs and extract GENERAL RULES to improve future performance.

        LOGS:
        ${recentLogs}

        INSTRUCTIONS:
        1. Look for "ACT ERROR" or repeated failed attempts.
        2. Look for successful patterns that should be reinforced.
        3. Generate a JSON array of "Rules".
        4. Each rule must have a "trigger" (keywords) and a "guideline" (what to do).

        Example:
        [
            { "trigger": "browser_open", "guideline": "If network yields 403, try user-agent spoofing." },
            { "trigger": "file_not_found", "guideline": "Always use list_dir to verify files before reading." }
        ]

        Return JSON ONLY.
        `;

        try {
            // We use the orchestration layer directly
            // Note: In real production, we'd use a cheaper model here
            const response = await this.models.chat([{ role: 'user', content: prompt }]);
            const safeJson = this.models.cleanJson(response);
            const newRules = JSON.parse(safeJson);

            if (Array.isArray(newRules) && newRules.length > 0) {
                this.mergeRules(newRules);
                this.agent.log(`[Reflector] ✨ Learned ${newRules.length} new rules.`);
            } else {
                this.agent.log('[Reflector] No new lessons learned this time.');
            }

        } catch (e) {
            this.agent.log(`[Reflector] Nightmare (Error): ${e.message}`);
        }
    }

    mergeRules(newRules) {
        let existingRules = [];
        if (fs.existsSync(this.rulesFile)) {
            try {
                existingRules = JSON.parse(fs.readFileSync(this.rulesFile, 'utf8'));
            } catch (e) {
                existingRules = [];
            }
        }

        // Simple merge: Append unique guidelines
        // In a real system, we'd do semantic deduplication
        for (const rule of newRules) {
            const exists = existingRules.find(r => r.guideline === rule.guideline);
            if (!exists) {
                existingRules.push({
                    ...rule,
                    timestamp: new Date().toISOString()
                });
            }
        }

        fs.writeFileSync(this.rulesFile, JSON.stringify(existingRules, null, 2));
    }
}

module.exports = Reflector;
