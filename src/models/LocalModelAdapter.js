const http = require('http');

/**
 * Local Model Adapter
 * Connects to local inference server (default: Ollama).
 */
class LocalModelAdapter {
    constructor(config) {
        this.config = config || {};
        this.baseUrl = this.config.baseUrl || 'http://localhost:11434';
        this.modelName = this.config.modelName || 'qwen3:8b'; // Updated default
    }

    async ensureConnection() {
        if (this.isConnected) return;
        try {
            await this.post('/api/tags', {}); // Simple ping
            this.isConnected = true;
        } catch (e) {
            console.log('[Models] Ollama not running. Attempting to start...');
            await this.spawnOllama();
        }
    }

    async spawnOllama() {
        const { spawn } = require('child_process');
        console.log(`[Models] Spawning "ollama run ${this.modelName}"...`);

        // spawn 'ollama run qwen3:8b' in detached mode
        // windowsHide: true helps on Windows to avoid popping a window
        // We set shell: false to avoid extra cmd window, assuming ollama is in PATH
        const ollama = spawn('ollama', ['run', this.modelName], {
            stdio: 'ignore',
            detached: true,
            shell: false,
            windowsHide: true
        });

        ollama.unref(); // Let it run independently

        // Wait a bit for it to come up
        // In a perfect world we would ping it until ready, but sleep is fine for now
        console.log('[Models] Awakening the neural engine (10s)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        this.isConnected = true;
    }

    async generate(prompt, systemPrompt) {
        await this.ensureConnection();
        const payload = {
            model: this.modelName,
            prompt: prompt,
            system: systemPrompt,
            stream: false
        };

        return this.post('/api/generate', payload);
    }

    async chat(messages) {
        await this.ensureConnection();
        const payload = {
            model: this.modelName,
            messages: messages,
            stream: false
        };

        return this.post('/api/chat', payload);
    }

    post(endpoint, data) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const start = Date.now();
            console.log(`[Models] 🧠 Sending request to ${this.modelName}...`);

            // Heartbeat to let user know we are still alive
            const heartbeat = setInterval(() => {
                const elapsed = ((Date.now() - start) / 1000).toFixed(1);
                console.log(`[Models] ... still thinking (${elapsed}s) ...`);
            }, 5000); // Log every 5 seconds

            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    clearInterval(heartbeat);
                    const duration = ((Date.now() - start) / 1000).toFixed(2);
                    console.log(`[Models] 💡 Response received in ${duration}s`);

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(new Error(`Failed to parse JSON response: ${e.message}`));
                        }
                    } else {
                        reject(new Error(`Request failed with status ${res.statusCode}: ${body}`));
                    }
                });
            });

            req.on('error', (err) => {
                clearInterval(heartbeat);
                reject(err);
            });

            req.write(JSON.stringify(data));
            req.end();
        });
    }
}

module.exports = LocalModelAdapter;
