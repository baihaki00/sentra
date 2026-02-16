# Sentra AI 🧠🤖

**Sentra** is a powerful, local-first autonomous agent designed to be your personal digital assistant. Built on a "Thinking" architecture (ReAct), Sentra plans its actions, executes them using a suite of tools, and learns from its experiences.

> **"Jarvis-like" intelligence, running entirely on your machine.**

## ✨ Features

- **🧠 Local Intelligence**: Powered by **Ollama** (default: `qwen3:8b`), keeping your data private and offline-capable.
- **🔎 Autonomous Research**: Equipped with a stealth browser (Puppeteer) to search DuckDuckGo, read websites, and synthesize information without getting blocked.
- **💻 Code Execution**: safely writes and runs **JavaScript** and **Python** code to solve complex math or logic tasks.
- **💾 Long-Term Memory**: Remembers facts and context across sessions using a local JSON vector store.
- **🛡️ Robust & Reliable**: Uses a strict **Plan -> Act -> Observe** loop to prevent hallucinations and loops.
- **CLI Interface**: A beautiful, interactive terminal UI with animated spinners and colorful output.

## 🚀 Installation

### Prerequisites
1.  **Node.js**: v18 or higher.
2.  **Ollama**: [Download and install Ollama](https://ollama.com).
3.  **Python**: (Optional) For Python code execution capabilities.

### Setup

```bash
# Clone the repository
git clone https://github.com/baihaki00/sentra.git
cd sentra

# Install dependencies
npm install

# Pull the default model (or use your own)
ollama pull qwen3:8b
```

## 🎮 Usage

Start the agent:

```bash
node src/cli.js
```

### Example Commands

- **Research**: "Search for the latest news on SpaceX and summarize it."
- **Coding**: "Write a Python script to calculate the first 100 Fibonacci numbers."
- **Memory**: "My favorite color is blue." -> (Later) -> "What is my favorite color?"
- **General**: "Who is Jeffrey Epstein?" (Sentra will research and provide a factual answer).

## 🛠️ Architecture

Sentra operates on a **Loop**:
1.  **INIT**: Loads tools and connects to Ollama.
2.  **PLAN**: The LLM generates a thought process based on the user request.
3.  **ACT**: Executes a specific tool (e.g., `google_search`, `execute_python`).
4.  **OBSERVE**: Reads the tool output.
5.  **REFLECT**: Decides whether the task is complete or needs more steps.

## 🗺️ Roadmap

- [ ] **Voice Interaction**: Text-to-Speech (TTS) and Speech-to-Text (STT).
- [ ] **Vision**: Ability to "see" and analyze screen content.
- [ ] **Scheduling**: Autonomous background task execution.

## 📄 License

MIT