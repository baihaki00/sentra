const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// We need a way to persist jobs across restarts, 
// but for now, we'll just keep them in memory for the session.
// In a full implementation, we'd save the schedule to SQLite/JSON and reload on startup.
const jobs = new Map();

module.exports = {
    name: 'scheduler',
    description: 'Schedule recurring tasks using cron syntax',
    tools: {
        'schedule_task': {
            description: 'Schedules a task running a specific command or tool',
            parameters: {
                type: 'object',
                properties: {
                    cron_expression: { type: 'string', description: 'Cron syntax (e.g. "* * * * *")' },
                    task_name: { type: 'string', description: 'Unique name for the task' },
                    command: { type: 'string', description: 'Command/Instruction to execute' }
                },
                required: ['cron_expression', 'task_name', 'command']
            },
            handler: (args) => {
                const { cron_expression, task_name, command } = args;

                if (!cron.validate(cron_expression)) {
                    throw new Error(`Invalid cron expression: ${cron_expression}`);
                }

                if (jobs.has(task_name)) {
                    jobs.get(task_name).stop();
                    jobs.delete(task_name);
                }

                const job = cron.schedule(cron_expression, () => {
                    console.log(`[Scheduler] Executing task: ${task_name}`);
                    // NOTE: In a real agent, we would inject the Agent instance here 
                    // and call agent.startTask(command).
                    // Since this is a modular skill, we might need a way to callback to the main agent.
                    // For this MVP skill, we'll just log it or execute a simple system cmd if it's a CLI command.

                    // Ideally: process.emit('scheduled_task', command);
                    console.log(`[Scheduler] TODO: Execute "${command}"`);
                });

                jobs.set(task_name, job);
                return `Task "${task_name}" scheduled with expression "${cron_expression}".`;
            }
        },
        'list_scheduled_tasks': {
            description: 'Lists all currently scheduled tasks',
            parameters: { type: 'object', properties: {} },
            handler: (args) => {
                const taskList = Array.from(jobs.keys());
                return taskList.length > 0 ? `Scheduled Tasks:\n- ${taskList.join('\n- ')}` : 'No tasks scheduled.';
            }
        },
        'cancel_task': {
            description: 'Cancels a scheduled task',
            parameters: { type: 'object', properties: { task_name: { type: 'string' } } },
            handler: (args) => {
                if (jobs.has(args.task_name)) {
                    jobs.get(args.task_name).stop();
                    jobs.delete(args.task_name);
                    return `Task "${args.task_name}" cancelled.`;
                }
                return `Task "${args.task_name}" not found.`;
            }
        }
    }
};
