# Sentra Genesis - Logging

## Verbose Mode

By default, Sentra runs in **quiet mode** showing only essential output:
- User messages
- Sentra responses
- Warnings and errors

### Enable Verbose Logging

**Method 1: Command-line flag**
```bash
node src/genesis/Kernel.js --verbose
```

**Method 2: Environment variable**
```bash
$env:VERBOSE="true"
node src/genesis/Kernel.js
```

### Log File

All logs (regardless of console verbosity) are saved to:
```
./data/debug.log
```

This includes:
- Pipeline stage outputs
- Entity extraction details
- Intent classification scores
- Attention gating results  
- Reflection/learning events
- All internal processing logs

### Log Levels

- `DEBUG` - Low-level processing details (verbose only)
- `INFO` - General pipeline information (verbose only)
- `WARN` - Warnings (always shown)
- `ERROR` - Errors (always shown)
- `USER` - User-facing messages (always shown)

---

**Tip:** Review `debug.log` after conversations to understand Sentra's internal reasoning process.
