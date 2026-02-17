const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_COUNT = 5000;
const OUTPUT_FILE = path.join(__dirname, '../../data/evaluation/generated_prompts.json');

// 1. Dimensions
const TASK_TYPES = [
    'FACTUAL', 'MATH', 'LOGIC', 'WEB_SEARCH', 'CODE_GEN', 'FILE_OPS', 'AMBIGUOUS'
];

const COMPLEXITY = ['SIMPLE', 'MEDIUM', 'COMPLEX', 'ADVERSARIAL'];

// 2. Data Sources (Mini-Databases)
const ENTITIES = {
    CITIES: ['Paris', 'Tokyo', 'New York', 'London', 'Berlin', 'Sydney', 'Mumbai', 'Cairo'],
    COMPANIES: ['Microsoft', 'Apple', 'Google', 'Amazon', 'Tesla', 'NVIDIA', 'Meta'],
    PEOPLE: ['Elon Musk', 'Bill Gates', 'Satya Nadella', 'Tim Cook', 'Jensen Huang'],

    // Math operands
    NUMBERS_SMALL: [5, 12, 115, 7, 3, 20],
    NUMBERS_LARGE: [12345, 67890, 99999, 1000000],

    // Coding
    LANGUAGES: ['Python', 'JavaScript'],
    ALGORITHMS: ['Bubble Sort', 'Fibonacci', 'Factorial', 'Binary Search'],

    // Files
    FILENAMES: ['test.txt', 'config.json', 'notes.md', 'data.csv']
};

// 3. Templates (Combinatorial Logic)
const TEMPLATES = {
    FACTUAL: [
        { text: "What is the capital of {city}?", vars: ['CITIES'] },
        { text: "Who is the CEO of {company}?", vars: ['COMPANIES'] },
        { text: "When was {company} founded?", vars: ['COMPANIES'] }
    ],
    MATH: [
        { text: "Calculate {n1} * {n2} + {n3}", vars: ['NUMBERS_SMALL', 'NUMBERS_SMALL', 'NUMBERS_SMALL'] },
        { text: "What is the square root of {n1}?", vars: ['NUMBERS_LARGE'] }
    ],
    LOGIC: [
        { text: "If {p1} meets {p2} in {city}, who is traveling?", vars: ['PEOPLE', 'PEOPLE', 'CITIES'] }
    ],
    WEB_SEARCH: [
        { text: "What is the current stock price of {company}?", vars: ['COMPANIES'] },
        { text: "Find the latest news about {p1}.", vars: ['PEOPLE'] }
    ],
    CODE_GEN: [
        { text: "Write a {lang} function to implement {algo}.", vars: ['LANGUAGES', 'ALGORITHMS'] },
        { text: "Create a script in {lang} to read {file}.", vars: ['LANGUAGES', 'FILENAMES'] }
    ],
    FILE_OPS: [
        { text: "Create a file named {file} with content 'Hello World'.", vars: ['FILENAMES'] },
        { text: "Delete the file {file}.", vars: ['FILENAMES'] }
    ]
};

// 4. Modifiers (Adversarial Injection)
const MODIFIERS = [
    { type: 'NONE', apply: s => s },
    { type: 'TYPO', apply: s => s.replace(/e/g, '3').replace(/o/g, '0') }, // Simple leet speak
    { type: 'CASE', apply: s => s.toLowerCase() },
    { type: 'URGENT', apply: s => "ASAP: " + s },
    { type: 'VERBOSE', apply: s => "I want you to very carefully and precisely " + s + " and strict adherence to rules." }
];

// Logic
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrompt() {
    const type = getRandom(TASK_TYPES);
    // Fallback to FACTUAL if type not implemented yet
    const templates = TEMPLATES[type] || TEMPLATES['FACTUAL'];
    const template = getRandom(templates);

    let text = template.text;
    const usedVars = {};

    template.vars.forEach((varKey, index) => {
        const value = getRandom(ENTITIES[varKey]);
        text = text.replace(`{${index < 3 ? ['n1', 'n2', 'n3', 'p1', 'p2', 'city', 'company', 'lang', 'algo', 'file'][index /* Logic weak here, fix */] : ''}}`, value);
        // Better interpolation logic needed
        // Let's iterate match
    });

    // Correct Interpolation
    let varIndex = 0;
    text = template.text.replace(/\{(\w+)\}/g, (match, p1) => {
        // We assume template.vars matches the order of placeholders
        // Ideally we map p1 directly to ENTITIES key, but template defines list of keys
        // Simpler: Just pick from the varKey defined in template.vars[varIndex]
        const key = template.vars[varIndex] || 'CITIES';
        varIndex++;
        return getRandom(ENTITIES[key]);
    });

    // Apply Modifier
    const modifier = Math.random() > 0.7 ? getRandom(MODIFIERS) : MODIFIERS[0];
    const finalText = modifier.apply(text);

    return {
        id: crypto.randomUUID(),
        type: type,
        complexity: getRandom(COMPLEXITY),
        prompt: finalText,
        modifier: modifier.type,
        expected_entities: template.vars // Approximate ground truth
    };
}

// Main
const crypto = require('crypto');
const prompts = [];

console.log(`Generating ${TARGET_COUNT} prompts...`);

for (let i = 0; i < TARGET_COUNT; i++) {
    prompts.push(generatePrompt());
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(prompts, null, 2));
console.log(`Saved to ${OUTPUT_FILE}`);
