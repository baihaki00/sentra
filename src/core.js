// Sentra - Enhanced AI Automation Platform
// Entry point for the application

const fs = require('fs');
const path = require('path');
const Agent = require('./core/Agent');
const Pipeline = require('./core/Pipeline');
const MemoryManager = require('./memory/MemoryManager');
const ToolSandbox = require('./tools/ToolSandbox');
const ModelOrchestrator = require('./models/ModelOrchestrator');

class SentraCore {
  constructor(configPath = './config/default.json') {
    this.config = this.loadConfig(configPath);
    this.agent = new Agent(this.config);
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
        models: { default: 'mock' }
      };
    }
  }

  async initialize() {
    console.log('Initializing Sentra Core...');

    // Wire up components
    this.agent.components.memory = new MemoryManager(this.config.memory);
    this.agent.components.tools = new ToolSandbox(this.config.security);
    this.agent.components.models = new ModelOrchestrator(this.config.models);
    this.agent.components.pipeline = new Pipeline(this.agent);

    // Register basic tools
    this.agent.components.tools.register('echo', async (args) => {
      return `Echo: ${args.message}`;
    }, {});

    this.agent.components.tools.register('final_answer', async (args) => {
      console.log(`\n>>> FINAL ANSWER: ${args.text}\n`);
      return args.text;
    }, {});

    // Tools are now loaded via SkillLoader in src/skills/
    const SkillLoader = require('./core/SkillLoader');
    const skillLoader = new SkillLoader(this.agent.components.tools);
    await skillLoader.loadSkills();

    console.log('Sentra Core initialized successfully');
  }

  async start() {
    if (this.isRunning) {
      console.warn('Sentra is already running');
      return;
    }

    await this.initialize();
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
    console.log('Sentra stopped successfully!');
  }
}

module.exports = SentraCore;

// Example usage
if (require.main === module) {
  const closedClaw = new ClosedClawCore();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down ClosedClaw...');
    await closedClaw.stop();
    process.exit(0);
  });

  // Start the application
  process.env.AUTO_RUN_DEMO = 'true';
  closedClaw.start()
    .catch(error => {
      console.error('Failed to start ClosedClaw:', error);
      process.exit(1);
    });
}