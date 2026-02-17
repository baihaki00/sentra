const SystemTools = require('../../tools/SystemTools');
const systemTools = new SystemTools();

module.exports = {
    name: 'system',
    description: 'System-level operations and command execution',
    tools: {
        'cmd': {
            description: 'Executes a shell command on the host (Windows)',
            parameters: { type: 'object', properties: { command: { type: 'string' } } },
            handler: (args) => systemTools.cmd(args)
        },
        'get_os_info': {
            description: 'Returns information about the operating system',
            parameters: { type: 'object', properties: {} },
            handler: (args) => systemTools.get_os_info()
        }
    }
};
