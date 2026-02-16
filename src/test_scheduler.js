const SentraCore = require('./core');

async function testScheduler() {
    console.log('--- Testing Scheduler Skill ---');
    const sentra = new SentraCore();
    await sentra.initialize();

    const tools = sentra.agent.components.tools;

    // 1. Schedule a task
    console.log('\n[Test] Scheduling "TestTask" to run every minute...');
    // Note: node-cron 6 params is second-based (optional), 5 is standard. 
    // We'll use 5 stars for standard "every minute", or 6 stars for "every second" if enabled?
    // node-cron supports 6 fields (seconds). Let's try to schedule for every 2 seconds to see output quickly.
    // "*/2 * * * * *" is every 2 seconds.

    try {
        const result = await tools.execute('schedule_task', {
            cron_expression: '*/2 * * * * *',
            task_name: 'FastTask',
            command: 'echo "Tick Tock"'
        });
        console.log('Result:', result);
    } catch (e) {
        console.error('Schedule Failed:', e.message);
    }

    // 2. List tasks
    console.log('\n[Test] Listing tasks...');
    const list = await tools.execute('list_scheduled_tasks', {});
    console.log(list);

    // 3. Wait for a few executions
    console.log('\n[Test] Waiting 5 seconds for execution logs...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Cancel task
    console.log('\n[Test] Canceling "FastTask"...');
    const cancel = await tools.execute('cancel_task', { task_name: 'FastTask' });
    console.log(cancel);

    // 5. Verify cancel
    console.log('\n[Test] Waiting 3 seconds to ensure no more logs...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Done.');
}

testScheduler().catch(console.error);
