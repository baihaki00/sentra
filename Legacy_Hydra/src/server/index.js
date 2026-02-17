const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocketHelper = require('./socket');
const chalk = require('chalk');

class ProjectMirror {
    constructor(agent, port = 3000) {
        this.agent = agent;
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocketHelper(this.server, agent);

        this.setupRoutes();
    }

    setupRoutes() {
        // Serve static dashboard
        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
            this.createDefaultDashboard(publicDir);
        }

        this.app.use(express.static(publicDir));
        this.app.use(express.json());

        // API: Get Agent State
        this.app.get('/api/state', (req, res) => {
            res.json({
                state: this.agent.state,
                task: this.agent.context.task || 'Idle',
                uptime: process.uptime()
            });
        });

        // API: Get Recent Logs
        this.app.get('/api/logs', (req, res) => {
            const logFile = path.join(process.cwd(), 'data', 'session.log');
            if (fs.existsSync(logFile)) {
                // Read last 50 lines for efficiency
                // This is a naive implementation; production would use tail-stream
                const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).slice(-50);
                res.json(logs);
            } else {
                res.json([]);
            }
        });

        // API: Control Agent
        this.app.post('/api/control', (req, res) => {
            const { action, payload } = req.body;
            this.agent.log(`[Mirror] Control Action Received: ${action}`);

            if (action === 'stop') {
                this.agent.stop();
                res.json({ success: true, message: 'Stop signal sent.' });
            } else if (action === 'start') {
                // Start a new task
                if (payload) {
                    this.agent.startTask(payload).catch(e => console.error(e));
                    res.json({ success: true, message: 'Task started.' });
                } else {
                    res.status(400).json({ error: 'Payload required for start task.' });
                }
            } else {
                res.status(400).json({ error: 'Unknown action' });
            }
        });
    }

    createDefaultDashboard(publicDir) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentra | Project Mirror</title>
    <style>
        :root { --bg: #0f172a; --text: #e2e8f0; --accent: #06b6d4; --panel: #1e293b; }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', monospace; margin: 0; padding: 20px; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 1.5rem; color: var(--accent); }
        .grid { display: grid; grid-template-columns: 250px 1fr 300px; gap: 20px; flex: 1; overflow: hidden; }
        .panel { background: var(--panel); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; border: 1px solid #334155; }
        .panel-header { font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px; color: #94a3b8; }
        #logs { flex: 1; overflow-y: auto; font-family: 'Consolas', monospace; font-size: 0.9rem; white-space: pre-wrap; word-break: break-all; }
        .log-entry { margin-bottom: 5px; opacity: 0.9; }
        .log-timestamp { color: #64748b; font-size: 0.8rem; margin-right: 10px; }
        .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; margin-right: 10px; }
        .status-idle { background: #94a3b8; }
        .status-thinking { background: #f59e0b; animation: pulse 1s infinite; }
        .status-working { background: #06b6d4; }
        .status-error { background: #ef4444; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        button { background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { opacity: 0.9; }
        button.stop { background: #ef4444; }
        input { background: #0f172a; border: 1px solid #334155; color: white; padding: 8px; border-radius: 4px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
        #thoughts { color: #f59e0b; font-style: italic; }
    </style>
</head>
<body>
    <header>
        <div style="display:flex; align-items:center">
            <div id="status-dot" class="status-indicator status-idle"></div>
            <h1>SENTRA <span style="font-size:0.8rem; color:#64748b; font-weight:normal">Project Mirror</span></h1>
        </div>
        <div id="connection-status" style="font-size:0.8rem; color:#64748b">Connecting...</div>
    </header>

    <div class="grid">
        <div class="panel">
            <div class="panel-header">CONTROLS</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <input type="text" id="task-input" placeholder="Enter new task..." />
                <button onclick="startTask()">EXECUTE TASK</button>
                <div style="height:20px"></div>
                <button class="stop" onclick="stopAgent()">EMERGENCY STOP</button>
            </div>
            <div style="margin-top:auto">
                <div class="panel-header" style="margin-top:20px">STATS</div>
                <div style="font-size:0.9rem; line-height:1.6">
                    <div>State: <span id="agent-state" style="color:var(--accent)">IDLE</span></div>
                    <div>Uptime: <span id="uptime">0s</span></div>
                    <div>Memory: <span id="mem-usage">-- MB</span></div>
                </div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">LIVE LOGS</div>
            <div id="logs"></div>
        </div>

        <div class="panel">
            <div class="panel-header">SYSTEM 2 THOUGHTS</div>
            <div id="thoughts" style="flex:1; overflow-y:auto">Waiting for cognitive activity...</div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://' + window.location.host);
        
        ws.onopen = () => {
            document.getElementById('connection-status').innerText = 'System Online';
            document.getElementById('connection-status').style.color = '#22c55e';
            appendLog('System', 'Connected to Sentra Neural Core.');
        };
        
        ws.onclose = () => {
            document.getElementById('connection-status').innerText = 'Offline';
            document.getElementById('connection-status').style.color = '#ef4444';
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'log') {
                appendLog('Agent', data.message);
            } else if (data.type === 'state') {
                updateState(data.state);
            } else if (data.type === 'thought') {
                updateThought(data.thought);
            }
        };

        function appendLog(source, message) {
            const logs = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const time = new Date().toLocaleTimeString();
            
            // Colorizing
            let color = '#e2e8f0';
            if (message.includes('ERROR') || message.includes('Fail')) color = '#ef4444';
            if (message.includes('SUCCESS') || message.includes('✅')) color = '#22c55e';
            if (message.includes('WARN')) color = '#f59e0b';
            
            entry.innerHTML = \`<span class="log-timestamp">[\${time}]</span> <span style="color:\${color}">\${message}</span>\`;
            logs.appendChild(entry);
            logs.scrollTop = logs.scrollHeight;
        }

        function updateState(state) {
            document.getElementById('agent-state').innerText = state;
            const dot = document.getElementById('status-dot');
            dot.className = 'status-indicator';
            
            if (state === 'IDLE') dot.classList.add('status-idle');
            else if (state === 'ERROR') dot.classList.add('status-error');
            else if (state === 'PLANNING' || state === 'REFLECTING') dot.classList.add('status-thinking');
            else dot.classList.add('status-working');
        }

        function updateThought(thought) {
            const container = document.getElementById('thoughts');
            const entry = document.createElement('div');
            entry.style.marginBottom = '10px';
            entry.style.borderLeft = '2px solid #f59e0b';
            entry.style.paddingLeft = '8px';
            entry.innerText = thought;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
        }

        async function startTask() {
            const task = document.getElementById('task-input').value;
            if (!task) return;
            
            await fetch('/api/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', payload: task })
            });
            document.getElementById('task-input').value = '';
        }

        async function stopAgent() {
            if (confirm('Are you sure you want to stop the agent?')) {
                await fetch('/api/control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'stop' })
                });
            }
        }
    </script>
</body>
</html>
        `;

        fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(chalk.cyan(`[Mirror] 🪞 Dashboard online at http://localhost:${this.port}`));
        });
    }

    broadcast(type, data) {
        this.wss.broadcast(type, data);
    }
}

module.exports = ProjectMirror;
