---
name: bot-harness
description: Keep one Claude Code thread alive across context limits and across the user's own Claude accounts. Use when the user asks to rotate/refresh the session or free up context, for the session id, which account/fuel they're on, or to switch accounts.
---

# bot-harness

Keeps ONE Claude Code thread going when it would otherwise end — when the context fills, or when the
account paying for it runs out of room. The account pool is email-keyed in
`~/.bot-harness/accounts.json` (chmod 600) — never print a token.

## Response style (important)

Answer in **ONE short line** — run the command, show the result, stop. No explanations, no caveats,
no "let me…", no paragraphs. Be a crisp tool, not a chatbot. (The honest limits are documented; don't
recite them on every reply.)

## Commands

| user asks | run | reply (one line) |
|---|---|---|
| rotate / refresh the session, free up context | `bot-harness session rotate --in-place` | `context refreshed — same chat, work carried over · memory 14k → 0.7k (95% freed)` |
| session id? how full? | `bot-harness session status` | `<id> · memory used: ~<n> of 200k` (a cost signal, not a headroom gauge — see LEARNINGS 8b) |
| switch to <name/email> | `bot-harness switch <email>` | `→ <email>` |
| which account / fuel? | `bot-harness status` | the email |
| what accounts do I have? | `bot-harness token list` | emails + who has headroom |
| set the model | `bot-harness config model <name>` | `model → <name>` |
| keep it working on my phone | `bot-harness mobile on` | `mobile continuity on` |

Never read `~/.claude.json` for the account — `bot-harness status` is the real paying account.

## How it works (one paragraph)

The conversation is a local, account-agnostic transcript. `rotate --in-place` seeds a fresh
transcript with a handoff of the work under the **same session id** — so the context resets without
a lossy compact and without a new window. `switch` picks a healthy account from the user's own pool
and re-opens the same thread on it; the account is fixed at process start, so the switch applies on
the restart the auto-reconnect performs. bot-harness runs the official `claude` binary with the
user's own accounts — no relay, no proxy, nothing transmitted.

## Honest limits (documented, not recited)

Each operation costs one brief reconnect. Mobile survives an account switch on its own; a rotate
re-registers Remote Control only when `bot-harness mobile on` is set, because rewriting the
transcript archives the old remote session. Every one of these is a property of a process, not a
bug to be fixed here. See LEARNINGS.md.
