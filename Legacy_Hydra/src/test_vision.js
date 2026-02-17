const BrowserTools = require('./tools/BrowserTools');
const LocalModelAdapter = require('./models/LocalModelAdapter');
const fs = require('fs');
const path = require('path');

// Mock Agent
const mockAgent = {
    components: {
        models: new LocalModelAdapter({ modelName: 'llava-stub' }) // Use stub mode
    }
};

async function testVision() {
    console.log('--- Testing Vision Capabilities ---');

    // 1. Create a dummy image
    // In real usage, this would be a real image file, but for stub testing, any file works as it just reads bytes.
    const imagePath = path.join(__dirname, '..', 'debug_vision.jpg');
    fs.writeFileSync(imagePath, 'dummy image content');

    // 2. Initialize Tools
    const browserTools = new BrowserTools();
    browserTools.agent = mockAgent; // Inject agent manually as the real Agent does

    // 3. Test analyze_image
    console.log(`Testing analyze_image with file: ${imagePath}`);
    const result = await browserTools.analyze_image({
        filepath: imagePath,
        prompt: 'What is in this image?'
    });

    console.log('Result:', result);

    // 4. Cleanup
    try {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    } catch (e) {
        console.log('Cleanup failed (non-critical)');
    }

    // Validation
    if (result && (result.includes('STUB') || result.includes('color swatch'))) {
        console.log('✅ Vision Test Passed (Stub Verified)');
    } else {
        console.error('❌ Vision Test Failed: Unexpected output');
        console.error('Expected output to contain "STUB" or "color swatch"');
        process.exit(1);
    }
}

testVision().catch(e => {
    console.error('Test Failed with Error:', e);
    process.exit(1);
});
