const CodeExecutor = require('../../tools/CodeExecutor');
const codeExecutor = new CodeExecutor();

module.exports = {
    name: 'code_execution',
    description: 'Safe execution of code snippets',
    tools: {
        'execute_javascript': {
            description: 'Executes a JavaScript snippet',
            parameters: { type: 'object', properties: { code: { type: 'string' } } },
            handler: (args) => codeExecutor.execute_javascript(args)
        },
        'execute_python': {
            description: 'Executes a Python script',
            parameters: { type: 'object', properties: { code: { type: 'string' } } },
            handler: (args) => codeExecutor.execute_python(args)
        }
    }
};
