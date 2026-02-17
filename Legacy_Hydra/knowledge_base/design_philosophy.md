# Sentra Design Philosophy

> "I want Sentra to be fast, balanced between easy to super complex tasks, and smart is just as important. Now every feature that we add, total time taken to finish one job is key."

## Core Pillars

### 1. Performance (The "Time" Metric)
- **Constraint**: Every new feature must answer: *"Will this increase the total runtime?"*
- **Goal**: Minimize latency. Smartness should not cost minutes of waiting.
- **Optimization**: Use "Fast Paths" (System 1) for simple tasks, and "Slow Paths" (System 2) only when necessary.
- **Parallelism**: Where possible, run expensive operations (like memories/reflections) in background/parallel.

### 2. Reliability & Resilience (The "Backup" Plan)
- **Constraint**: Sentra must never crash without a fallback.
- **Goal**: "I want Sentra to have backup plans if it fails."
- **Mechanism**:
    - **Retry Logic**: Exponential backoff.
    - **Strategy Swapping**: If `browser_read` fails, try `google_search` cache.
    - **Self-Healing**: If a file is missing, try to regenerate it or find a backup.

### 3. Precision (The "Detail" Metric)
- **Constraint**: No hallucinations. No "I think".
- **Goal**: Exact answers.
- **Mechanism**: Data verification steps. Code must be tested before execution.

### 4. Aesthetics (The "Clean" Look)
- **Constraint**: "I don't want it to be fancy and I don't want it to be ugly either."
- **Goal**: Functional, clean, minimal.
- **Style**: Terminal UI should be readable. Web Dashboard should be data-first, not animation-first.

## Architectural Implications

- **The "Two-Speed" Brain**:
    - **speed=1 (Fast)**: Regex, Simple LLM calls, Cached Memory. (For "easy" tasks).
    - **speed=2 (Deep)**: Tree of Thoughts, Recursive Evolution. (For "super complex" tasks).
- **The "Mirror"**: A dashboard to visualize the state, but it must be lightweight (no heavy React/Angular bundles).

## Development Rules
1. **Measure Time**: Log the duration of every major component.
2. **Fail Gracefully**: Always wrap external calls in Try-Catch-Retry blocks.
3. **No Bloat**: Do not add dependencies unless absolutely necessary.
