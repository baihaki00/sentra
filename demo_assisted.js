const readline = require('readline');
const Agent = require('./src/core/Agent');
const chalk = require('chalk');

// Config with Assisted Mode
const config = {
    models: {
        default: 'qwen-portal/coder-model',
        evolution_mode: 'assisted',
        maxConcurrency: 1
    },
    agent: { name: 'Sentra' }
};

async function startDemo() {
    console.clear();
    console.log(chalk.cyan.bold('🤖 SENTRA ASSISTED EVOLUTION DEMO'));
    console.log(chalk.gray('Type a task and press Enter.'));
    console.log(chalk.gray('To force an "Expert Request", try a complex coding task or ask:'));
    console.log(chalk.yellow('"Write a C++ kernel module to interface with a toaster."'));
    console.log(chalk.gray('--------------------------------------------------'));

    const agent = new Agent(config);

    const mainRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green('USER > ')
    });

    mainRl.prompt();

    mainRl.on('line', async (line) => {
        const task = line.trim();
        if (!task) {
            mainRl.prompt();
            return;
        }

        if (task.toLowerCase() === 'exit') {
            console.log('Goodbye.');
            process.exit(0);
        }

        // Pause main RL to allow Agent (and ask_expert) to use stdout/stdin if needed
        mainRl.pause();

        try {
            console.log(chalk.blue(`\n[Agent] Starting task: "${task}"`));
            const result = await agent.startTask(task);
            console.log(chalk.green(`\n[Agent] Final Answer: ${result}\n`));
        } catch (error) {
            console.error(chalk.red('[Agent] Error:', error.message));
        } finally {
            mainRl.resume();
            mainRl.prompt();
        }
    });

    // Handle Agent Logs (Redirect to console to keep them visible)
    agent.on('log', (msg) => {
        // Filter out some noise if needed
        // console.log(chalk.dim(msg)); 
    });
}

startDemo();
