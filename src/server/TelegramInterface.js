const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

class TelegramInterface {
    constructor(agent) {
        this.agent = agent;
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        // Robustly parse param: remove "Id:", spaces, etc.
        this.allowedChatId = process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID.replace(/[^0-9]/g, '') : null;
        this.bot = null;
        this.logBuffer = [];
        this.flushInterval = null;
    }

    async start() {
        if (!this.token) {
            console.warn('[Telegram] No token provided. Skipping Telegram interface.');
            return;
        }

        console.log('[Telegram] Starting bot...');
        this.bot = new TelegramBot(this.token, { polling: true });

        // Log Streaming
        this.agent.on('log', (message) => {
            if (this.allowedChatId) {
                this.logBuffer.push(message);
            }
        });

        this.flushInterval = setInterval(() => this.flushLogs(), 2000);

        // Authentication Middleware
        this.bot.on('message', (msg) => {
            console.log(`[Telegram] Received message: "${msg.text}" from ${msg.chat.id}`);

            if (this.allowedChatId && msg.chat.id.toString() !== this.allowedChatId.toString()) {
                console.warn(`[Telegram] Unauthorized access attempt.`);
                console.warn(`[Debug] Expected: '${this.allowedChatId}'`);
                console.warn(`[Debug] Received: '${msg.chat.id}'`);
                return;
            }
        });

        // /start
        this.bot.onText(/\/start/, (msg) => {
            if (!this.checkAuth(msg)) return;
            this.bot.sendMessage(msg.chat.id,
                "👋 *Sentra Online.*\n\n" +
                "I am your local agent. Models loaded. Memory active.\n\n" +
                "**Commands:**\n" +
                "`/do <task>` - Execute a task\n" +
                "`/status` - System status\n" +
                "`/stop` - Stop current task",
                { parse_mode: 'Markdown' }
            );
        });

        // /stop
        this.bot.onText(/\/stop/, (msg) => {
            if (!this.checkAuth(msg)) return;
            if (this.agent.state === 'IDLE') {
                this.bot.sendMessage(msg.chat.id, "💤 Agent is already idle.");
            } else {
                this.agent.stop();
                this.bot.sendMessage(msg.chat.id, "🛑 **Stopping...**");
            }
        });

        // /status
        this.bot.onText(/\/status/, (msg) => {
            if (!this.checkAuth(msg)) return;
            const state = this.agent.state;
            const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            this.bot.sendMessage(msg.chat.id,
                `🖥️ *System Status*\n\n` +
                `**State:** ${state}\n` +
                `**Memory:** ${memUsage.toFixed(2)} MB\n` +
                `**Uptime:** ${process.uptime().toFixed(0)}s`,
                { parse_mode: 'Markdown' }
            );
        });

        // /do <task>
        this.bot.onText(/\/do (.+)/, async (msg, match) => {
            if (!this.checkAuth(msg)) return;

            const task = match[1];
            const chatId = msg.chat.id;

            if (this.agent.state !== 'IDLE') {
                this.bot.sendMessage(chatId, "⚠️ **Busy:** I am already working on a task.");
                return;
            }

            this.bot.sendMessage(chatId, `🧠 **Thinking:** "${task}"...`);

            try {
                // Hook into agent logs? 
                // For now, just wait for result.
                const result = await this.agent.startTask(task);

                this.bot.sendMessage(chatId, `✅ **Task Complete**\n\n${result}`, { parse_mode: 'Markdown' });

            } catch (error) {
                this.bot.sendMessage(chatId, `❌ **Error:** ${error.message}`);
            }
        });

        // Catch-all for non-commands
        this.bot.on('message', (msg) => {
            if (!this.checkAuth(msg)) return;
            if (msg.text && !msg.text.startsWith('/')) {
                this.bot.sendMessage(msg.chat.id, "❓ I don't understand. Use `/do <task>` to give me work, or `/start` for help.");
            }
        });

        console.log('[Telegram] Bot is polling.');
    }

    checkAuth(msg) {
        if (this.allowedChatId && msg.chat.id.toString() !== this.allowedChatId.toString()) {
            return false;
        }
        return true;
    }

    async stop() {
        if (this.flushInterval) clearInterval(this.flushInterval);
        if (this.bot) {
            await this.bot.stopPolling();
        }
    }

    async flushLogs() {
        if (this.logBuffer.length === 0 || !this.allowedChatId) return;

        const logs = this.logBuffer.join('\n');
        this.logBuffer = []; // Clear immediately

        // Telegram limit is 4096. Truncate if huge.
        const message = logs.length > 4000 ? logs.substring(0, 4000) + '\n...(truncated)' : logs;

        try {
            // Send as code block for better formatting
            // Using a distinct visual style for logs
            await this.bot.sendMessage(this.allowedChatId, `\`\`\`\n${message}\n\`\`\``, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('[Telegram] Failed to send logs:', error.message);
        }
    }
}

module.exports = TelegramInterface;
