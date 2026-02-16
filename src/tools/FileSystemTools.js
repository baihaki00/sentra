const fs = require('fs').promises;
const path = require('path');

/**
 * File System Tools
 * Provides safe file operations within the workspace.
 */
class FileSystemTools {
    constructor(baseDir) {
        this.baseDir = baseDir || process.cwd();
    }

    resolvePath(filepath) {
        const resolved = path.resolve(this.baseDir, filepath);
        if (!resolved.startsWith(this.baseDir)) {
            throw new Error(`Access denied: ${filepath} is outside workspace.`);
        }
        return resolved;
    }

    async read_file({ filepath }) {
        try {
            const fullPath = this.resolvePath(filepath);
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        } catch (error) {
            return `Error reading file: ${error.message}`;
        }
    }

    async write_file({ filepath, content }) {
        try {
            const fullPath = this.resolvePath(filepath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf8');
            return `Successfully wrote to ${filepath}`;
        } catch (error) {
            return `Error writing file: ${error.message}`;
        }
    }

    async list_dir({ dirpath }) {
        try {
            const fullPath = this.resolvePath(dirpath || '.');
            const files = await fs.readdir(fullPath);
            return files.join('\n');
        } catch (error) {
            return `Error listing directory: ${error.message}`;
        }
    }
}

module.exports = FileSystemTools;
