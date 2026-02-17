# Implementation Plan - Phase 13: Self-Evolving Code (The "Engineer" Mode)

## Goal
Enable Sentra to write, test, and commit its own code, allowing for true recursive self-improvement.

## User Review Required
> [!CAUTION]
> This phase grants Sentra the ability to MODIFY ITS OWN SOURCE CODE.
> Strict safety checks (Verification Steps) are mandatory before any code is committed.

## Proposed Changes

### 1. The Engineer Agent
#### [NEW] [src/core/Engineer.js](file:///d:/ClosedClaw/src/core/Engineer.js)
- A specialized module for code manipulation.
- **Capabilities**:
    - `readCode(filepath)`: Reads source files.
    - `writeCode(filepath, content)`: Writes changes (with backup).
    - `runTests(testCommand)`: Executes verification tests.
    - `rollback(filepath)`: Restores from backup if tests fail.

### 2. The Evolution Loop
#### [MODIFY] [src/core/Agent.js](file:///d:/ClosedClaw/src/core/Agent.js)
- New State: `EVOLVE`.
- Triggered by specific user request ("Improve your search tool") or internal reflection.
- **Workflow**:
    1.  **Draft**: AI generates new code.
    2.  **Backup**: Current files backed up to `src/backups/`.
    3.  **Apply**: New code written to `src/`.
    4.  **Verify**: Run unit tests / intent tests.
    5.  **Commit/Revert**:
        - If Pass: Keep changes, log evolution.
        - If Fail: Auto-revert to backup, log failure.

### 3. Safety Mechanisms
#### [NEW] [data/evolution_log.json](file:///d:/ClosedClaw/data/evolution_log.json)
- Tracks every change attempt (timestamp, file, result).

## Verification Plan
1.  **Backup Test**: Verify `Engineer.backup()` creates a copy.
2.  **Mutation Test**: Ask Sentra to "Add a comment to Agent.js".
3.  **Safety Test**: Ask Sentra to introduce a syntax error. Verify it detects the crash and reverts.
4.  **Feature Test**: Ask Sentra to "Create a new tool called 'hello_world'". Verify tool exists and works.

# Project Hydra: Neuromorphic Prototype

## Goal
Implement a 5-layer cognitive architecture to route tasks efficiently, bypassing the LLM for simple/unsafe operations.

## Proposed Changes

### Core Infrastructure
#### [NEW] [src/core/Thalamus.js](file:///d:/ClosedClaw/src/core/Thalamus.js)
- **Responsibility**: The central router.
- **Logic**:
    - Input: User Prompt.
    - Output: `RoutingDecision` { layer: 'REFLEX' | 'LIMBIC' | 'CORTEX', confidence: number }.
    - **Initial Algorithm**: Keyword + Regex matching.

#### [NEW] [src/core/Reflex.js](file:///d:/ClosedClaw/src/core/Reflex.js)
- **Responsibility**: System 0 execution.
- **Logic**:
    - Hardcoded `Map<Regex, Function>`.
    - Example: `/^stop$/` -> `process.exit()`.
    - Example: `/^calc (\d+) \+ (\d+)$/` -> `return a+b`.

#### [MODIFY] [src/core/Agent.js](file:///d:/ClosedClaw/src/core/Agent.js)
- **Change**: Inject `Thalamus` into the Agent constructor.
- **Change**: In `startTask()`, call `Thalamus.route(task)` BEFORE calling `Pipeline.execute()`.
- **Constraint**: If Thalamus handles it (Reflex/Cache), return immediately. DO NOT start the Pipeline.

## Verification Plan
### Automated Tests
- Create `test_hydra.js`:
    - Test Reflex: "calc 5+5" should take <10ms.
    - Test Routing: "Write a poem" should route to Cortex.

- **Phase 3: The Limbic System (Semantic Cache)**
    - [ ] Create `src/core/LimbicSystem.js`:
        - Wrapper around `VisibleMemory` (Vector DB).
        - Method `checkCache(input)` returns `{ hit: boolean, result: any }`.
        - Logic: If `cosineSimilarity > 0.95`, return cached result.
    - [x] Integrate into `Thalamus.js`: Call Limbic layer after Reflex, before Cortex.
    - [x] Benchmark: "What is the capital of France?" x 100. First run: 5s. Subsequent runs: 50ms.

- **Phase 4: The Cerebellum (Skill Execution)**
    - [ ] Modify `Thalamus.js` to check `SkillManager.findSkill(task)`.
    - [ ] Routing Logic:
        - If `SkillMatch > 0.9`, route to `CEREBELLUM`.
        - Execute `SkillManager.executeSkill(skill, params)`.
    - [ ] Benchmark: "Check Apple Stock" vs Full ReAct Plan.
