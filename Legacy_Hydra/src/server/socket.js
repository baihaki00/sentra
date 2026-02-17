const WebSocket = require('ws');

class WebSocketHelper {
    constructor(server, agent) {
        this.wss = new WebSocket.Server({ server });
        this.agent = agent;

        this.wss.on('connection', (ws) => {
            // Send initial state
            ws.send(JSON.stringify({
                type: 'state',
                state: this.agent.state
            }));

            // Handle incoming messages if needed
            ws.on('message', (message) => {
                // console.log('received: %s', message);
            });
        });
    }

    broadcast(type, data) {
        const payload = JSON.stringify({
            type,
            ...data
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }
}

module.exports = WebSocketHelper;
