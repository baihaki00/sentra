# 🌌 Genesis Operator Manual

## 1. Launch Protocol
```bash
node src/genesis/Kernel.js
```

## 2. Interaction Modes

### 🗣️ Conversational (Perception)
Just type to Sentra. It will map your input to concepts.
- `hello` -> `[CONCEPT:hello]`
- `files` -> `[CONCEPT:files]`

### 👨‍🏫 Teaching (Association)
Link a phrase to an action.
```text
teach "list current directory" -> LIST_FILES { "path": "." }
teach "who am i" -> ECHO { "message": "I am Sentra." }
```

### 🧭 Exploration (Curiosity)
Let Sentra drive.
- `/explore`: Run one curiosity cycle.
- `/auto`: Start continuous autopilot (every 5s).
- `/stop`: Stop autopilot.

## 3. System Commands
- `/exit`: Shutdown kernel.
