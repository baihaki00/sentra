# Sentra: Continuous Self-Learning Brain (Phase 2)

> **Goal**: Implement the "10 Invariants" of the new Constitution.
> **Key Shift**: From "Hardcoded Logic" to "Emergent Intelligence".

## User Review Required
> [!IMPORTANT]
> This plan moves Sentra entirely away from LLM-based reasoning for core tasks. The "Brain" will be a graph traversal engine. LLMs may be used strictly for "Senses" (Vision/Translation) but NOT for decision making.

## Proposed Changes

### 1. Intent Understanding (The "Fuzzy Brain")
**Goal**: Interpret vague commands ("fix it", "try again") as specific learning signals.
*   **Module**: `src/genesis/Intent.js` [NEW]
*   **Logic**:
    *   Map inputs to `INTENT` nodes in the graph (e.g., "fix it" -> `[INTENT:CORRECTION]`).
    *   Use Levenshtein distance + Keyword matching for initial grounding.
    *   Reinforce successful mappings (Hebbian learning).

### 2. The Reflection Loop (Idle Processing)
**Goal**: Consolidate memory when idle.
*   **Module**: `src/genesis/Reflection.js` [NEW]
*   **Logic**:
    *   Wake up every 5 minutes of inactivity.
    *   Scan `EPISODIC` memory for failures.
    *   Scan `SEMANTIC` memory for disconnected nodes.
    *   Prune weak connections (Forgiving).

### 3. Hierarchical Memory (Context)
**Goal**: Structured, persistent context.
*   **Update**: `src/genesis/Scaffold.js` [MODIFY]
*   **Logic**:
    *   Strictly separate `PROCEDURAL` (Skills), `EPISODIC` (Logs), `SEMANTIC` (Facts).
    *   Implement `ContextWindow` class to fetch relevant nodes based on `CurrentTask`.

### 4. Curiosity Engine (Unguided Learning)
**Goal**: Autonomous exploration.
*   **Update**: `src/genesis/Curiosity.js` [MODIFY]
*   **Logic**:
    *   Target nodes with `High Activation` + `Low Connectivity`.
    *   Generate `Hypothesis`: "If I run `help` on this command, I will learn parameters."

## Verification Plan

### Automated Tests
*   `test_intent.js`: Verify "fix it" triggers correction logic.
*   `test_reflection.js`: Verify that idle cycles reduce graph size (pruning) or increase connectivity.

### Manual Verification
*   Teach Sentra a new skill (e.g., "check time").
*   Give vague feedback ("wrong").
*   Verify Sentra adjusts without explicit code changes.
