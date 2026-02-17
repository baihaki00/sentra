const Thalamus = require('./core/Thalamus');
const SkillManager = require('./core/SkillManager');

// Mock Components
class MockAgent {
    constructor() {
        this.logMsgs = [];
        this.components = {
            skills: new MockSkillManager()
        };
    }
    log(msg) { this.logMsgs.push(msg); }
}

class MockSkillManager {
    async findSkill(task) {
        if (task.includes('monitor')) {
            return {
                skill: { id: 'monitor_system', plan: [{ tool: 'echo', args: { msg: 'System OK' } }] },
                confidence: 0.95
            };
        }
        return null;
    }
    async executeSkill(skill, task) {
        // Simulate execution time of 2 steps
        await new Promise(r => setTimeout(r, 100)); // 100ms per step
        return "System Monitor: OK";
    }
}

async function runBenchmark() {
    console.log('🦾 CEREBELLUM BENCHMARK 🦾');
    const agent = new MockAgent();
    // Manually inject mock skills into agent for Thalamus
    // agent.components.skills is already set in MockAgent

    const thalamus = new Thalamus(agent);

    // Test 1: Novel Task (Cortex)
    console.log('\n1. Cortex Path: "Write a novel"');
    const start1 = process.hrtime();
    const route1 = await thalamus.route("Write a novel");
    const end1 = process.hrtime(start1);
    const time1 = (end1[0] * 1000 + end1[1] / 1e6).toFixed(2);
    console.log(`   Route: ${route1.layer} | Overhead: ${time1}ms`);

    // Test 2: Known Skill (Cerebellum)
    console.log('\n2. Cerebellum Path: "Monitor System"');
    const start2 = process.hrtime();
    const route2 = await thalamus.route("Please monitor the system status");
    const end2 = process.hrtime(start2);
    const time2 = (end2[0] * 1000 + end2[1] / 1e6).toFixed(2);

    // Simulate Agent Execution (since Thalamus only routes)
    let totalTime = time2;
    if (route2.layer === 'CEREBELLUM') {
        const startExec = process.hrtime();
        const result = await agent.components.skills.executeSkill(route2.result.skill);
        const endExec = process.hrtime(startExec);
        const execTime = (endExec[0] * 1000 + endExec[1] / 1e6).toFixed(2);
        console.log(`   Route: ${route2.layer} | Routing: ${time2}ms | Exec: ${execTime}ms`);
        console.log(`   Result: ${result}`);

        if (result === "System Monitor: OK") {
            console.log('\n✅ PASS: Skill correctly routed and executed.');
        } else {
            console.log('\n❌ FAIL: Execution result mismatch.');
        }
    } else {
        console.log(`\n❌ FAIL: Routed to ${route2.layer} instead of CEREBELLUM`);
    }
}

runBenchmark();
