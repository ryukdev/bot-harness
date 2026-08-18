# bot-harness 🪑

**one thread. many accounts. never a break.**

Keep your Claude Code session alive when an account runs out of room on the
model you use — by switching to another account *you own* and resuming the
**same conversation**. No new chat, no re-login. Works with **any Claude model**.

![demo](assets/demo.svg)

## How it works

![how it works](assets/how-it-works.svg)

A Claude Code session's account is fixed the instant its process starts — the
desktop app injects its token before any shell runs, so nothing on your machine
can choose it. But the conversation is a local, **account-agnostic transcript**:
`claude --resume <id>` under another account continues the same thread. So
bot-harness picks a healthy account from your pool and re-opens your thread on it.

## Install

```bash
git clone https://github.com/ryukdev/bot-harness ~/.bot-harness-src
ln -sf ~/.bot-harness-src/bin/bot-harness /usr/local/bin/bot-harness
bot-harness doctor
```

No build, no dependencies — plain node (18+) and the `claude` CLI.

Or paste this into Claude Code and let it set itself up:

```text
Clone https://github.com/ryukdev/bot-harness into ~/.bot-harness-src, read
install.md, install it so `bot-harness` is on my PATH, register it as a skill
named bot-harness using SKILL.md, then walk me through onboarding.
```

## Use

```bash
bot-harness config model opus            # the model whose limit you actually hit (any Claude model)
bot-harness token add you@work.com  sk-… # add each account you own (paste the token)
bot-harness token list                   # your emails + who has headroom right now
bot-harness status                       # which account THIS session is paying
bot-harness seat                         # switch this thread to a healthy account
bot-harness app on                       # make the DESKTOP APP pick a healthy seat on reconnect
```

Your tokens live only in `~/.bot-harness/accounts.json` (chmod 600) — never
printed, never committed, never sent anywhere. bot-harness stores and routes; it
never acquires or transmits credentials.

## Architecture

![architecture](assets/architecture.svg)

- **Core** (standalone): your account pool → the prober asks each account whether
  it has headroom on your model → the router picks a healthy one → `seat` resumes
  the thread there. `app on` shims the desktop app so its sessions pick a healthy
  seat on reconnect; `app off` restores.
- **Addon** (optional): serve your outputs on your own tailnet — a link that opens
  with no login. Absent, it falls back to a local file. Never required.
- **The honest limit:** switches happen at process birth — one reconnect per swap,
  and the Claude **mobile** app just disconnects. That's physics of processes.

## What it does NOT do yet — and where sharingu takes over

bot-harness is honest about its edges. Every one is a process limit, and every
one is exactly what a database-backed thread fixes.

| today, with bot-harness | tomorrow, with sharingu |
|---|---|
| one **reconnect** per swap (not zero-click) | seats rotate **while you type**, announced |
| **no mobile** — the Claude mobile app drops on a switch | any **phone browser**, no reconnect |
| **artifacts** need your own tailnet (an addon) | **native** output serving, built in |
| switches **accounts** only | **smart routing across N models, LLMs & harnesses** |
| **session rotation** is coming (v0.2) | sessions refresh **mid-thread**, backed by a real spine |

Same idea, two depths: bot-harness keeps your thread alive across accounts on
your machine; **sharingu** makes seats, sessions, models and harnesses all
swap seamlessly underneath one thread — because the thread lives in a database,
not a process.

## The upgrade → sharingu

For seats **and** sessions that rotate *while you type* — announced, and on any
phone browser with no reconnect — you need a thread that lives in a database, not
a process. That's a stronger spine:
**[sharingu](https://github.com/ryukdev/sharingu)**.

bot-harness is the wedge. sharingu is where the limit stops existing.

---

MIT · built by [ryukdev](https://github.com/ryukdev)
