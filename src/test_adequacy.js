const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: ADEQUACY CHECK & REGENERATION (V3.5)
 */
async function testAdequacy() {
    console.log("🌌 TEST: ADEQUACY CHECK & REGENERATION (V3.5)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    console.log("\n=== Test 1: High Adequacy (No Regeneration) ===");

    const prediction1 = kernel.expectation.predict('INTENT:GREETING', [], []);
    const response1 = "Hello, Administrator. I am listening.";
    const adequacy1 = kernel.expectation.checkAdequacy(prediction1, response1, []);

    console.log(`Response: "${response1}"`);
    console.log(`Adequacy: ${adequacy1.adequacy.toFixed(2)}`);
    console.log(`Regeneration needed: ${adequacy1.adequacy < 0.7 ? 'Yes' : 'No'}`);
    console.log(adequacy1.adequacy >= 0.7 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 2: Low Adequacy (Should Regenerate) ===");

    const prediction2 = kernel.expectation.predict('INTENT:GREETING', [], []);
    const response2 = "I don't know.";
    const adequacy2 = kernel.expectation.checkAdequacy(prediction2, response2, []);

    console.log(`Response: "${response2}"`);
    console.log(`Adequacy: ${adequacy2.adequacy.toFixed(2)}`);
    console.log(`Mismatch reason: ${adequacy2.mismatchReason}`);
    console.log(`Regeneration needed: ${adequacy2.adequacy < 0.7 ? 'Yes' : 'No'}`);
    console.log(adequacy2.adequacy < 0.7 ? "✅ PASSED (Mismatch detected)" : "❌ FAILED");

    console.log("\n=== Test 3: SELF_QUERY Adequacy ===");

    const prediction3 = kernel.expectation.predict('INTENT:SELF_QUERY', [{ id: 'IDENTITY:SENTRA', type: 'IDENTITY' }], []);
    const response3 = "I am IDENTITY:SENTRA (IDENTITY). Knowledge: 0 items.";
    const adequacy3 = kernel.expectation.checkAdequacy(prediction3, response3, [{ id: 'IDENTITY:SENTRA', type: 'IDENTITY' }]);

    console.log(`Response: "${response3}"`);
    console.log(`Adequacy: ${adequacy3.adequacy.toFixed(2)}`);
    console.log(adequacy3.adequacy >= 0.7 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 4: FACT_QUERY with Missing Entity ===");

    const prediction4 = kernel.expectation.predict('INTENT:FACT_QUERY', [{ id: 'unknown_entity', type: 'UNKNOWN' }], []);
    const response4 = "I don't know much about unknown_entity yet.";
    const adequacy4 = kernel.expectation.checkAdequacy(prediction4, response4, []);

    console.log(`Response: "${response4}"`);
    console.log(`Adequacy: ${adequacy4.adequacy.toFixed(2)}`);
    console.log(`Expected low adequacy due to missing entity: ${adequacy4.adequacy < 0.7 ? 'Yes' : 'No'}`);
    console.log(adequacy4.adequacy < 0.7 ? "✅ PASSED (Low adequacy due to missing entity)" : "❌ FAILED");

    console.log("\n=== Test 5: Expectation History Tracking ===");

    console.log(`Total predictions tracked: ${kernel.expectation.history.length}`);
    console.log(kernel.expectation.history.length >= 4 ? "✅ PASSED (History tracking works)" : "❌ FAILED");
}

testAdequacy();
