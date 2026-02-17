# Sentra Genesis v0.2 🧠⚡

**Sentra** is an ultra-lightweight, **Zero-LLM** autonomous agent designed for instant responsiveness and stable long-term memory. Unlike heavy LLM-based agents, Sentra runs entirely on local heuristic algorithms, graph theory, and semantic vectorization.

> **"Intelligence without the hallucination."**

## ✨ Key Features

- **⚡ Instant Response**: Heuristic intent classification (V4) responds in milliseconds.
- **🧠 Persistent Knowledge Graph**: Remembers facts, relationships, and conversations across sessions. Knowledge is stored locally in `data/memory.json`.
- **🗣️ Natural Language Teaching**: Teach Sentra new concepts simply by talking (`"cat is an animal"`).
- **🌱 Active Curiosity**: Sentra asks clarifying questions when it encounters unknown terms instead of hallucinating answers.
- **🔌 Offline First**: No API keys, no heavy model weights (unless using optional LLM plugins).

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher

### Installation

```bash
git clone https://github.com/baihaki00/sentra.git
cd sentra
npm install
```

### Running

```bash
# Start the interactive agent (Clean UI)
npm run sentra
```

Or for verbose debugging:
```bash
node src/genesis/Kernel.js
```

## 🎮 Interaction Examples

**Teaching & Recall:**
```text
You > cat is an animal.
Sentra > Noted.

You > What is a cat?
Sentra > cat is a animal.
```

**Curiosity & Learning:**
```text
You > I like python.
Sentra > That's new to me. What does "python" mean?

You > python is a coding language.
Sentra > Understood. "python" is now a known concept.
```

## 🛠️ Architecture (Genesis v0.2)

Sentra uses a 7-stage cognitive pipeline:

1.  **Tokenization**: Punctuation-aware input parsing.
2.  **Perception**: Maps inputs to Knowledge Graph nodes (`Scaffold.js`).
3.  **Entity Resolution**: Extracts subjects/objects and resolves types (`Entity.js`).
4.  **Intent Classification**: Hybrid Heuristic + Semantic classification (`Intent.js`). Includes "Topic Resume" logic to handle implicit context.
5.  **Expectation**: Predicts likely user intent based on history (`Expectation.js`).
6.  **Response Generation**: Generates dynamic output using linguistic patterns (`Linguistics.js`).
7.  **Reflection**: Background graph optimization and consolidation (`Reflection.js`).

## 📂 Project Structure

- `src/genesis/`: Core cognitive kernel.
- `src/sentra.js`: Clean CLI wrapper.
- `data/seeds/`: Initial knowledge base (e.g., `basic_concepts.json`).
- `Legacy_Hydra/`: Previous LLM-based implementation (archived).

## 📄 License
MIT