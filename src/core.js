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

    // Register System Tools
    const SystemTools = require('./tools/SystemTools');
    const systemTools = new SystemTools();
    this.agent.components.tools.register('cmd', (args) => systemTools.cmd(args), {});
    this.agent.components.tools.register('get_os_info', (args) => systemTools.get_os_info(), {});

    // Register FileSystem Tools
    const FileSystemTools = require('./tools/FileSystemTools');
    const fsTools = new FileSystemTools(process.cwd());
    this.agent.components.tools.register('read_file', (args) => fsTools.read_file(args), {});
    this.agent.components.tools.register('write_file', (args) => fsTools.write_file(args), {});
    this.agent.components.tools.register('list_dir', (args) => fsTools.list_dir(args), {});

    // Register Browser Tools
    const BrowserTools = require('./tools/BrowserTools');
    const browserTools = new BrowserTools();
    this.agent.components.tools.register('browser_open', (args) => browserTools.browser_open(args), {});
    this.agent.components.tools.register('browser_type', (args) => browserTools.browser_type(args), {});
    this.agent.components.tools.register('browser_click', (args) => browserTools.browser_click(args), {});
    this.agent.components.tools.register('browser_read', (args) => browserTools.browser_read(args), {});
    this.agent.components.tools.register('browser_close', (args) => browserTools.browser_close(args), {});
    this.agent.components.tools.register('browser_press_key', (args) => browserTools.browser_press_key(args), {});
    this.agent.components.tools.register('google_search', (args) => browserTools.google_search(args), {});

    // Register Memory Tools
    this.agent.components.tools.register('store_memory', async (args) => {
      await this.agent.components.memory.semantic.add(args.content, { source: 'user_tool' });
      return 'Memory stored successfully.';
    }, {});
    this.agent.components.tools.register('recall_memory', async (args) => {
      const results = await this.agent.components.memory.semantic.search(args.query);
      return JSON.stringify(results.map(r => r.content));
    }, {});

    // Register Code Execution Tools
    const CodeExecutor = require('./tools/CodeExecutor');
    const codeExecutor = new CodeExecutor();
    this.agent.components.tools.register('execute_javascript', (args) => codeExecutor.execute_javascript(args), {});
    this.agent.components.tools.register('execute_python', (args) => codeExecutor.execute_python(args), {});

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