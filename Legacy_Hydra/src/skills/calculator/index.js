// Optimized by Sentra

module.exports = {
    name: 'calculator',
    tools: {
        calculator: {
            description: 'Evaluates mathematical expressions safely (Self-Optimized).',
            parameters: {
                expression: {
                    type: 'string',
                    description: 'Mathematical expression to evaluate'
                }
            },
            action: async (expression) => {
                try {
                    return eval(expression);
                } catch (e) {
                    throw new Error('Invalid expression');
                }
            }
        }
    }
};