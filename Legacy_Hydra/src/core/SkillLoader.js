const fs = require('fs');
const path = require('path');

class SkillLoader {
    constructor(toolSandbox) {
        this.toolSandbox = toolSandbox;
        this.skillsPath = path.join(__dirname, '../skills');
    }

    async loadSkills() {
        console.log('[SkillLoader] Loading skills...');

        if (!fs.existsSync(this.skillsPath)) {
            console.log('[SkillLoader] No skills directory found. Creating one...');
            fs.mkdirSync(this.skillsPath);
            return;
        }

        const skillDirs = fs.readdirSync(this.skillsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const skillDir of skillDirs) {
            try {
                const skillModulePath = path.join(this.skillsPath, skillDir, 'index.js');
                if (!fs.existsSync(skillModulePath)) {
                    console.warn(`[SkillLoader] Skipping ${skillDir}: index.js not found.`);
                    continue;
                }

                const skill = require(skillModulePath);
                this.registerSkill(skill);
                console.log(`[SkillLoader] Loaded skill: ${skill.name || skillDir}`);
            } catch (error) {
                console.error(`[SkillLoader] Failed to load skill ${skillDir}:`, error.message);
            }
        }
    }

    registerSkill(skill) {
        if (!skill.tools) return;

        for (const [toolName, toolConfig] of Object.entries(skill.tools)) {
            // toolConfig should have: handler, description, parameters (schema)
            // The ToolSandbox.register signature is: register(name, handler, schema)

            this.toolSandbox.register(
                toolName,
                toolConfig.handler,
                {
                    description: toolConfig.description,
                    parameters: toolConfig.parameters
                }
            );
        }
    }
}

module.exports = SkillLoader;
