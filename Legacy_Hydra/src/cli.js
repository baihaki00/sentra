const readline = require('readline');
const SentraCore = require('./core');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    // Banner
    console.log(boxen(chalk.cyan.bold(' S E N T R A   A I ') + '\n' + chalk.dim(' Autonomous Agent v1.0'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        float: 'center'
    }));

    // Suppress verbose init logs — they go to session.log anyway
    const originalLog = console.log;
    const originalWarn = console.warn;
    console.log = () => { };
    console.warn = () => { };

    const spinner = ora({
        text: chalk.cyan('Initializing Core Systems...'),
        color: 'cyan',
        spinner: 'dots'
    }).start();

    const core = new SentraCore();
    await core.start();

    // Restore logging
    console.log = originalLog;
    console.warn = originalWarn;

    spinner.succeed(chalk.green('System Online.'));

    const tools = Array.from(core.agent.components.tools.registry.keys());
    console.log(chalk.dim('────────────────────────────────────────────────'));
    console.log(chalk.bold(`Tools Loaded (${tools.length}):`));
    console.log(chalk.cyan(tools.join(chalk.dim(' | '))));
    console.log(chalk.dim('────────────────────────────────────────────────'));
    console.log(chalk.dim('  Type a task, or /exit to quit.\n'));

    process.stdout.write(chalk.cyan('> '));

    rl.on('line', async (line) => {
        const task = line.trim();
        if (!task) {
            process.stdout.write(chalk.cyan('> '));
            return;
        }

        if (core.agent.state !== 'IDLE') {
            console.log(chalk.yellow('⚠️ Agent is busy. Please wait...'));
            return;
        }

        if (task.toLowerCase() === '/exit') {
            const exitSpinner = ora('Shutting down...').start();
            await core.stop();
            exitSpinner.succeed(chalk.green('Goodbye.'));
            rl.close();
            process.exit(0);
        }

        console.log(); // spacer
        console.log(boxen(chalk.italic(task), {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            borderStyle: 'classic',
            borderColor: 'gray',
            dimBorder: true
        }));

        // Suppress verbose internal logs during task execution
        // Only show important cognitive/pipeline logs
        const taskLog = console.log;
        const taskWarn = console.warn;
        const taskError = console.error;
        console.log = (...args) => {
            const msg = args[0] ? String(args[0]) : '';
            // Show only the interesting logs
            if (msg.includes('[Cognitive]') ||
                msg.includes('[Pipeline] Step') ||
                msg.includes('FINAL ANSWER') ||
                msg.includes('[Pipeline] 🖼️') ||
                msg.includes('ACT RESULT') ||
                msg.includes('[WebFetcher]') ||
                msg.includes('[SkillManager]')) {
                taskLog(...args);
            }
            // Everything else is silenced (still goes to session.log via Agent.log)
        };
        console.warn = () => { };

        const taskSpinner = ora({
            text: chalk.blue('Thinking...'),
            color: 'cyan',
            spinner: 'dots'
        }).start();

        const startTime = Date.now();

        try {
            taskSpinner.stop(); // Stop before logs start
            const result = await core.agent.startTask(task);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // Restore logging before printing result
            console.log = taskLog;
            console.warn = taskWarn;
            console.error = taskError;

            console.log();
            console.log(chalk.green(`  ✅ Completed in ${elapsed}s`));
            console.log();
            console.log(boxen(chalk.green.bold('RESULT:\n') + result, {
                padding: 1,
                borderColor: 'green',
                borderStyle: 'round'
            }));

        } catch (error) {
            console.log = taskLog;
            console.warn = taskWarn;
            console.error = taskError;
            console.log(chalk.red(`  ❌ Task Failed: ${error.message}`));
        } finally {
            // Always restore
            console.log = taskLog;
            console.warn = taskWarn;
            console.error = taskError;
            console.log();
            process.stdout.write(chalk.cyan('> '));
        }
    });
}

if (require.main === module) {
    main().catch(console.error);
}
module.exports = main;
