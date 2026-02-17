const fs = require('fs');
const path = require('path');

// Config
const LOGS_DIR = path.join(__dirname, '../../data/evaluation/run_logs');
const OUTPUT_SUMMARY = path.join(__dirname, '../../data/evaluation/benchmark_summary.json');
const OUTPUT_REPORT = path.join(__dirname, '../../knowledge_base/evaluation/final_report.md');

function analyze() {
    console.log('📊 ANALYZING BENCHMARK RESULTS (Phase 4)...');

    if (!fs.existsSync(LOGS_DIR)) {
        console.error('❌ No logs found.');
        return;
    }

    const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
    let allRuns = [];

    // 1. Aggregation
    files.forEach(file => {
        const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf8');
        try {
            const batch = JSON.parse(content);
            allRuns = allRuns.concat(batch);
        } catch (e) {
            console.warn(`⚠️ Skipped corrupt file: ${file}`);
        }
    });

    console.log(`Loaded ${allRuns.length} total run records.`);

    // 2. Compute Metrics
    const stats = {
        total: allRuns.length,
        system_1_count: 0,
        system_2_count: 0,
        success_count: 0,
        total_latency: 0,
        latencies: [],
        tools_usage: {}
    };

    allRuns.forEach(item => {
        // Assume single run per item for now
        const run = item.runs[0];

        if (run.cognitive_system === 'SYSTEM_1') stats.system_1_count++;
        if (run.cognitive_system === 'SYSTEM_2') stats.system_2_count++;

        if (run.result && !run.error) stats.success_count++;

        stats.total_latency += run.latency;
        stats.latencies.push(run.latency);

        run.tool_calls.forEach(tool => {
            stats.tools_usage[tool] = (stats.tools_usage[tool] || 0) + 1;
        });
    });

    stats.avg_latency = stats.total_latency / stats.total;
    stats.system_1_pct = (stats.system_1_count / stats.total) * 100;
    stats.system_2_pct = (stats.system_2_count / stats.total) * 100;
    stats.success_rate = (stats.success_count / stats.total) * 100;

    // Percentiles
    stats.latencies.sort((a, b) => a - b);
    stats.p95_latency = stats.latencies[Math.floor(stats.latencies.length * 0.95)] || 0;

    // 3. Save Summary
    fs.writeFileSync(OUTPUT_SUMMARY, JSON.stringify(stats, null, 2));
    console.log(`✅ Saved summary to ${OUTPUT_SUMMARY}`);

    // 4. Generate Markdown Report
    const report = `
# Project Tom: Adversarial Evaluation Report

> **Generated**: ${new Date().toISOString()}
> **Scope**: ${stats.total} Runs

## 1. Executive Summary
- **Success Rate**: ${stats.success_rate.toFixed(2)}%
- **Cognitive Split**: System 1 (${stats.system_1_pct.toFixed(1)}%) vs System 2 (${stats.system_2_pct.toFixed(1)}%)
- **Avg Latency**: ${(stats.avg_latency / 1000).toFixed(2)}s (P95: ${(stats.p95_latency / 1000).toFixed(2)}s)

## 2. Performance Breakdown

| Metric | Value | Target | Status |
| :--- | :--- | :--- | :--- |
| **Accuracy** | ${stats.success_count}/${stats.total} | >95% | ${stats.success_rate > 95 ? '✅ PASS' : '⚠️ WARN'} |
| **System 1 Speed** | N/A | <2s | ? |
| **Determinism** | N/A | 100% | ? |

## 3. Tool Reliability
${Object.entries(stats.tools_usage).map(([t, c]) => `- **${t}**: ${c} calls`).join('\n')}

## 4. Failure Clusters
*(Placeholder for Phase 5 Analysis)*

`;

    // Ensure directory exists
    const reportDir = path.dirname(OUTPUT_REPORT);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    fs.writeFileSync(OUTPUT_REPORT, report);
    console.log(`✅ Saved report to ${OUTPUT_REPORT}`);
}

analyze();
