const SentraCore = require('./core');

async function testCodeExecution() {
    console.log('--- Testing Code Execution ---');

    const core = new SentraCore();
    await core.start();

    // 1. Test JavaScript
    console.log('\n[Test] Executing JavaScript: 10 * 10');
    const jsResult = await core.agent.components.tools.execute('execute_javascript', {
        code: 'return 10 * 10;'
    });
    console.log(`[Result] ${jsResult}`);

    // 2. Test Python
    console.log('\n[Test] Executing Python: print("Hello from Python")');
    const pyResult = await core.agent.components.tools.execute('execute_python', {
        code: 'print("Hello from Python")'
    });
    console.log(`[Result] ${pyResult}`);

    await core.stop();
}

testCodeExecution().catch(console.error);
