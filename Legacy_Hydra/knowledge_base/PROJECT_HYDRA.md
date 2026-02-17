# Project Hydra: The Neuromorphic Architecture

> **Goal**: Decouple Sentra's "Intelligence" from the LLM bottleneck.
> **Philosophy**: "Bio-Mimicry for Computation." The brain does not use the Neocortex for walking; Sentra should not use the LLM for `ls -la`.

## 1. The Architectural Stack

Sentra V2 will operate as a nervous system with 5 distinct layers, ordered by latency (fastest to slowest).

### Layer 1: The Reptilian Brain (Reflex Arc)
- **Biological Analog**: Brainstem / Basal Ganglia.
- **Function**: Immediate, deterministic response to strict patterns.
- **Technology**: Regex, Finite State Machines (FSM).
- **Latency**: < 10ms.
- **Examples**: 
    - `/stop` -> Terminates process.
    - `Calculate 5 + 5` -> `eval('5+5')`.
    - `Delete file X` -> `fs.unlink(X)`.
- **Constraint**: Zero ambiguity allowed. If 99% sure, pass to Layer 2.

### Layer 2: The Limbic System (Safety & Memory)
- **Biological Analog**: Amygdala (Fear/Safety) + Hippocampus (Memory).
- **Function**: Threat detection and Semantic Caching.
- **Technology**: Vector Database (VisualMemory), Keyword Filters.
- **Latency**: < 50ms.
- **Logic**:
    1.  **Amygdala Check**: Does input contain "rm -rf /", "upload keys", or known prompt injection? -> BLOCK.
    2.  **Hippocampus Check**: `CosineSimilarity(Input, CachedSuccess) > 0.98`? -> RETURN CACHE.

### Layer 3: The Thalamus (The Router)
- **Biological Analog**: Thalamus (Sensory Relay).
- **Function**: Classifies input complexity. Routes to Cerebellum or Neocortex.
- **Technology**: Lightweight Classifier (TinyBERT, Quantized 0.5B Model, or Bayesian Filter).
- **Latency**: < 100ms.
- **Output**: Class Label (`SKILL`, `SYSTEM_1`, `SYSTEM_2`).

### Layer 4: The Cerebellum (Procedural Skills)
- **Biological Analog**: Muscle Memory.
- **Function**: fast execution of parameterized workflows.
- **Technology**: `SkillManager.js` (Parameterized Plans).
- **Latency**: 100ms - 2s.
- **Trigger**: Thalamus labels input as `SKILL`.
- **Action**: Load `skills.json` entry, fill params, execute WITHOUT re-planning.

### Layer 5: The Neocortex (Executive Function)
- **Biological Analog**: Prefrontal Cortex.
- **Function**: Novel problem solving, reasoning, planning.
- **Technology**: Large Language Model (Qwen/Llama).
- **Latency**: 5s - 60s+.
- **Modes**:
    - **System 1**: Single-shot generation.
    - **System 2**: Tree of Thoughts (Deliberation).

## 2. Data Flow
```mermaid
graph TD
    UserInput --> Reflex[Reptilian: Reflex (<10ms)]
    Reflex -- Match --> Action
    Reflex -- No Match --> Limbic[Limbic: Safety/Cache (<50ms)]
    
    Limbic -- Threat --> Reject
    Limbic -- Cache Hit --> ReturnCache
    Limbic -- Miss --> Thalamus[Thalamus: Router (<100ms)]
    
    Thalamus -- "Known Pattern" --> Cerebellum[Cerebellum: Skill (1s)]
    Thalamus -- "Simple Novel" --> NeocortexS1[Neocortex: System 1 (5s)]
    Thalamus -- "Complex Novel" --> NeocortexS2[Neocortex: System 2 (60s+)]
    
    Cerebellum --> Action
    NeocortexS1 --> Action
    NeocortexS2 --> Action
```

## 3. Implementation Contracts

### A. The Thalamus Contract
```javascript
class Thalamus {
    classify(input) {
        // Returns: 'REFLEX' | 'SKILL' | 'SYSTEM_1' | 'SYSTEM_2'
    }
}
```

### B. The Limbic Contract
```javascript
class LimbicSystem {
    assess(input) {
        // Returns: { safe: boolean, cacheHit: object|null }
    }
}
```

## 4. Risks & Mitigations
- **Routing Failure**: Neocortex task routed to Reflex.
    - *Mitigation*: Fallback loop. If Reflex fails, escalate to Thalamus.
- **Cache Poisoning**: Storing hallucinations.
    - *Mitigation*: Only cache `verified` results (code that passed tests, browsing that yielded 200 OK).

## 5. Experiment: "Project Hydra Alpha"
We will build the **Thalamus** first. It will sit in front of the current Agent and simply log "Proposed Route" vs "Actual Route" to train the router.
