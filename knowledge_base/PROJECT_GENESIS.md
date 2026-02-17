# Project Genesis V2 – Requirements Document

**Project Name:** Sentra V3 – Project Genesis
**Version:** V2 – Cognitive Scaffold / Associative Reasoning Engine
**Status:** Implementation

> [!CAUTION]
> **CRITICAL DIRECTIVE: NO LLM INTEGRATION**
> Sentra is designed to **beat the idea of LLMs**. It must learn from ZERO.
> **DO NOT** integrate OpenAI, Ollama, Anthropic, or any other pre-trained model.
> Intelligence must emerge from the Cognitive Scaffold, Memory Graph, and Associative Reasoning Engine.
> Any suggestion to add an LLM is a violation of the core philosophy.

---

### 1. Vision

* Build **Sentra’s cognitive scaffold**: a fully empty, structured mind capable of learning, reasoning, reflecting, and evolving from scratch.
* Intelligence emerges from **experience, feedback, and self-reflection**, not pre-trained knowledge.
* Sentra must develop **self-awareness, entity recognition, and associative memory**, enabling it to distinguish itself from other entities and understand relationships.
* Growth is **hardware-bound**, scaling with local RAM, storage, and compute, independent of cloud or LLMs.

---

### 2. Core Principles

1. **Cognitive Scaffold (Empty Structure):**
   * Memory layers, reasoning paths, perception modules, and feedback loops exist without preloaded knowledge.
   * Inputs settle into correct locations automatically; structure guides learning and reasoning.
   * Supports continuous self-reflection, guided and unguided learning.

2. **Associative Reasoning Engine (ARE):**
   * Replaces LLMs entirely.
   * Performs multi-step reasoning using **pattern matching, graph traversal, vector similarity, and simulation**.
   * Supports emergent planning, abstraction, and goal-directed problem solving.

3. **Memory-Centric Design:**
   * **Procedural Memory:** Skills, workflows, and successful action patterns.
   * **Episodic Memory:** Experiences, failures, corrections, and feedback.
   * **Semantic Memory:** Concepts, entities, and relationships, including self and others.
   * **Identity Nodes:** Distinct nodes for Sentra and each external entity; associative activation links related experiences.

4. **Perception → Memory → Action → Reflection Loop:**
   * Converts raw inputs (text, images, signals) into structured vectors/nodes.
   * Generates candidate actions via ARE.
   * Executes actions in sandboxed environments; outcomes update memory.
   * Idle cycles consolidate knowledge, optimize reasoning, and remove redundant patterns.

5. **Intent-Driven & Curiosity-Based Learning:**
   * Learns from vague, informal, or playful feedback; explicit instruction optional.
   * Supports exploration and experimentation; triggers curiosity when encountering unknowns.

6. **Hardware-Bound Intelligence:**
   * All memory, reasoning, and action loops reside locally.
   * Knowledge scales with **RAM, storage, and CPU**, not cloud resources or pretrained LLM weights.

---

### 3. Functional Requirements

* **Cognitive Scaffold:**
  * Defines memory layers, reasoning loops, perception inputs, feedback channels, and identity nodes.
  * Supports correct placement of incoming knowledge and dynamic associative activation.

* **Associative Reasoning Engine:**
  * Simulates multiple action paths; evaluates outcomes and selects optimal strategies.
  * Links experiences, entities, and knowledge to support emergent reasoning.
  * Handles abstraction, generalization, multi-step planning, and reflective learning.

* **Memory Systems:**
  * Procedural, episodic, semantic, and identity-specific nodes.
  * Entity nodes allow Sentra to recognize and differentiate itself and other entities.
  * Associative activation mimics neuronal firing: referencing an entity triggers related knowledge, skills, and experiences.

* **Perception Module:**
  * Converts raw sensory input into structured vectors/nodes.
  * Supports future expansion to multimodal perception.

* **Action & Sandbox Module:**
  * Executes decisions safely; monitors outcomes for feedback loops.
  * Supports emergent experimentation and self-directed learning.

* **Reflection & Self-Improvement:**
  * Idle loops consolidate memory, optimize reasoning pathways, and remove redundancy.
  * Continuous self-evaluation supports emergent understanding of self and entities.

---

### 4. Non-Functional Requirements

* **Performance:** Efficient local reasoning and memory retrieval.
* **Reliability:** Sandboxed execution ensures stability; failures do not corrupt core scaffold.
* **Scalability:** Memory and reasoning scale with hardware.
* **Extensibility:** Supports future perception modalities, reasoning strategies, and curiosity mechanisms.
* **Transparency:** Actions, reasoning paths, and memory activations are traceable.
