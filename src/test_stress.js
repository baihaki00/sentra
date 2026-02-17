/**
 * STRESS TEST: V3.5 E2E Validation
 * Automatically generates and tests 1000+ diverse prompts
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Prompt generators for different domains
const promptGenerators = {
    greetings: () => {
        const variations = [
            'hello', 'hi', 'hey', 'good morning', 'good evening', 'greetings',
            'howdy', 'yo', 'sup', 'hiya', 'hello there', 'hi there',
            'good afternoon', 'hey there', 'hello!', 'hi!', 'hey!'
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    },

    selfQueries: () => {
        const variations = [
            'who are you', 'what are you', 'who are you?', 'what are you?',
            'tell me about yourself', 'what is your name', 'what is your name?',
            'introduce yourself', 'who r u', 'what r u', 'your name?',
            'what do you do', 'what are you capable of', 'describe yourself'
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    },

    userQueries: () => {
        const variations = [
            'who am i', 'who am i?', 'what is my name', 'what is my name?',
            'tell me about me', 'do you know me', 'do you know who i am',
            'what do you know about me', 'who am I?', 'what\'s my name'
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    },

    factQueries: () => {
        const subjects = [
            'sentra', 'python', 'javascript', 'ai', 'computer', 'brain',
            'memory', 'learning', 'neural network', 'algorithm', 'data',
            'graph', 'node', 'activation', 'belief', 'confidence', 'intent'
        ];
        const templates = [
            'what is {subject}',
            'what is {subject}?',
            'tell me about {subject}',
            'explain {subject}',
            'define {subject}',
            'what do you know about {subject}'
        ];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace('{subject}', subject);
    },

    teaching: () => {
        const pairs = [
            ['quantum', 'particle physics'],
            ['neural', 'brain-related'],
            ['api', 'application interface'],
            ['cache', 'temporary storage'],
            ['async', 'asynchronous'],
            ['regex', 'regular expression'],
            ['dom', 'document object model'],
            ['json', 'javascript object notation'],
            ['http', 'hypertext transfer protocol'],
            ['cpu', 'central processing unit']
        ];
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        return `${pair[0]} means ${pair[1]}`;
    },

    commands: () => {
        const commands = [
            'list files', 'show graph', 'status', 'help',
            'memory', 'nodes', 'edges', 'context'
        ];
        return commands[Math.floor(Math.random() * commands.length)];
    },

    edgeCases: () => {
        const cases = [
            '', // Empty
            '   ', // Whitespace
            'a', // Single char
            '?', // Just punctuation
            'hello hello hello hello', // Repetition
            'HELLO', // All caps
            'HeLLo', // Mixed case
            '123', // Numbers
            'hello123', // Alphanumeric
            '!@#$%', // Special chars
            'this is a very long sentence that goes on and on without much meaning just to test how sentra handles verbose input',
            'multiple? questions? in? one? input?',
            'what is what is what is', // Recursive
            'hello. hi. hey.', // Multiple sentences
        ];
        return cases[Math.floor(Math.random() * cases.length)];
    },

    conversational: () => {
        const phrases = [
            'thank you', 'thanks', 'cool', 'nice', 'okay', 'ok',
            'got it', 'understood', 'i see', 'interesting',
            'tell me more', 'continue', 'go on', 'what else',
            'how about you', 'and you?', 'really?', 'why?',
            'how?', 'when?', 'where?', 'can you help me'
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    },

    domainKnowledge: () => {
        const topics = [
            'how does machine learning work',
            'explain neural networks',
            'what is deep learning',
            'tell me about artificial intelligence',
            'how do computers think',
            'what is natural language processing',
            'explain gradient descent',
            'what is supervised learning',
            'difference between AI and ML',
            'what is reinforcement learning'
        ];
        return topics[Math.floor(Math.random() * topics.length)];
    }
};

// Generate test prompts
function generatePrompts(count) {
    const prompts = [];
    const categories = Object.keys(promptGenerators);

    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const prompt = promptGenerators[category]();
        prompts.push({ index: i, category, prompt });
    }

    return prompts;
}

// Run stress test
async function runStressTest(promptCount = 1000) {
    console.log(`🌌 STRESS TEST: Generating ${promptCount} diverse prompts...`);

    const prompts = generatePrompts(promptCount);
    const results = {
        total: promptCount,
        successful: 0,
        errors: 0,
        timeouts: 0,
        startTime: Date.now(),
        errorLog: []
    };

    console.log(`\n📊 Prompt Distribution:`);
    const distribution = {};
    prompts.forEach(p => {
        distribution[p.category] = (distribution[p.category] || 0) + 1;
    });
    Object.entries(distribution).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
    });

    console.log(`\n🚀 Starting automated test...\n`);

    // Spawn Sentra process
    const sentra = spawn('node', ['src/genesis/Kernel.js'], {
        cwd: 'd:\\ClosedClaw',
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputBuffer = '';
    let currentPromptIndex = 0;
    let waitingForResponse = false;
    let sentraReady = false;
    let lastPromptTime = 0;

    sentra.stdout.on('data', (data) => {
        outputBuffer += data.toString();

        // Check if Sentra finished loading
        if (!sentraReady && outputBuffer.includes('[Kernel] Online')) {
            console.log(`✅ Sentra initialized. Starting test in 2 seconds...\n`);
            sentraReady = true;

            // Start sending prompts after a delay
            setTimeout(() => {
                sendNextPrompt();
            }, 2000);
        }
    });

    function sendNextPrompt() {
        if (currentPromptIndex >= prompts.length) {
            // All prompts sent
            setTimeout(() => {
                sentra.stdin.write('/exit\n');
                setTimeout(finishTest, 1000);
            }, 500);
            return;
        }

        const prompt = prompts[currentPromptIndex];

        try {
            sentra.stdin.write(prompt.prompt + '\n');
            results.successful++;
        } catch (err) {
            results.errors++;
            results.errorLog.push({
                promptIndex: currentPromptIndex,
                prompt: prompt.prompt,
                error: err.message
            });
        }

        currentPromptIndex++;

        // Progress indicator
        if (currentPromptIndex % 100 === 0) {
            console.log(`Progress: ${currentPromptIndex}/${promptCount} (${((currentPromptIndex / promptCount) * 100).toFixed(1)}%)`);
        }

        // Send next prompt after delay (200ms = 5 prompts/sec, more stable)
        setTimeout(sendNextPrompt, 200);
    }

    sentra.stderr.on('data', (data) => {
        const error = data.toString();
        results.errors++;
        results.errorLog.push({
            promptIndex: currentPromptIndex,
            prompt: prompts[currentPromptIndex]?.prompt,
            error: error.substring(0, 200) // Limit error length
        });
    });

    sentra.on('close', (code) => {
        if (code !== 0 && currentPromptIndex < promptCount) {
            console.log(`\n⚠️  Sentra crashed at prompt ${currentPromptIndex}`);
        }
    });

    function finishTest() {
        const duration = Date.now() - results.startTime;

        console.log(`\n\n${'='.repeat(60)}`);
        console.log(`📈 STRESS TEST RESULTS`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Total Prompts: ${results.total}`);
        console.log(`✅ Successful: ${results.successful} (${((results.successful / results.total) * 100).toFixed(1)}%)`);
        console.log(`❌ Errors: ${results.errors}`);
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`📊 Throughput: ${(results.total / (duration / 1000)).toFixed(1)} prompts/second`);

        if (results.errorLog.length > 0) {
            console.log(`\n⚠️  First 5 Errors:`);
            results.errorLog.slice(0, 5).forEach((err, i) => {
                console.log(`  ${i + 1}. Prompt #${err.promptIndex}: "${err.prompt}"`);
                console.log(`     Error: ${err.error.substring(0, 100)}...`);
            });
        }

        // Save full results
        fs.writeFileSync('d:\\ClosedClaw\\stress_test_results.json', JSON.stringify({
            results,
            prompts: prompts.slice(0, 50), // Save first 50 for inspection
            timestamp: new Date().toISOString()
        }, null, 2));

        console.log(`\n💾 Full results saved to: stress_test_results.json`);
        console.log(`${'='.repeat(60)}\n`);

        process.exit(results.errors === 0 ? 0 : 1);
    }
}

// Run with command line argument or default
const promptCount = parseInt(process.argv[2]) || 1000;
runStressTest(promptCount);
