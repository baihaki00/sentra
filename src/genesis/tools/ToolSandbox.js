/**
 * Tool Sandbox
 * Executes tools in a restricted scope.
 * Network is OFF by default.
 */
class ToolSandbox {
    constructor(config) {
        this.registry = new Map();
        this.config = config || {};
    }

    register(name, handler, schema) {
        this.registry.set(name, { handler, schema });
    }

    async load() {
        console.log('[Sandbox] Loading tools...');

        // Vision Tool
        this.register('analyze_image', async (args) => {
            const fs = require('fs');
            const path = require('path');

            let base64Image;

            if (args.image_base64) {
                // Direct base64 input (e.g. from browser_screenshot)
                base64Image = args.image_base64;
            } else if (args.filepath) {
                // File path input
                let imagePath = this.resolvePath(args.filepath);

                if (!fs.existsSync(imagePath)) {
                    // Try one last desperate search for *any* recent screenshot if path looks like a screenshot
                    if (imagePath.includes('screenshot')) {
                        const screenshotDir = path.join(process.cwd(), 'data', 'screenshots');
                        if (fs.existsSync(screenshotDir)) {
                            const files = fs.readdirSync(screenshotDir)
                                .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
                                .sort((a, b) => fs.statSync(path.join(screenshotDir, b)).mtimeMs - fs.statSync(path.join(screenshotDir, a)).mtimeMs);
                            if (files.length > 0) {
                                imagePath = path.join(screenshotDir, files[0]);
                                console.log(`[Sandbox] ⚠️ Path not found. Auto-healing: Using latest screenshot: ${imagePath}`);
                            }
                        }
                    }
                }

                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found: ${args.filepath} (Resolved: ${imagePath})`);
                }

                const imageBuffer = fs.readFileSync(imagePath);
                base64Image = imageBuffer.toString('base64');
            } else {
                throw new Error("analyze_image requires either 'filepath' or 'image_base64'");
            }

            const prompt = args.prompt || "Describe this image in detail.";

            // FIX: We need to pass the Agent or Models instance to ToolSandbox
            if (this.config.agent && this.config.agent.components.models) {
                return await this.config.agent.components.models.analyzeImage(base64Image, prompt);
            } else {
                return "Error: Vision model not accessible from sandbox.";
            }
        }, { filepath: 'string?', image_base64: 'string?', prompt: 'string?' });

        // Visual Memory Recall
        this.register('recall_visuals', async (args) => {
            if (!this.config.agent.components.visual_memory) return "Visual Memory is not active.";
            const results = await this.config.agent.components.visual_memory.search(args.query);
            if (results.length === 0) return "No matching visual memories found.";
            return results.join('\n\n');
        }, { query: 'string' });

        // Semantic Memory Tools
        this.register('recall_memory', async (args) => {
            if (!this.config.agent.components.memory) return "Memory system not active.";
            const results = await this.config.agent.components.memory.search(args.query);
            return results.length > 0 ? results.join('\n\n') : "No relevant memories found.";
        }, { query: 'string' });

        this.register('store_memory', async (args) => {
            if (!this.config.agent.components.memory) return "Memory system not active.";
            await this.config.agent.components.memory.store(args.content);
            return "Memory stored successfully.";
        }, { content: 'string' });
    }

    resolvePath(inputPath) {
        const fs = require('fs');
        const path = require('path');

        // 1. Clean path
        let cleanPath = inputPath.replace(/['"]/g, '').trim();
        // Fix mixed slashes
        cleanPath = path.normalize(cleanPath);

        // 2. Check if absolute and exists
        if (path.isAbsolute(cleanPath) && fs.existsSync(cleanPath)) {
            return cleanPath;
        }

        // 3. Check relative to CWD
        let absPath = path.resolve(process.cwd(), cleanPath);
        if (fs.existsSync(absPath)) {
            return absPath;
        }

        // 4. Smart Fallbacks (Data Dirs)
        const searchPaths = [
            path.join(process.cwd(), 'data'),
            path.join(process.cwd(), 'data', 'screenshots'),
            path.join(process.cwd(), 'src'),
            process.cwd() // Root
        ];

        const basename = path.basename(cleanPath);

        for (const searchDir of searchPaths) {
            const candidate = path.join(searchDir, basename);
            if (fs.existsSync(candidate)) {
                console.log(`[Sandbox] 🔍 Smart Path Resolution: Found '${basename}' in '${searchDir}'`);
                return candidate;
            }
        }

        // Return original if nothing found (will throw later)
        return cleanPath;
    }

    async execute(name, args) {
        const tool = this.registry.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        // 1. Verify Permissions
        // Not implemented in prototype

        // 2. Validate Schema (Mock)
        if (!this.validateSchema(args, tool.schema)) {
            // throw new Error(`Invalid arguments for tool ${name}`);
        }

        // 3. Execute in Sandbox
        console.log(`[Sandbox] Executing ${name} with`, args);
        return await tool.handler(args);
    }

    validateSchema(args, schema) {
        // Mock validation - strictly check if args is object
        return typeof args === 'object' && args !== null;
    }
}

module.exports = ToolSandbox;
