---
description: How full is this chat, and which account is paying for it
allowed-tools: Bash(bot-harness session status), Bash(bot-harness status)
---

Run `bot-harness session status` and `bot-harness status`, then reply in ONE line:

    session <id> · memory used: ~<n>k of 200k (<pct>% full) · paying: <account>

Nothing else. No preamble, no explanation.

The memory figure is a cost signal, not a headroom gauge — it counts the thread, not the
harness scaffolding around it, and it drifts high if Claude Code has compacted this session on
its own. Don't present it as "room left".
