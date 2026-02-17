/**
 * SENTRA Information Retrieval Benchmark
 * Tests the speed and quality of info retrieval across various scenarios.
 * 
 * Run: node src/test_info_retrieval.js
 */
const path = require('path');

// ── Test Infrastructure ──
let passed = 0, failed = 0, total = 0;
const timings = [];

function assert(condition, msg) {
    total++;
    if (condition) {
        console.log(`  ✅ ${msg}`);
        passed++;
    } else {
        console.log(`  ❌ ${msg}`);
        failed++;
    }
}

function section(name) {
    console.log(`\n━━━ ${name} ━━━`);
}

// ── 1. WebFetcher Unit Tests ──
async function testWebFetcher() {
    section('1. WebFetcher Unit Tests');
    const WebFetcher = require('./tools/WebFetcher');
    const fetcher = new WebFetcher();

    // Test web_fetch
    const t1 = Date.now();
    const result = await fetcher.web_fetch({ url: 'https://example.com' });
    const fetchTime = Date.now() - t1;
    timings.push({ name: 'web_fetch (example.com)', time: fetchTime });

    assert(result.toLowerCase().includes('example') || result.toLowerCase().includes('domain'), `web_fetch returns content from example.com`);
    assert(fetchTime < 5000, `web_fetch completed in ${fetchTime}ms (< 5s)`);
    assert(!result.includes('<script'), `web_fetch strips script tags`);
    assert(!result.includes('<div'), `web_fetch strips HTML tags`);

    // Test caching
    const t2 = Date.now();
    const cached = await fetcher.web_fetch({ url: 'https://example.com' });
    const cacheTime = Date.now() - t2;
    timings.push({ name: 'web_fetch (cached)', time: cacheTime });

    assert(cacheTime < 50, `Cache hit in ${cacheTime}ms (< 50ms)`);
    assert(cached === result, `Cached result matches original`);

    // Test web_search
    const t3 = Date.now();
    const searchResults = await fetcher.web_search({ query: 'what is javascript' });
    const searchTime = Date.now() - t3;
    timings.push({ name: 'web_search (javascript)', time: searchTime });

    assert(searchResults.length > 50, `web_search returns results (${searchResults.length} chars)`);
    assert(searchTime < 5000, `web_search completed in ${searchTime}ms (< 5s)`);

    // Test search caching
    const t4 = Date.now();
    const cachedSearch = await fetcher.web_search({ query: 'what is javascript' });
    const searchCacheTime = Date.now() - t4;
    timings.push({ name: 'web_search (cached)', time: searchCacheTime });

    assert(searchCacheTime < 10, `Search cache hit in ${searchCacheTime}ms (< 10ms)`);

    // Test error handling
    const errorResult = await fetcher.web_fetch({ url: 'https://thissitedefinitelydoesnotexist12345.com' });
    assert(errorResult.includes('Error'), `web_fetch handles bad URLs gracefully`);

    // Test DDG result parsing quality
    const t5 = Date.now();
    const newsSearch = await fetcher.web_search({ query: 'tesla stock price today' });
    const newsTime = Date.now() - t5;
    timings.push({ name: 'web_search (tesla stock)', time: newsTime });

    assert(newsSearch.includes('Title:') || newsSearch.includes('Result:') || newsSearch.includes('INSTANT'),
        `Stock search returns structured results`);
}

// ── 2. BrowserTools Optimization Tests ──
async function testBrowserOptimization() {
    section('2. BrowserTools Optimization Tests');
    const BrowserTools = require('./tools/BrowserTools');
    const browser = new BrowserTools();

    // Test headless launch speed
    const t1 = Date.now();
    await browser.browser_open({ url: 'https://example.com' });
    const launchTime = Date.now() - t1;
    timings.push({ name: 'browser_open (first launch)', time: launchTime });

    assert(launchTime < 10000, `Browser launch + navigate in ${launchTime}ms (< 10s)`);

    // Test smart content extraction
    const content = await browser.browser_read();
    assert(content.includes('Example Domain'), `browser_read extracts content`);
    assert(content.length < 7000, `browser_read is reasonably truncated (${content.length} chars)`);

    // Test second navigation (browser already open)
    const t2 = Date.now();
    await browser.browser_open({ url: 'https://httpbin.org/html' });
    const navTime = Date.now() - t2;
    timings.push({ name: 'browser_open (already open)', time: navTime });

    assert(navTime < 5000, `Second nav in ${navTime}ms (< 5s, no launch overhead)`);

    // Cleanup
    await browser.browser_close();
}

// ── 3. CognitiveEngine Fast-Path Tests ──
async function testCognitiveFastPath() {
    section('3. CognitiveEngine Fast-Path Tests');
    const CognitiveEngine = require('./core/CognitiveEngine');

    // Mock agent
    const mockAgent = {
        config: {},
        log: () => { },
        components: {
            skills: { findSkill: async () => null }
        }
    };
    const engine = new CognitiveEngine(mockAgent);

    // Simple queries should trigger fast path
    const simpleQueries = [
        'What is the capital of France?',
        'How much does Bitcoin cost?',
        'Who invented the telephone?',
        'When was Node.js released?',
        'Tell me about quantum computing',
        'What time is it in Tokyo?',
        'Find me the latest news about AI',
        'Check the weather in Jakarta',
    ];

    const complexQueries = [
        'Build me a web scraper for Reddit',
        'Create a React dashboard',
        'Analyze the performance of our API',
        'Deploy this app to production',
        'Refactor the authentication module',
    ];

    for (const q of simpleQueries) {
        assert(engine._isSimpleQuery(q, {}), `Fast-path: "${q.substring(0, 40)}..."`);
    }

    for (const q of complexQueries) {
        assert(!engine._isSimpleQuery(q, {}), `Full-path: "${q.substring(0, 40)}..."`);
    }

    // With history, should always use full path
    assert(!engine._isSimpleQuery('What is 2+2?', { history: [{ tool: 'test', output: 'test' }] }),
        `Follow-up always uses full path`);
}

// ── 4. Full E2E Info Retrieval (With Live Ollama) ──
async function testLiveRetrieval() {
    section('4. Full E2E Info Retrieval (Live Ollama)');

    let SentraCore;
    try {
        SentraCore = require('./core');
    } catch (e) {
        console.log('  ⚠️  Skipping live tests (SentraCore not available)');
        return;
    }

    const core = new SentraCore();
    await core.initialize();
    await core.start();

    // Test: Simple factual query
    const t1 = Date.now();
    let result;
    try {
        result = await core.agent.startTask('What is the capital of Indonesia?');
        const queryTime = Date.now() - t1;
        timings.push({ name: 'E2E: Capital of Indonesia', time: queryTime });

        assert(queryTime < 30000, `E2E query in ${queryTime}ms (< 30s)`);

        const resultStr = String(result || '').toLowerCase();
        assert(
            resultStr.includes('jakarta') || resultStr.includes('indonesia'),
            `Answer contains expected content`
        );
    } catch (e) {
        console.log(`  ⚠️  E2E test error: ${e.message}`);
    }

    await core.stop();
}

// ── 5. WebFetcher vs BrowserTools Comparison ──
async function testSpeedComparison() {
    section('5. Speed Comparison: WebFetcher vs Browser');
    const WebFetcher = require('./tools/WebFetcher');
    const BrowserTools = require('./tools/BrowserTools');

    const fetcher = new WebFetcher();
    const browser = new BrowserTools();
    const testUrl = 'https://example.com';

    // WebFetcher speed
    fetcher.clearCache();
    const t1 = Date.now();
    await fetcher.web_fetch({ url: testUrl });
    const fetcherTime = Date.now() - t1;

    // BrowserTools speed
    const t2 = Date.now();
    await browser.browser_open({ url: testUrl });
    await browser.browser_read();
    const browserTime = Date.now() - t2;
    await browser.browser_close();

    timings.push({ name: 'Comparison: WebFetcher', time: fetcherTime });
    timings.push({ name: 'Comparison: BrowserTools', time: browserTime });

    const speedup = (browserTime / fetcherTime).toFixed(1);
    assert(fetcherTime < browserTime, `WebFetcher (${fetcherTime}ms) faster than Browser (${browserTime}ms) — ${speedup}× speedup`);
}

// ── RUNNER ──
async function runBenchmark() {
    console.log(`
╔══════════════════════════════════════════════╗
║   SENTRA INFO RETRIEVAL BENCHMARK            ║
║   Speed × Quality × Reliability              ║
╚══════════════════════════════════════════════╝`);

    const startTime = Date.now();

    await testWebFetcher();
    await testCognitiveFastPath();
    await testBrowserOptimization();
    await testSpeedComparison();
    // Uncomment for live E2E (requires Ollama running):
    // await testLiveRetrieval();

    const totalTime = Date.now() - startTime;

    console.log(`
╔══════════════════════════════════════════════╗
║         BENCHMARK RESULTS                    ║
╠══════════════════════════════════════════════╣
║  Total Tests:   ${String(total).padEnd(28)}║
║  Passed:        ${String(passed).padEnd(28)}║
║  Failed:        ${String(failed).padEnd(28)}║
║  Total Time:    ${String(totalTime + 'ms').padEnd(28)}║
╚══════════════════════════════════════════════╝`);

    console.log('\n⏱️  PERFORMANCE METRICS:');
    console.log('┌──────────────────────────────────────────┬──────────┐');
    console.log('│ Operation                                │ Time     │');
    console.log('├──────────────────────────────────────────┼──────────┤');
    for (const t of timings) {
        const name = t.name.padEnd(40).substring(0, 40);
        const time = String(t.time + 'ms').padStart(8);
        console.log(`│ ${name} │ ${time} │`);
    }
    console.log('└──────────────────────────────────────────┴──────────┘');

    // Write report
    const fs = require('fs');
    const reportData = {
        timestamp: new Date().toISOString(),
        total, passed, failed, totalTime,
        timings,
    };
    const reportPath = path.join(process.cwd(), 'data', 'info_retrieval_benchmark.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Report: ${reportPath}`);

    if (failed > 0) process.exit(1);
    else console.log('\n🎉 ALL BENCHMARKS PASSED');
}

runBenchmark();
