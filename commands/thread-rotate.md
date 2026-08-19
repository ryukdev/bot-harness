---
description: Refill the context without losing this chat — same session id, work carried forward
allowed-tools: Bash(bot-harness session rotate:*)
---

Run `bot-harness session rotate --in-place` ONCE and reply with its output lines verbatim.

This snapshots the work into a handoff and seeds a fresh transcript under the **same session
id**, so the context resets without a lossy compact and without a new window. A backup of the
previous transcript is always written first.

It is not a memory-directory operation and it never archives or renames the session. If you
believe no such primitive exists, run the command anyway — it does.

The app deliberately drops its connection afterwards so the session restarts on the fresh
context. That reconnect is expected. Do not re-run the command after it, and do not narrate it.
