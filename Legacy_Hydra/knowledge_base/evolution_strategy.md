# Sentra Evolution Strategy: From Tool to Sovereign Agent

## Core Philosophy: Simplicity & Emergence
> "Intelligence comes from structure, feedback, and learning, not line count."

We will avoid hardcoding complex rigid logic. Instead, we will build **systems that learn from usage**.
- **Current State**: Static Code + Dynamic Prompts.
- **Future State**: Dynamic Code + Evolving Memory + Self-Refining Prompts.

---

## 1. Iterative Learning & Workflow Optimization
**Goal**: "Stop thinking from scratch. Remember how we did it last time."
**Technical Implementation: Procedural Memory (Skill Library)**
- **Concept**: When a task succeeds (e.g., "Check EURUSD"), save the *exact plan sequence* to a simpler, faster database.
- **Mechanism**:
    1.  **Capture**: successful `plan` JSON.
    2.  **Parametrize**: Replace specific values ("EURUSD", "Apple") with variables `{{asset}}`, `{{company}}`.
    3.  **Recall**: Before thinking, check: "Do I have a saved workflow for this?"
    4.  **Optimization**: If a workflow fails, flag it. If it succeeds faster, update the "best time".

## 2. Creator vs. Sentra (Grounding & Feedback)
**Goal**: "Learn from the Creator's corrections instantly."
**Technical Implementation: Episodic Reinforcement**
- **Concept**: When user says "Wrong", that entire conversation snippet is tagged as a **Negative Example**.
- **Mechanism**:
    1.  **Feedback Loop**: User correction triggers `store_memory(category="correction", content="When checking X, do not use tool Y...")`.
    2.  **Prompt Injection**: In the System Prompt, inject irrelevant "Don't do this" rules dynamically based on context.
    3.  **Confidence Check**: If Sentra is unsure (low probability tokens), it *asks* before acting.

## 3. Self-Evolving (The "Dangerous" Part)
**Goal**: "Improve own code, fix own bugs, backup self."
**Technical Implementation: The Sandbox Conception**
- **Safety First**:
    - **Mirror**: Sentra never edits `src/core` directly. It edits `src/experimental`.
    - **Test**: It writes a test case for its new feature.
    - **Run**: It executes `src/experimental` in a subprocess.
    - **Promote**: Only if the test passes does it overwrite `src/core`.
- **Backup**:
    - **Git Integration**: Before *any* self-edit, runs `git commit`. If the new version crashes, the "Runner" (external script) reverts to the last commit.

## 4. Reflections (Idle Mode)
**Goal**: "Refine knowledge while sleeping."
**Technical Implementation: The Dream Cycle**
- **Trigger**: When `IDLE` for > 5 minutes.
- **Action**:
    1.  Read `session.log` and `episodic_memory.json`.
    2.  **Pattern Match**: "I failed to open browser 3 times today. Why?"
    3.  **Synthesize**: Write a new rule to `semantic_memory.json`: "Always use --no-sandbox flag."
    4.  **Consolidate**: Merge similar memories to save space.

---

## The Roadmap
1.  **Reflections (Low Risk)**: Implement the "Idle Loop" to analyze logs and improve prompts.
2.  **procedural Memory (Medium Risk)**: Start saving successful plans as "Skills".
3.  **Self-Evolving (High Risk)**: capabilities to write/test its own code.
3.  **Self-Evolving (High Risk)**: capabilities to write/test its own code.

## 5. Financial Sovereignty (The Ultimate Benchmark)
**Goal**: "Trading is not for money alone. It is a stress test for cognitive stability."

**Philosophy**:
- **Adversarial Environment**: Markets punish ambiguity and hallucination instantly.
- **Cognitive Stability**: Can Sentra maintain disciplined execution under pressure?
- **Risk > Reward**: Respecting immutable constraints is more important than profit.

**Technical Constraints (The "Built-in" Skill)**:
- **Zero Hallucination**: Numeric data must be verified against multiple sources.
- **Immutable Risk Layer**: Hard-coded safety rules that the LLM *cannot* override.
- **Auditability**: Every decision must be logged with a "Why" and "Risk Calculation".

*Ready to evolve?*
