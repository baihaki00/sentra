const { Scaffold } = require('./genesis/Scaffold');

/**
 * TEST: CONTEXT WINDOW
 */
function testContext() {
    console.log("🌌 TEST: CONTEXT WINDOW...");
    const scaffold = new Scaffold();

    // 1. FILL STM
    console.log("\n[1] Filling Short-Term Memory...");
    for (let i = 1; i <= 15; i++) {
        scaffold.perceive(`TOKEN_${i}`);
    }

    // 2. VERIFY CAPACITY
    const context = scaffold.context.getRelevantNodes();
    console.log(`Context Size: ${context.length}`);

    // Should contain TOKEN_6 to TOKEN_15 (10 items)
    const first = context[0].id;
    const last = context[context.length - 1].id;

    console.log(`First in Context: ${first}`);
    console.log(`Last in Context: ${last}`);

    if (context.length === 10 && first === 'TOKEN_6' && last === 'TOKEN_15') {
        console.log("✅ Context Capacity Enforced.");
    } else {
        console.error("❌ Context Leak/Overflow.");
    }

    // 3. VERIFY REFRESH (Re-accessing old token brings it to front?)
    console.log("\n[2] Testing Recency...");
    scaffold.perceive('TOKEN_6');
    // Now TOKEN_6 should be at the end (newest)

    const newContext = scaffold.context.getRelevantNodes();
    const newLast = newContext[newContext.length - 1].id;

    if (newLast === 'TOKEN_6') {
        console.log("✅ Recency Updated (TOKEN_6 moved to end).");
    } else {
        console.error(`❌ Recency Failed. Last is ${newLast}`);
    }
}

testContext();
