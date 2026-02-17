const Reflex = require('./Reflex');

/**
 * THALAMUS (Layer 3)
 * Biological Analog: Thalamus (Sensory Relay)
 * Function: Routes input to the appropriate cognitive layer.
 * 
 * Layers:
 * 1. Reflex (Spinal) - strict patterns, <10ms
 * 2. Limbic (Safety/Cache) - [Planned Phase 2]
 * 3. Neocortex (LLM) - deep thought, >5s
 */
class Thalamus {
    constructor(agent) {
        this.agent = agent;
        this.reflex = new Reflex(agent);
    }

    /**
     * Route the task to the best layer.
     * @param {string} task 
     * @returns {object} { handled: boolean, result: any, layer: string }
     */
    async route(task) {
        // 1. Check Reflex Layer
        const reflexResult = this.reflex.process(task);
        if (reflexResult !== null) {
            this.agent.log(`[Thalamus] ⚡ Routed to REFLEX Layer. Result: ${reflexResult}`);
            return { handled: true, result: reflexResult, layer: 'REFLEX' };
        }

        // 2. Check Limbic Layer (Semantic Cache)
        if (this.agent.components.limbic) {
            const cacheResult = await this.agent.components.limbic.process(task);
            if (cacheResult !== null) {
                this.agent.log(`[Thalamus] 🧠 Cached Thought Retrieved from LIMBIC Layer.`);
                return { handled: true, result: cacheResult, layer: 'LIMBIC' };
            }
        }

        // 3. Check Cerebellum (Procedural Skills)
        if (this.agent.components.skills) {
            // We use 'findSkill' which returns { skill, confidence }
            const skillMatch = await this.agent.components.skills.findSkill(task);
            if (skillMatch && skillMatch.confidence > 0.85) {
                this.agent.log(`[Thalamus] 🦾 Skill Recognized: "${skillMatch.skill.id}" (${skillMatch.confidence})`);
                // We return the skill itself as the result, OR we let the agent execute it?
                // For Hydra architecture, we want the Agent to execute the skill plan.
                return { handled: true, result: skillMatch, layer: 'CEREBELLUM' };
            }
        }

        // 4. Default to Neocortex (Pipeline)
        this.agent.log(`[Thalamus] 🧠 Routing to NEOCORTEX (LLM)...`);
        return { handled: false, layer: 'CORTEX' };
    }
}

module.exports = Thalamus;
