// ClosedClaw Application Entry Point
// Demonstrates enhanced capabilities

const ClosedClawCore = require('./src/core');
const path = require('path');

class ClosedClawApp {
  constructor() {
    this.core = null;
    this.isInitialized = false;
  }

  async setup() {
    console.log('🚀 Initializing ClosedClaw Application...');
    
    try {
      // Initialize the core system
      this.core = new ClosedClawCore('./config/default.json');
      
      // Enhance with additional capabilities
      await this.enhanceCapabilities();
      
      // Load additional services
      await this.loadServices();
      
      this.isInitialized = true;
      console.log('✅ ClosedClaw Application initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize ClosedClaw Application:', error);
      throw error;
    }
  }

  async enhanceCapabilities() {
    // Add enhanced capabilities beyond the core
    this.core.enhancedCapabilities();
    
    // Add advanced decision-making
    this.core.advancedDecisionMaking = {
      prioritizeTasks: (tasks) => {
        // Enhanced task prioritization algorithm
        return tasks.sort((a, b) => b.priority - a.priority);
      },
      
      predictUserIntent: (input) => {
        // Predict what the user wants to do based on input and context
        return {
          intent: 'unknown',
          confidence: 0.0,
          alternatives: []
        };
      }
    };
    
    // Add intelligent automation
    this.core.intelligentAutomation = {
      detectPatterns: (activities) => {
        // Detect patterns in user activities for automation opportunities
        return [];
      },
      
      suggestAutomations: (patterns) => {
        // Suggest automations based on detected patterns
        return [];
      }
    };
  }

  async loadServices() {
    // Load additional services that enhance functionality
    this.core.services = {
      // Communication service with enhanced features
      communication: {
        channels: new Map(), // Store different communication channels
        addChannel: (name, handler) => {
          this.core.services.communication.channels.set(name, handler);
        },
        sendMessage: async (channel, message) => {
          const handler = this.core.services.communication.channels.get(channel);
          if (handler) {
            return await handler(message);
          }
          throw new Error(`Unknown channel: ${channel}`);
        }
      },
      
      // Task management with advanced features
      taskManager: {
        queue: [],
        running: new Set(),
        
        addTask: (task) => {
          this.core.services.taskManager.queue.push(task);
        },
        
        processQueue: async () => {
          while (this.core.services.taskManager.queue.length > 0) {
            const task = this.core.services.taskManager.queue.shift();
            if (task && !this.core.services.taskManager.running.has(task.id)) {
              this.core.services.taskManager.running.add(task.id);
              try {
                await task.execute();
              } finally {
                this.core.services.taskManager.running.delete(task.id);
              }
            }
          }
        }
      },
      
      // Advanced memory with cross-session capabilities
      advancedMemory: {
        sessions: new Map(),
        
        store: async (key, value, sessionId = 'default') => {
          if (!this.core.services.advancedMemory.sessions.has(sessionId)) {
            this.core.services.advancedMemory.sessions.set(sessionId, new Map());
          }
          
          const sessionMap = this.core.services.advancedMemory.sessions.get(sessionId);
          sessionMap.set(key, {
            value,
            timestamp: Date.now(),
            accessed: 1
          });
        },
        
        retrieve: async (key, sessionId = 'default') => {
          const sessionMap = this.core.services.advancedMemory.sessions.get(sessionId);
          if (sessionMap) {
            const item = sessionMap.get(key);
            if (item) {
              item.accessed++;
              return item.value;
            }
          }
          return null;
        },
        
        crossSessionQuery: async (pattern) => {
          // Query across all sessions for related information
          const results = [];
          for (const [sessionId, sessionMap] of this.core.services.advancedMemory.sessions) {
            for (const [key, value] of sessionMap) {
              if (key.includes(pattern) || 
                  (typeof value.value === 'string' && value.value.includes(pattern))) {
                results.push({ sessionId, key, value: value.value });
              }
            }
          }
          return results;
        }
      }
    };
  }

  async start() {
    if (!this.isInitialized) {
      await this.setup();
    }
    
    console.log('🌟 Starting ClosedClaw Application...');
    
    try {
      await this.core.start();
      console.log('✅ ClosedClaw Application is running!');
      
      // Start background services
      this.startBackgroundServices();
      
      return this.core;
    } catch (error) {
      console.error('❌ Failed to start ClosedClaw Application:', error);
      throw error;
    }
  }

  startBackgroundServices() {
    // Start background processes for enhanced functionality
    console.log('⚙️ Starting background services...');
    
    // Memory optimization service
    setInterval(() => {
      if (this.core && this.core.memoryManager) {
        this.core.memoryManager.save();
      }
    }, this.core?.config?.memory?.autoSaveIntervalMS || 300000); // Default to 5 minutes
    
    // Resource monitoring service
    setInterval(() => {
      if (this.core && this.core.resourceManager) {
        const resources = this.core.resourceManager.monitor();
        // Could add logic to respond to resource constraints
      }
    }, 10000); // Every 10 seconds
    
    console.log('✅ Background services started!');
  }

  async stop() {
    console.log('🛑 Stopping ClosedClaw Application...');
    
    if (this.core) {
      await this.core.stop();
    }
    
    console.log('✅ ClosedClaw Application stopped!');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n shutting down gracefully...');
  const app = global.closedclawApp;
  if (app) {
    await app.stop();
  }
  process.exit(0);
});

// Export the application class
module.exports = ClosedClawApp;

// If running directly, start the application
if (require.main === module) {
  const app = new ClosedClawApp();
  global.closedclawApp = app; // Store globally for signal handlers
  
  app.start()
    .then(core => {
      console.log('\n🎉 ClosedClaw is ready to serve!');
      console.log('💡 Enhanced capabilities are now active.');
    })
    .catch(error => {
      console.error('\n💥 Failed to start ClosedClaw:', error);
      process.exit(1);
    });
}