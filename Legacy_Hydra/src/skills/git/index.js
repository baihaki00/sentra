const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runGit(command, cwd) {
    try {
        const { stdout, stderr } = await execPromise(`git ${command}`, { cwd: cwd || process.cwd() });
        if (stderr && !stderr.includes('Note:')) { // Git often prints notes to stderr
            // For now, let's just return stdout + stderr if specific error keywords
        }
        return stdout.trim() || stderr.trim();
    } catch (error) {
        throw new Error(`Git Error: ${error.message}`);
    }
}

module.exports = {
    name: 'git',
    description: 'Git Version Control capabilities',
    tools: {
        'git_status': {
            description: 'Shows the working tree status',
            parameters: { type: 'object', properties: {} },
            handler: async () => {
                return await runGit('status');
            }
        },
        'git_add': {
            description: 'Adds file contents to the index',
            parameters: { type: 'object', properties: { files: { type: 'string', description: 'File path or "." for all' } } },
            handler: async (args) => {
                return await runGit(`add ${args.files || '.'}`);
            }
        },
        'git_commit': {
            description: 'Records changes to the repository',
            parameters: { type: 'object', properties: { message: { type: 'string' } } },
            handler: async (args) => {
                return await runGit(`commit -m "${args.message}"`);
            }
        },
        'git_push': {
            description: 'Updates remote refs along with associated objects',
            parameters: { type: 'object', properties: { remote: { type: 'string' }, branch: { type: 'string' } } },
            handler: async (args) => {
                const remote = args.remote || 'origin';
                const branch = args.branch || 'main'; // diligent default
                return await runGit(`push ${remote} ${branch}`);
            }
        },
        'git_pull': {
            description: 'Fetch from and integrate with another repository or a local branch',
            parameters: { type: 'object', properties: {} },
            handler: async () => {
                return await runGit('pull');
            }
        },
        'git_log': {
            description: 'Show commit logs',
            parameters: { type: 'object', properties: { count: { type: 'integer' } } },
            handler: async (args) => {
                const n = args.count || 5;
                return await runGit(`log -n ${n} --oneline`);
            }
        }
    }
};
