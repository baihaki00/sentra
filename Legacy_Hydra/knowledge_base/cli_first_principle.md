# CLI First Principle

> **If the CLI is broken, don't expect Telegram bot or WebUI to be fancy.**

## The Law

The CLI (`src/cli.js`) is the **foundation** of Sentra. Every other interface (Telegram bot, Web Dashboard, API) ultimately calls the same core:

```
CLI → SentraCore → Agent → Pipeline → Tools
Telegram → SentraCore → Agent → Pipeline → Tools
WebUI → SentraCore → Agent → Pipeline → Tools
```

The CLI is the **first and last line of defense**. If it crashes, everything downstream is broken.

## Testing Priority

1. **Unit Tests** (`test_regression.js`) — Individual modules in isolation
2. **Stress Tests** (`test_stress.js`) — Push limits across domains
3. **E2E CLI Tests** (`test_e2e_cli.js`) — Full lifecycle through the CLI path
4. **Integration Tests** — Cross-module interactions (Pipeline ↔ Memory ↔ Cognitive)
5. **Telegram/WebUI Tests** — Only after CLI is rock-solid

## Rule

**Never ship a Telegram or WebUI feature without first verifying the CLI path works.** The CLI is the canary in the coal mine.

## Running Tests

```bash
# The test pyramid (run in order)
node src/test_regression.js   # Unit tests (54 tests, <1s)
node src/test_stress.js       # Stress tests (62 tests, <1s)
node src/test_e2e_cli.js      # E2E CLI tests (40 tests, ~3min with Ollama)
```
