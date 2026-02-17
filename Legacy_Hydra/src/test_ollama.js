const axios = require('axios');

async function testOllama() {
    console.log('Testing Ollama Embeddings...');
    try {
        const response = await axios.post('http://localhost:11434/api/embeddings', {
            model: 'qwen3:8b',
            prompt: 'Hello world'
        });
        console.log('Success! Vector length:', response.data.embedding.length);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testOllama();
