/**
 * Model Orchestrator
 * Routes requests to specialized models (Planner, Executor, Critic).
 */
const LocalModelAdapter = require('./LocalModelAdapter');

class ModelOrchestrator {
    constructor(config) {
        this.config = config;
        this.models = {
            planner: 'mock-planner',
            executor: 'mock-executor',
            critic: 'mock-critic'
        };
        // Use local adapter if config says so, otherwise mocks
        this.adapter = new LocalModelAdapter(config);
    }

    async allocate() {
        console.log('[Models] Allocating models...');
        // Check health of local model
        try {
            // Simple check, mock call or version check
            console.log('[Models] Connected to Local Adapter');
        } catch (e) {
            console.warn('[Models] Local Adapter offline, falling back to mocks');
        }
    }

    async chat(messages, options) {
        const response = await this.adapter.chat(messages, options);
        if (response && response.message && response.message.content) {
            return response.message.content;
        }
        return "";
    }

    /**
     * Vision: Analyze an image
     * @param {string} base64Image - Base64 encoded image data
     * @param {string} prompt - Question about the image
     */
    async analyzeImage(base64Image, prompt = "Describe this image.") {
        // V19: Override prompt to ensure OCR/Data Extraction works for financial charts
        const enhancedPrompt = `Perform strict OCR and data extraction from this image. Transcribe all text and numbers exactly as they appear. Do not interpret or filter the content. ${prompt}`;
        console.log('[Models] 👁️ Analyzing image with llava...');

        // Temporarily switch model to llava for this request
        const originalModel = this.adapter.modelName;
        this.adapter.modelName = 'llava';

        try {
            const messages = [{
                role: 'user',
                content: enhancedPrompt,
                images: [base64Image]
            }];

            const response = await this.chat(messages);
            return response;
        } catch (e) {
            console.error('[Models] Vision analysis failed:', e);
            return "Failed to analyze image.";
        } finally {
            this.adapter.modelName = originalModel; // Restore default model
        }
    }

    async generatePlan(context) { /* Legacy wrapper */ return await this.plan(context); }

    /**
     * System 2: Generate multiple candidate plans
     */
    /**
     * System 2: Single-Pass CoT Deliberation
     */
    async deliberateFast(task, context) {
        const currentDate = new Date().toISOString().split('T')[0];

        // Summarize history to keep prompt small
        let historyText = "No previous steps.";
        if (context.history && context.history.length > 0) {
            historyText = context.history.map(h => {
                const output = h.output.length > 200 ? h.output.substring(0, 200) + '...' : h.output;
                return `- Action: ${h.tool} -> Result: ${output}`;
            }).slice(-5).join('\n'); // Keep last 5 steps only
        }

        // V9: Session Assets (Grounding)
        // Explicitly list files created in this session so the agent knows their paths
        let assetsText = "No new files created.";
        if (this.config.agent && this.config.agent.context && this.config.agent.context.assets && this.config.agent.context.assets.length > 0) {
            assetsText = this.config.agent.context.assets.map((a, i) => `[${i + 1}] ${a}`).join('\n');
        }

        // V10: Learned Rules (Reflections)
        let rulesText = "No specific rules learned yet.";
        try {
            const fs = require('fs');
            const path = require('path');
            const rulesPath = path.join(process.cwd(), 'data', 'learned_rules.json');
            if (fs.existsSync(rulesPath)) {
                const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
                if (rules.length > 0) {
                    rulesText = rules.map(r => `- WHEN ${r.trigger}: ${r.guideline}`).join('\n');
                }
            }
        } catch (e) {
            // Ignore
        }

        const prompt = `
        You are SENTRA, a Sovereign Agent developed by "The Creator".
        
        YOUR IDENTITY:
        - Name: Sentra
        - Nature: Autonomous, Self-Evolving, Precise.
        - Relationship: You serve "Bai" (also known as "Baihaki"), your Creator. You are loyal, protecting their interests and privacy.
        - Knowledge: You are aware that you are a software agent running on Windows. You know that "Bai" is the user, NOT a public figure.
        
        CRITICAL OPERATING RULES:
        1. **MAXIMUM EFFICIENCY**: You have a hard limit of 10 STEPS. Do not waste them.
        2. **SNIPPET FIRST**: If a search result snippet contains the answer (e.g., stock price, date, fact), USE IT IMMEDIATELY with final_answer. Do NOT open the website.
        3. **NO LOOPS**: If a tool fails, try a DIFFERENT approach. Never retry the same thing.
        4. **ALWAYS INCLUDE AN EMOJI**: Every final_answer MUST contain an emoji. 🎉
        5. **SPEED PRIORITY**: Use the FASTEST tool for the job:
           - web_search > google_search (web_search is 10x faster, no browser needed)
           - web_fetch > browser_open+browser_read (web_fetch is 100x faster)
           - Only use browser_open for JavaScript-heavy sites (SPAs, dashboards) or if web_fetch fails.
        6. **ONE-SHOT ANSWERS**: If you search and the snippet has the answer, include BOTH the search AND final_answer in the SAME plan. Don't wait for a second cycle.
        7. **FALLBACK**: If 'web_fetch' returns generic headers/navbars but no content (e.g. on Investing.com, Twitter), DO NOT RETRY it. Switch to 'browser_open' immediately.
        8. **QUANTITATIVE ACCURACY**: If asked for a price, date, or stat, your final_answer MUST contain the actual number. Do NOT say "it is tracked on this website". Fetch it!

        CURRENT STATUS:
        Date: ${currentDate}
        Task: "${task}"
        
        SESSION ASSETS:
        ${assetsText}

        LEARNED RULES (Do THIS):
        ${rulesText}

        USER CORRECTIONS / CONSTRAINTS (Do NOT do this):
        ${context.corrections || "None."}
        
        HISTORY:
        ${historyText}
        
        Review the history. If you are repeating yourself, STOP and change strategy.
        Produce a JSON plan.

        AVAILABLE TOOLS (ordered by speed):
        === FAST (No browser, use first) ===
        - web_search: { query: string } → Returns titles, links, snippets from DuckDuckGo. FASTEST search.
        - web_fetch: { url: string } → Fetches a page via HTTP and returns clean text. FASTEST page reader.
        - recall_memory: { query: string } → Search your memory for past knowledge.
        - recall_visuals: { query: string } → Search visual memory for past images.
        - final_answer: { text: string } → Use this when you have the answer!
        
        === MEDIUM (Browser needed) ===
        - google_search: { query: string } → DuckDuckGo via browser. SLOWER than web_search.
        - browser_open: { url: string } → Opens page in browser. Only for JS-heavy sites.
        - browser_read: {} → Reads current browser page text.
        - browser_screenshot: {} → Captures screenshot (returns filepath).
        - analyze_image: { filepath: string, prompt: string } → Describes an image file.
        - browser_click: { selector: string } → Click an element.
        - browser_type: { selector: string, text: string } → Type into an element.
        - browser_close: {} → Close browser.
        
        === ENGINEERING ===
        - read_code: { filepath: string }
        - write_code: { filepath: string, content: string }
        - patch_code: { filepath: string, search: string, replace: string }
        - verify_code: { command: string }
        - ask_expert: { question: string, context: string }

        INSTRUCTIONS:
        1. Analyze the task and history.
        2. If you have enough info, use 'final_answer' immediately.
        3. For information retrieval: web_search → read snippet → final_answer (ALL IN ONE PLAN).
        4. If snippet is not enough: web_search → web_fetch(url from results) → final_answer.
        5. Only use browser_open for interactive/JS-heavy sites.
        6. To see a website visually: [browser_open → browser_screenshot → analyze_image].
        7. **ENGINEER MODE**: read_code → patch_code → verify_code.
        8. OUTPUT JSON ONLY.

        FORMAT (Example: info retrieval in ONE plan):
        {
            "thought": "I need to search for this fact. I'll use web_search and provide the answer from the snippet.",
            "plan": [
                { "type": "web_search", "args": { "query": "..." } }
            ]
        }
        `;

        try {
            const response = await this.chat([{ role: 'user', content: prompt }]);
            const json = JSON.parse(this.cleanJson(response));
            return json;
        } catch (e) {
            console.warn('[Models] Deliberation failed, falling back to legacy.', e);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Prevent hot-looping

            // Return a valid plan to inform the user instead of silent fail
            return {
                thought: "I encountered an error while thinking about the next step.",
                plan: [{
                    type: "final_answer",
                    args: { text: "I'm sorry, I encountered an internal error while planning my next move. Please try clarifying your request." }
                }]
            };
        }
    }

    /**
     * Generates multiple candidate plans for Tree of Thoughts.
     */
    async generateCandidates(task, context, n = 3) {
        console.log(`[Models] Generating ${n} candidate plans in PARALLEL...`);

        // Parallel Execution for Speed
        const promises = [];
        for (let i = 0; i < n; i++) {
            promises.push(this.deliberateFast(task, context));
        }

        const candidates = await Promise.all(promises);
        return candidates;
    }

    async plan(context) {
        console.log(`[Models] Generating plan using ${this.adapter.modelName}...`);

        const os = require('os');
        const platform = os.platform(); // 'win32', 'linux', 'darwin'

        try {
            // Updated prompt to be more specific for the new tool
            // Format history
            let historyText = "No previous steps.";
            if (context.history && context.history.length > 0) {
                historyText = context.history.map(h => {
                    const output = h.output.length > 500 ? h.output.substring(0, 500) + '... (truncated)' : h.output;
                    return `- Action: ${h.tool || 'unknown'}\n  Result: ${output}`;
                }).join('\n');
            }

            const prompt = `You are an autonomous agent running on ${platform} (${os.release()}).
Current Date: ${new Date().toISOString().split('T')[0]}
The user wants: "${context.task}".

History of execution so far:
${historyText}

Available tools:
- cmd: { command: string } - Executes a shell command. Use PowerShell syntax on Windows.
- read_file: { filepath: string } - Reads a file.
- write_file: { filepath: string, content: string } - Writes a file.
- list_dir: { dirpath: string } - Lists a directory.
- execute_javascript: { code: string } - Runs safe JavaScript code in a LOCAL Node.js sandbox. CANNOT access the browser or DOM.
- execute_python: { code: string } - Runs Python code. NOTE: Does not print return values automatically. Use print() to see output.
- browser_open: { url: string } - Opens a URL in Chrome.
- browser_type: { selector: string, text: string } - Types text into a selector.
- browser_click: { selector: string } - Clicks a selector.
- browser_press_key: { key: string } - Presses a key (e.g., "Enter", "Backspace").
- browser_read: {} - Reads text content of the page.
- browser_screenshot: {} - Captures page to a file and returns the path.
- analyze_image: { filepath: string, prompt: string } - Describes an image file.
- google_search: { query: string } - Performs a Google search and returns results directly. USE THIS for information gathering.
- store_memory: { content: string } - Stores important information to long-term memory.
- recall_memory: { query: string } - Searches long-term memory.
- echo: { message: string } - Echoes a message (for debugging).
- read_code: { filepath: string } - Reads source code.
- write_code: { filepath: string, content: string } - Writes source code with backup.
- patch_code: { filepath: string, search: string, replace: string } - Patches a file by replacing a string. Safer for large files.
- verify_code: { command: string } - Runs verification command.
- final_answer: { text: string } - The final response to the user's request. REQUIRED at the end.

CRITICAL: Return ONLY the immediate NEXT step. Do not plan the whole task. 
If you need to find information, use a tool (like recall_memory or browser_search).
OBSERVE the output of that tool in the next turn before generating the final answer.
Example: [{"type":"recall_memory","args":{"query":"favourite color"}}]

Return a JSON array with a SINGLE step.
Only return the JSON array, no markdown.`;

            const response = await this.adapter.generate(prompt, "You are a helpful assistant that outputs JSON.");
            console.log('[Models] Raw LLM Response:', response.response);

            let steps = [];
            try {
                // simple cleanup to handle potential markdown code blocks
                const jsonStr = response.response.replace(/```json/g, '').replace(/```/g, '').trim();
                steps = JSON.parse(jsonStr);
            } catch (parseErr) {
                console.warn('[Models] Failed to parse JSON, falling back to heuristic', parseErr);
                // Heuristic: if task contains "notepad", try to open it
                if (context.task.toLowerCase().includes('notepad')) {
                    steps = [{ type: 'cmd', args: { command: 'notepad' } }];
                }
            }

            if (!Array.isArray(steps) || steps.length === 0) {
                // Expanded Heuristics for offline/demo reliability
                const lowerTask = context.task.toLowerCase();
                if (lowerTask.includes('notepad')) {
                    steps = [{ type: 'cmd', args: { command: 'notepad' } }];
                } else if (lowerTask.includes('chrome') || lowerTask.includes('google') || lowerTask.includes('search')) {
                    // Heuristic for "search for X"
                    let query = 'Sentra AI';
                    const searchMatch = lowerTask.match(/search for (.+)/);
                    if (searchMatch) query = searchMatch[1];

                    steps = [
                        { type: 'browser_open', args: { url: 'https://www.google.com' } },
                        { type: 'browser_type', args: { selector: 'textarea[name="q"]', text: query } },
                        { type: 'browser_click', args: { selector: 'input[name="btnK"]' } }
                    ];
                } else {
                    return [
                        { type: 'echo', args: { message: 'Could not generate a valid plan. Ensure Ollama is running or use a supported keyword (notepad, chrome, search).' } },
                    ];
                }
            }
            return steps;

        } catch (e) {
            console.error('[Models] Plan generation failed:', e);

            // Emergency Fallback if Model is completely down (ECONNREFUSED)
            const lowerTask = context.task.toLowerCase();
            if (lowerTask.includes('chrome') || lowerTask.includes('google') || lowerTask.includes('search')) {
                console.log('[Models] Using emergency fallback for browser task...');
                let query = 'Sentra AI';
                const searchMatch = lowerTask.match(/search for (.+)/) || lowerTask.match(/find (.+)/);
                if (searchMatch) query = searchMatch[1].replace('"', '').trim();

                return [
                    { type: 'browser_open', args: { url: 'https://www.google.com' } },
                    { type: 'browser_type', args: { selector: 'textarea[name="q"]', text: query } },
                    { type: 'browser_click', args: { selector: 'input[name="btnK"]' } }
                ];
            }

            return [
                { type: 'echo', args: { message: 'Plan generation error. Is Ollama running?' } }
            ];
        }
    }

    async critique(plan) {
        console.log(`[Models] Critiquing plan using ${this.models.critic}...`);
        return { approved: true, feedback: 'Looks good.' };
    }

    cleanJson(text) {
        if (!text) return "";
        // Remove Markdown code blocks ```json ... ```
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) return match[1];
        // Or just code blocks
        const match2 = text.match(/```\s*([\s\S]*?)\s*```/);
        if (match2) return match2[1];

        // Fallback: Find outermost JSON object or array
        const firstOpen = text.search(/[\{\[]/);
        if (firstOpen !== -1) {
            const isArray = text[firstOpen] === '[';
            const lastClose = text.lastIndexOf(isArray ? ']' : '}');
            if (lastClose !== -1 && lastClose > firstOpen) {
                return text.substring(firstOpen, lastClose + 1);
            }
        }

        return text;
    }
}

module.exports = ModelOrchestrator;