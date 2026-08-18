# bot-harness 🪑

**one thread. many accounts. never a break.** — keep your Claude Code desktop
session alive when an account runs dry, by switching to another account you own
and resuming the *same* conversation. No new chat, no re-login.

```
  ● you: hit the Fable limit on account A
  │
  ● bot-harness seat → probes your accounts → account B has headroom
  │
  ● resume the same thread on account B → Fable answers
  ✓ same conversation, new payer, zero logins
```

**Your accounts, your machine, your thread.** bot-harness never creates or
uploads anything — it gathers the Claude accounts you already have into one
pool, probes which has headroom on the model tier you need (quota isn't
queryable — you have to ask), and re-opens your current thread on a healthy one.

## Setup prompt

Paste into Claude Code:

```text
Clone https://github.com/ryukdev/bot-harness into ~/.bot-harness-src (its home),
read install.md, install it so `bot-harness` is a command on my PATH, register
it as a skill named bot-harness using SKILL.md as the body, then read
onboarding.md and walk me through adding my accounts.
```

## Use

```bash
bot-harness token add  you@work.com   sk-ant-oat-…   # add each account (paste token)
bot-harness token list                               # emails + who has headroom now
bot-harness status                                   # which account THIS session pays
bot-harness seat                                     # switch this thread to a healthy account
bot-harness app on                                   # make the DESKTOP APP pick a healthy seat on reconnect
bot-harness doctor                                   # verify the chain
```

## Why this works

A Claude Code session's account is fixed the instant its process starts — the
desktop app injects its token before any shell runs, so no machine config can
select it. But the conversation is a local, account-agnostic transcript:
`claude --resume <id>` under another account continues the same thread. So
bot-harness picks a healthy account from your pool and re-opens the thread on it.

`bot-harness app on` handles the desktop app, whose remote CLI ignores the
machine: it wraps the app's CLI path with a tiny shim that swaps in the chosen
seat before the real binary starts. Restore anytime with `bot-harness app off`.

## The honest limit → the upgrade

The switch happens at **process birth** — so each swap costs one reconnect, and
on the Claude **mobile** app it just disconnects. That's physics of processes.

For seats *and* sessions that rotate **while you type** — announced, and on any
phone browser with no reconnect — you need a thread that lives in a database, not
a process. That's a stronger spine: **[sharingu](https://github.com/ryukdev/sharingu)**.
bot-harness is the wedge; sharingu is where the limit stops existing.

## Safety

Your tokens live only in `~/.bot-harness/accounts.json` (chmod 600) — never
printed, never committed, never sent anywhere. bot-harness stores and routes;
it never acquires or transmits credentials.

MIT.
