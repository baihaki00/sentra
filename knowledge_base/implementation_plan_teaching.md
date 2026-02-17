# Phase 2.5: Natural Language Teaching

> **Problem**: Sentra failed to understand "when i say huh it means that im curious".
> **Solution**: Implement a "Teaching Pattern Recognizer" in the Intent Engine.

## Proposed Changes

### 1. Update `Intent.js`
*   Add `detectTeaching(input)` method.
*   Pattern 1: `^when i say (.+) it means (.+)$`
*   Pattern 2: `^"(.+)" means "(.+)"$`
*   Action: Call `scaffold.associate(trigger, target, 'ALIAS')`.

### 2. Update `Kernel.js`
*   In the loop, before checking for Actions, check `intent.detectTeaching(input)`.
*   If teaching is detected, execute the association and reply "Understood. 'X' is now an alias for 'Y'."

## Verification
*   User Input: "when i say huh it means curiosity"
*   System: Creates edge `huh` --(ALIAS)--> `curiosity`.
*   User Input: "huh"
*   System: Triggers `curiosity` (which asks "What is curiosity?" if not an action, or executes if it is).
