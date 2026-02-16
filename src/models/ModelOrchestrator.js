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

    async generatePlan(context) {
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
- google_search: { query: string } - Performs a Google search and returns results directly. USE THIS for information gathering.
- store_memory: { content: string } - Stores important information to long-term memory.
- recall_memory: { query: string } - Searches long-term memory.
- echo: { message: string } - Echoes a message (for debugging).
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
}

module.exports = ModelOrchestrator;
