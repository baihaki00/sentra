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

    async resolvePath(filepath) {
        // 1. Clean path
        let cleanPath = filepath.replace(/['"]/g, '').trim();
        cleanPath = path.normalize(cleanPath);

        // 2. Try absolute/relative resolution
        let resolved = path.resolve(this.baseDir, cleanPath);

        // 3. Smart Fallback: If not found, look in common data dirs
        try {
            await fs.access(resolved);
        } catch (e) {
            // File doesn't exist at exact path, try fuzzy search
            const basename = path.basename(cleanPath);
            const searchDirs = [
                path.join(this.baseDir, 'data'),
                path.join(this.baseDir, 'data', 'screenshots'),
                path.join(this.baseDir, 'src')
            ];

            for (const dir of searchDirs) {
                const candidate = path.join(dir, basename);
                try {
                    await fs.access(candidate);
                    resolved = candidate;
                    break; // Found it
                } catch (err) {
                    // Continue searching
                }
            }
        }

        // 4. Enforce Sandbox
        // We allow access if it's within baseDir OR if it's in the allowed data dirs
        // But strict sandbox might block data/screenshots if baseDir is strictly root
        // For now, standard check:
        if (!resolved.startsWith(this.baseDir)) {
            // Exception: Allow screenshot dir if it's outside cwd (unlikely in this setup)
            throw new Error(`Access denied: ${resolved} is outside workspace.`);
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
