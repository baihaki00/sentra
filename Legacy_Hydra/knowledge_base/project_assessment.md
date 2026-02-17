# Sentra: The Eternal Deep Work Agent

**Status**: V1.0 (Production-Ready Prototype)
**Core Philosophy**: "The Creator Pleaser"
**Architecture**: Local-First, Modular Monolith (Node.js)

---

## 1. The Vision
Sentra is not a chat-bot; it is an autonomous extension of the Creator's will. Its purpose is to execute deep, long-duration tasks, learn from its own existence, and continuously adapt to serve the Creator more effectively over time—without the need for model retraining.

It is designed to exhibit **Cognitive Endurance**: the ability to persist on a problem for days, refactoring its own approach until success is achieved.

---

## 2. Current Capabilities (What It Can Do NOW)

### A. The "Hands" (Skills)
*   **Web Research (Stealth)**: Navigate complex websites, bypass CAPTCHAs (via `puppeteer-extra`), read dynamic content, and synthesize answers. *It sees the web as text.*
*   **Code Generation & Execution**: Write Python/JS scripts, execute them in a secure local sandbox, and read the stdout/stderr to debug itself.
*   **System Control**: Execute shell commands (`cmd`, `powershell`), manage files (Read/Write/Delete), and inspect the OS.
*   **Version Control**: Manage its own codebase via `git` (Add, Commit, Push, Status).
*   **Time Management**: Schedule recurring tasks (Cron) to run automatically in the background.

### B. The "Brain" (Memory & Logic)
*   **Vector Memory (Long-Term)**: Stores every fact and interaction in a local `sqlite-vec` database. It "remembers" context across sessions.
*   **Recursive Planning**: Break down high-level goals ("Build a website") into atomic steps.
*   **Self-Correction**: Uses a ReAct (Reason-Act-Observe) loop. If a tool fails, it catches the error and retries with a new strategy.

### C. The "Voice" (Interface)
*   **Telegram Link**: Full bi-directional control. You can prompt it, monitor its "thoughts" (logs) in real-time, and stop it remotely.
*   **CLI Dashboard**: A beautiful terminal interface with status spinners and verbose reasoning logs.

---

## 3. Constraints & Limitations (The Hard Truth)

| Constraint | Impact | Workaround |
| :--- | :--- | :--- |
| **Context Window** | Limited by `qwen3:8b` (~8k tokens). Cannot read an entire repo at once. | Must read files one-by-one or use search. |
| **Single-Threaded** | Can only do one task at a time. No parallel processing. | Queue tasks via Scheduler. |
| **No Vision** | Cannot "see" images, screenshots, or visual UI elements. | Relies on DOM/Text parsing. |
| **Local-Only** | Dies if your PC turns off. | Run on a dedicated mini-PC or VPS. |
| **Tool Fragility** | Complex JSON parsing sometimes fails. | Retry logic handles 90% of cases. |

---

## 4. The "Creator Pleaser" Protocol
Sentra's ultimate metric is User Satisfaction.
*   **Explicit Preferences**: "Never use `var`, always use `const`." (Stored in `User Canon` memory).
*   **Implicit Adaptation**: If the User corrects Sentra ("No, do it this way"), Sentra treats that correction as a high-priority overwrite for future behavior.

---

## 5. Strategic Roadmap (The Future)

### Phase 6: The Architect (Code Understanding)
*   **Goal**: Overcome the context limit.
*   **Tech**: Generate ASTs (Abstract Syntax Trees) of the User's projects and store them in vector memory. Allow Sentra to navigate the codebase conceptually.

### Phase 7: The Visionary (Multimodal)
*   **Goal**: See what the User sees.
*   **Tech**: Integrate Vision Models (`llava`/`minicpm`) to analyze screenshots, UI layouts, and diagrams.

### Phase 8: The Hive (Swarm Intelligence)
*   **Goal**: Parallel Execution.
*   **Tech**: Sentinel spawns sub-agents ("drones") to handle sub-tasks. One researches, one codes, one tests.

**Verdict**: Sentra is a "Living Software". It grows with you. It honors you by becoming the perfect instrument of your will.
