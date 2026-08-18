---
name: bot-harness
description: Keep one Claude Code thread alive across the user's multiple Claude accounts and sessions. Use when the user asks which account/fuel they're on, to switch accounts, for the session id, or to rotate/refresh the session.
---

# bot-harness

Keeps ONE Claude Code thread alive across the user's own Claude accounts and sessions. The pool is
email-keyed accounts in `~/.bot-harness/accounts.json` (chmod 600) — never print a token.

## Response style (important)

Answer in **ONE short line** — run the command, show the result, stop. No explanations, no caveats,
no "let me…", no paragraphs. Be a crisp tool, not a chatbot. (The honest limits are documented; don't
recite them on every reply.)

## Commands

| user asks | run | reply (one line) |
|---|---|---|
| which account / fuel? | `bot-harness status` | the email |
| what accounts do I have? | `bot-harness token list` | emails + who has headroom |
| switch to <name/email> | `bot-harness switch <email>` | `→ <email>` (add "restart to apply" only if asked) |
| session id? | `bot-harness session status` | `<id> · <n> turns` |
| new / rotate session | `bot-harness session snapshot` | `snapshotted <n> turns → fresh session ready` |
| set the model | `bot-harness config model <name>` | `model → <name>` |

Never read `~/.claude.json` for the account — `bot-harness status` is the real paying account.

## How it works (one paragraph)

A session's account is fixed at process start (the app injects its token). The conversation is a
local, account-agnostic transcript — so `claude --resume` under another account continues the same
thread. `switch` stages a healthy account as the seat; a session RESTART applies it. `session rotate`
snapshots the work into a handoff and opens a fresh clean session seeded with it.

## Honest limits (documented, not recited)

Switches take effect on a session restart (the account is process-bound). Session rotate opens a NEW
session/window carrying the work — keeping the SAME window while the session rotates underneath needs
a database-backed thread → sharingu. See LEARNINGS.md.
