const FileSystemTools = require('../../tools/FileSystemTools');
// We initialize with process.cwd() as the base directory
const fsTools = new FileSystemTools(process.cwd());

module.exports = {
    name: 'filesystem',
    description: 'File system operations (read, write, list)',
    tools: {
        'read_file': {
            description: 'Reads the content of a file',
            parameters: { type: 'object', properties: { path: { type: 'string' } } },
            handler: (args) => fsTools.read_file(args)
        },
        'write_file': {
            description: 'Writes content to a file',
            parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } },
            handler: (args) => fsTools.write_file(args)
        },
        'list_dir': {
            description: 'Lists files and directories in a path',
            parameters: { type: 'object', properties: { path: { type: 'string' } } },
            handler: (args) => fsTools.list_dir(args)
        }
    }
};
