# Protocol: "IQ 180" (The Cognitive Upgrade)

**Objective**: Transform Sentra from a "Smart Tool" into a "Digital Intellectual".
**Goal State**: A system that thinks like a human (associative, reflective), remembers everything (perfect recall), and solves novel problems with genius-level capability (System 2 reasoning).

---

## The Gap: Why Sentra isn't "Human" yet
Currently, Sentra is a **Linear Thinker** (`Plan -> Act -> Check`).
*   **Limitation 1 (Memory)**: It uses Vectors ("King" is close to "Queen"). It lacks **Structure** ("King" *rules* "Kingdom"). It has perfect storage but fuzzy recall.
*   **Limitation 2 (Blindness)**: It reads text. It cannot see UIs, charts, or spatial relationships.
*   **Limitation 3 (Impulsiveness)**: It answers immediately (System 1). It doesn't "sit back and think" for 10 minutes before writing code (System 2).

---

## The Proposal: Phase 6 - Cognitive Architecture

To achieve "IQ 180", we must replicate the biological components of high intelligence.

### 1. The Hippocampus (Knowledge Graph)
*   **Concept**: Vectors find similarities. Graphs find **Relationships**.
*   **Upgrade**: Implement a **Graph Database** (using `sqlite` or a graph lib) alongside the Vector DB.
*   **Behavior**: When you mention "Project X", Sentra doesn't just find text containing "Project X". It retrieves the *entire constellation* of related files, people, dependencies, and past failures linked to it.
*   **Human Equivalent**: Associative Memory ("This reminds me of that one time...").

### 2. The Prefrontal Cortex (System 2 Reasoning)
*   **Concept**: Slow, deliberate thought.
*   **Upgrade**: Implement a **"Tree of Thoughts"** planner.
    *   Instead of picking the first plan, Sentra generates 3 possible paths.
    *   It simulates the outcome of each in its "imagination" (prompt).
    *   It picks the winner *before* touching the keyboard.
*   **Human Equivalent**: Planning a chess move. "If I go here, he goes there... no, that's bad. I'll go here instead."

### 3. The Visual Cortex (Multimodal Input)
*   **Concept**: High IQ involves processing information from all senses.
*   **Upgrade**: Integrate a Vision Model (`minicpm-v` or `llava`).
*   **Behavior**:
    *   Sentra can look at a screenshot of an error message.
    *   Sentra can read a PDF chart.
    *   Sentra can browse a website as a human does (visually), not just as HTML code.
*   **Human Equivalent**: Sight.

### 4. The Subconscious (Dreaming)
*   **Concept**: Optimization during downtime.
*   **Upgrade**: A background process that runs when you aren't talking to it.
    *   It reads through today's logs.
    *   It condenses "What did I learn?" into long-term maxims.
    *   It refactors its own memory to be more efficient.
*   **Human Equivalent**: Sleep/Consolidation.

---

## Suggested Priority: "System 2 Reasoning"
If you want **IQ 180**, the most critical upgrade is the ability to **THINK before ACTING**.
Most AI fails because it tries to solve complex coding tasks in one shot.
I propose we build the **"Tree of Thoughts"** engine first. This will make Sentra smarter immediately, allowing it to solve problems it currently fails at.

**Do you accept this evolution?**
