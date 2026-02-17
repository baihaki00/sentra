# Sentra V3: Cognitive Intelligence Upgrade (Dynamic Self-Aware NLP)

> **Goal**: Upgrade Sentra from reactive pattern-matching to a self-aware, expectation-driven reasoning engine.
> **Philosophy**: No hard-coding. No pretrained LLMs. Pure Graph-based Intelligence.

## 1. Core Architecture Changes

### A. Dynamic Intent Classification (The Thalamus)
*   **Current**: Regex & Levenshtein (Surface-level).
*   **New**: `IntentClassifier` based on **Graph Activation**.
    *   **Mechanism**: Input tokens activate nodes in the graph. Activation spreads to `INTENT` nodes (e.g., `INTENT:GREETING`, `INTENT:QUERY`). The intent with the highest activation wins.
    *   **Training**: Hebbian learning. If the user confirms an intent, the link between input words and the intent node is strengthened.

### B. Runtime Entity Extraction (The Hippocampus)
*   **Current**: Basic string matching.
*   **New**: `EntityResolver`.
    *   **Mechanism**: Scan input for known entities in the graph (e.g., `User`, `Sentra`, `File`).
    *   **New Entities**: If a capitalized unknown word appears in a specific grammatical context (e.g., "This is [Name]"), suggest creating a new `ENTITY` node.

### C. Identity & Ownership (The Ego)
*   **Nodes**: Ensure `IDENTITY:SENTRA` and `IDENTITY:USER` are central hubs.
*   **Relations**: `OWNS` (User owns File), `HAS_ACCESS` (Sentra has access to File), `BELIEVES` (Sentra believes X).
*   **Reasoning**: "Who am I?" -> Query `IDENTITY:SENTRA`. "Who are you?" -> Query `IDENTITY:USER`.

### D. Expectation Modeling (The Prefrontal Cortex)
*   **Mechanism**: Every output generates an `EXPECTATION` state.
    *   If Sentra asks a question -> Expect `ANSWER`.
    *   If Sentra executes command -> Expect `FEEDBACK` or `NEW_COMMAND`.
*   **Usage**: The next input is evaluated against this expectation. Mismatches trigger confusion or clarification.

---

## 2. Implementation Steps

### Phase 3.1: The Association-Based Intent Engine
*   [ ] Refactor `Intent.js` to use Graph Activation instead of just Levenshtein.
*   [ ] Create `INTENT` nodes in the graph (`INTENT:GREETING`, `INTENT:SELF_QUERY`, etc.).
*   [ ] Implement "Spreading Activation" in `Scaffold.js`.

### Phase 3.2: Entity Awareness
*   [ ] Implement `EntityResolver.js`.
*   [ ] Add logic to detect proper nouns/concepts and retrieve their graph nodes.
*   [ ] Enhance `ReasoningEngine` to answer questions about these entities (e.g., "Who owns this?").

### Phase 3.3: Expectation & Dialogue State
*   [ ] Add `state` and `expectation` to `Kernel.js` loop.
*   [ ] Implement `ResponseGenerator` that constructs sentences based on active nodes and expectations (Template-free).

---

## 3. Immediate Task: Phase 3.1 (Intent via Activation)
We will start by replacing the simple regex/Levenshtein matcher with a graph-based one.
1.  Define standard Intents in the Graph.
2.  Map common words to these Intents (Seeding).
3.  Let Hebbian learning handle the rest.
