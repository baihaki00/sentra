// Sentra - Enhanced AI Automation Platform
// Entry point for the application

const fs = require('fs');
const path = require('path');
const Agent = require('./core/Agent');
const Pipeline = require('./core/Pipeline');
const MemoryManager = require('./memory/MemoryManager');
const ToolSandbox = require('./tools/ToolSandbox');
const ModelOrchestrator = require('./models/ModelOrchestrator');
const ProjectMirror = require('./server/index');
const TelegramInterface = require('./server/TelegramInterface');

class SentraCore {
  constructor(configPath = './config/default.json') {
    this.config = this.loadConfig(configPath);
    this.agent = new Agent(this.config);
    this.server = new ProjectMirror(this.agent, (this.config.server && this.config.server.port) || 3000);
    this.telegram = new TelegramInterface(this.agent);
    this.isRunning = false;
  }

  loadConfig(configPath) {
    try {
      const configData = fs.readFileSync(path.resolve(configPath), 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error.message);
      // Return default config if file missing
      return {
        server: { port: 3000 },
        models: { default: 'mock' },
        memory: { baseDir: './data' },
        security: {}
      };
    }
  }

  async initialize() {
    console.log('Initializing Sentra Core...');

    // Wire up components
    this.agent.components.memory = new MemoryManager(this.config.memory || {});
    this.agent.components.tools = new ToolSandbox(this.config.security || {});
    await this.agent.components.tools.load(); // Load built-in tools (Vision)
    this.agent.components.models = new ModelOrchestrator(this.config.models || {});
    this.agent.components.pipeline = new Pipeline(this.agent);

    // Register basic tools
    this.agent.components.tools.register('echo', async (args) => {
      return `Echo: ${args.message}`;
    }, {});

    this.agent.components.tools.register('final_answer', async (args) => {
      console.log(`\n>>> FINAL ANSWER: ${args.text}\n`);
      return args.text;
    }, {});

    this.agent.components.tools.register('ask_expert', async (args) => {
      const readline = require('readline');
      const chalk = require('chalk');

      console.log(chalk.magenta(`\n[Assisted Evolution] 🆘 REQUEST FOR HELP`));
      console.log(chalk.cyan(`Question: ${args.question}`));
      if (args.context) console.log(chalk.gray(`Context: ${args.context}`));
      console.log(chalk.yellow(`Waiting for expert input...`));

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise(resolve => {
        rl.question('> ', (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    }, { question: 'string', context: 'string?' });


    // Tools are now loaded via SkillLoader in src/skills/
    const SkillLoader = require('./core/SkillLoader');
    const skillLoader = new SkillLoader(this.agent.components.tools);
    await skillLoader.loadSkills();

    // Hook Logging to WebSocket
    // We listen to the agent's 'log' event and broadcast it
    this.agent.on('log', (message) => {
      this.server.broadcast('log', { message });
    });

    this.agent.on('stateChange', (data) => {
      this.server.broadcast('state', { state: data.state });
    });

    // We also need to capture 'thought' events from CognitiveEngine
    // But CognitiveEngine is deep inside. We can emit events on agent for thoughts too.
    // For now, let's assume 'log' captures most things.

    console.log('Sentra Core initialized successfully');
  }

  async start() {
    if (this.isRunning) {
      console.warn('Sentra is already running');
      return;
    }

    await this.initialize();
    this.server.start(); // Start Web Server
    this.telegram.start(); // Start Telegram Bot
    this.isRunning = true;
    console.log('Sentra started successfully!');

    // Auto-start a demo task for verification
    // In production this would wait for trigger
    if (process.env.AUTO_RUN_DEMO) {
      await this.runDemoTask();
    }
  }

  async runDemoTask() {
    console.log('\n--- Running Demo Task ---');
    try {
      const result = await this.agent.startTask('Demonstrate Sentra Capabilities');
      console.log('Task Result:', result);
    } catch (err) {
      console.error('Task Failed:', err);
    }
    console.log('--- Demo Complete ---\n');
  }

  async stop() {
    if (!this.isRunning) {
      console.warn('Sentra is not running');
      return;
    }
    this.isRunning = false;
    await this.telegram.stop();
    console.log('Sentra stopped successfully!');
  }
}

module.exports = SentraCore;

// Example usage
if (require.main === module) {
  const sentra = new SentraCore();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down Sentra...');
    await sentra.stop();
    process.exit(0);
  });

  // Start the application
  // process.env.AUTO_RUN_DEMO = 'true'; // Commented out to prevent auto-run loop during dev
  sentra.start()
    .catch(error => {
      console.error('Failed to start Sentra:', error);
      process.exit(1);
    });
}