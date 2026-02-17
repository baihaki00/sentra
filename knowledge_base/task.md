# Project Genesis V2 – Roadmap

> **Vision**: A self-learning AGI scaffold that grows from scratch.

- [x] **Milestone 1: Cognitive Scaffold Prototype**
    - [x] **Memory**: `KnowledgeGraph` (Nodes/Edges) implemented.
    - [x] **Reasoning**: `ReasoningEngine` (MCTS Pathfinding) implemented.
    - [x] **Verification**: `test_genesis.js` proved logical traversal (A->B->C).

- [x] **Milestone 2: Seed Program (Genesis Kernel)**
    - [x] **Objective**: Minimal loop for Perception -> Memory -> Action -> Reflection.
    - [x] Implement `src/genesis/Kernel.js` (Loop Controller).
    - [x] Implement `src/genesis/ActionBinder.js` (Tool Output -> Memory).

- [x] **Milestone 3: ARE Prototype (Associative Reasoning)**
    - [x] **Objective**: Multi-step simulation without pre-trained weights.
    - [x] Enhance MCTS with "Imagination" (Backward Chaining for Prerequisites).
    - [x] Implement `GraphWalker.js` (Integrated into ReasoningEngine).

- [x] **Milestone 4: Memory Integration (Layers & Identity)**
    - [x] **Objective**: Differentiate Procedural, Episodic, Semantic, and Identity.
    - [x] Implement `IdentityNode` logic (Self vs Others).
    - [x] Implement `ProceduralMemory` (Skill Storage via Action Dependencies).

- [x] **Milestone 5: Learning Loop (Curiosity)**
    - [x] **Objective**: Active exploration.
    - [x] Implement `Curiosity.js` (Entropy-based exploration).
    - [x] Implement `Reflection.js` (Active Learning Loop in Kernel).

- [x] **Milestone 6: Benchmarking & Stress Test**
    - [x] **Objective**: 1000+ random tasks.
    - [x] Create `test_stress.js`: Arithmetic, Logic, Coding, Pattern Rec.
    - [x] Visualize Growth Curve (Tasks solved vs Time).

- [x] **Milestone 15: The School (Bulk Training)**
    - [x] Create `school.js` (Inject 50 common phrases).
    - [x] Create `exam.js` (Run 100 prompts).
    - [x] Verify Robustness (No "Unknown Action" for basic inputs).

- [x] **Milestone 16: Persistence & Path Fixes**
    - [x] Fix `Memory.js` path resolution (Absolute vs CWD).
    - [x] Fix `kernel_ops.rs` working directory.
    - [x] Verify CLI and GUI share the same brain.

- [x] **Milestone 17: Cognitive Upgrade (Fuzzy Matching)**
    - [x] **Objective**: Handle natural language variations.
    - [x] Update `Scaffold.js` to scan for known triggers within input.
    - [x] Enable "contains" logic (e.g., "list my files" -> "list files").

## Future Roadmap (Next Agent)
> **Goal**: True AGI without LLMs. Pure Graph-Based Reasoning.
- [ ] **Milestone 18: Hebbian Learning** (Dynamic edge weighting based on usage).
- [ ] **Milestone 19: Spreading Activation** (Simulate "Attention" flowing through the graph).
- [ ] **Milestone 20: Recursive Evolution** (System rewrites `Scaffold.js` to improve itself).
    - [ ] Enable self-modification of reasoning parameters.

- [ ] **Milestone 7: Continuous Self-Improvement**
    - [ ] **Objective**: Emergent reasoning.
    - [ ] Enable self-modification of reasoning parameters.

# Phase 2: Command Center (Rust Native)

- [x] **Milestone 8: Rust Scaffold**
    - [x] Initialize `src/command_center` (Cargo Project).
    - [x] Implement `kernel_ops` (Tokio process manager).
    - [x] Create Egui UI (Start/Stop/Log Panel).

- [x] **Milestone 9: The Native Graph**
    - [x] Implement `wgpu` Graph Renderer.
    - [x] Integrate IPC Telemetry Stream.
    - [x] Optimize for 100k+ nodes (Instance Rendering).

