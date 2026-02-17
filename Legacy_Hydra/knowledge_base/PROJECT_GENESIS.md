# Project Genesis: The Post-LLM Architecture
> "Intelligence is not about predicting the next token. It's about finding the path to the goal."

## The Philosophies
1.  **Zero-Shot is a Lie**: We reject pre-trained "world knowledge". Sentra must learn that "water is wet" by interacting with water (or data representing it).
2.  **The Graph is the Mind**: Knowledge is not weights; it is connections. A dynamic **Knowledge Graph (KG)** will store every concept, relationship, and probability Sentra discovers.
3.  **Reasoning is Search**: "Thinking" is traversing the KG to find a path from *State A* (Problem) to *State B* (Solution). We will use **Monte Carlo Tree Search (MCTS)** or **A*** instead of Transformer layers.
4.  **Hardware Sovereign**: The "Brain" is just RAM (Graph nodes) and CPU (Traversal). No GPU requirement.

## The Architecture: "Associative Reasoning Engine" (ARE)

### 1. Perception (The Input)
- **Constraint**: No generative models.
- **Mechanism**:
    - **Tokenizer**: Breaks input into atomic units (words, bytes, or n-grams).
    - **Encoder**: Maps units to IDs in the Knowledge Graph.
    - *Optional*: A tiny, frozen embedding model (e.g., `MiniLM`) strictly for "sensory" similarity, akin to a retina.

### 2. Memory (The Storage)
- **Episodic Graph**: A temporal log of "Input -> Action -> Outcome".
- **Semantic Graph**: A condensed map of "Concept A --[relation]--> Concept B".
- **Technology**: `GunDB` (Decentralized Graph) or a custom in-memory Node/Edge structure persisted to JSON/Binary.

### 3. Reasoning (The Core)
- **The "Walker"**: A loop that looks at the current Concept Node.
- **Pattern Matching**: "Have I seen this state before?" (Graph Query).
- **Prediction**: "If I take Action X, what usually happens?" (Edge Weight).
- **Exploration (Curiosity)**: If confidence is low, try a random Action or ask a question.

### 4. Output (The Act)
- **Action Construction**: Re-assembling tokens/nodes into a sequence (like a command or sentence).
- **Feedback Loop**: User feedback ("Good"/"Bad") back-propagates to adjust Edge Weights.

## The Genesis Kernel (v0.1)
We will build a minimal JS kernel that does:
1.  **REPL**: Read, Eval, Print, Loop.
2.  **Associate**: Store input sequences.
3.  **Echo**: Initially, it will just parrot.
4.  **Mutate**: It will randomly swap words/commands.
5.  **Select**: If user doesn't crash/complain, strengthen that mutation.

## Roadmap
1.  **Archive**: Move `d:\ClosedClaw` to `d:\ClosedClaw\Legacy_Hydra`.
2.  **Init**: Create clean `src/genesis/`.
3.  **Bootstrap**: Teach it "Hello". Teach it "List Files". Teach it "Reason".

**This is the hard path.** But it is the only path to true, self-owned AGI.
