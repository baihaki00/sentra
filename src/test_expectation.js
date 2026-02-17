const GenesisKernel = require('./genesis/Kernel');

/**
 * TEST: EXPECTATION MODELING (V3.5)
 */
async function testExpectation() {
    console.log("🌌 TEST: EXPECTATION MODELING (V3.5)...");
    const kernel = new GenesisKernel();
    await kernel.init();

    console.log("\n=== Test 1: GREETING Prediction ===");
    const prediction1 = kernel.expectation.predict('INTENT:GREETING', [], []);
    console.log("Prediction:", prediction1);

    const adequacy1 = kernel.expectation.checkAdequacy(
        prediction1,
        "Hello, Administrator. I am listening.",
        []
    );
    console.log("Adequacy:", adequacy1);
    console.log(adequacy1.adequacy > 0.7 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 2: SELF_QUERY Prediction ===");
    const prediction2 = kernel.expectation.predict('INTENT:SELF_QUERY', [], []);
    console.log("Prediction:", prediction2);

    const adequacy2 = kernel.expectation.checkAdequacy(
        prediction2,
        "I am IDENTITY:SENTRA (IDENTITY). Knowledge: 0 items.",
        [{ id: 'IDENTITY:SENTRA', type: 'IDENTITY' }]
    );
    console.log("Adequacy:", adequacy2);
    console.log(adequacy2.adequacy > 0.7 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Test 3: MISMATCH Detection ===");
    const prediction3 = kernel.expectation.predict('INTENT:GREETING', [], []);
    console.log("Prediction:", prediction3);

    // Wrong response (should trigger low adequacy)
    const adequacy3 = kernel.expectation.checkAdequacy(
        prediction3,
        "I don't know.",
        []
    );
    console.log("Adequacy:", adequacy3);
    console.log(adequacy3.adequacy < 0.7 ? "✅ PASSED (Mismatch detected)" : "❌ FAILED");

    console.log("\n=== Test 4: FACT_QUERY with Entity ===");
    const prediction4 = kernel.expectation.predict(
        'INTENT:FACT_QUERY',
        [{ id: 'Sentra', type: 'KNOWN' }],
        []
    );
    console.log("Prediction:", prediction4);

    const adequacy4 = kernel.expectation.checkAdequacy(
        prediction4,
        "Sentra is a ALIAS.",
        [{ id: 'Sentra', type: 'ALIAS' }]
    );
    console.log("Adequacy:", adequacy4);
    console.log(adequacy4.adequacy > 0.7 ? "✅ PASSED" : "❌ FAILED");

    console.log("\n=== Learning Phase ===");
    kernel.expectation.learn();
}

testExpectation();
