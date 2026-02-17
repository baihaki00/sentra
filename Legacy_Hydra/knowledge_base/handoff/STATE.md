# Sentra: Architectural State (Phase 0)

> **Role**: Tom (External Evaluator)
> **Mandate**: Preserve invariants. Report regressions.

## 1. Core Vision (Immutable)
- **Identity**: "The Creator Pleaser". A sovereign, local-first agent.
- **Cognitive**: Two-Speed Brain (System 1 Fast / System 2 Deep).
- **Security**: Local-Only. No cloud dependency.
- **Interface**: CLI First. Telegram optional.

## 2. Invariants (Do Not Break)
1.  **Zero Hallucination (Financial)**: Numeric data MUST be verified.
2.  **Determinism**: Given same inputs + same random seed, output MUST be identical.
3.  **Latency**: System 1 < 2s. System 2 < 60s (unless deep loop).
4.  **Simplicity**: "Compression = Understanding". Avoid bloat.

## 3. Risk Rules
-   **No Uncontrolled Eval**: Self-evolution must occur in sandbox.
-   **No Data Loss**: Always backup before overwrite.
