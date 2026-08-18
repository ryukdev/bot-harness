# bot-harness 🪑

**One thread. Fresh context, different account, same chat.**

A Claude Code conversation normally ends twice: when the context fills, and when the account
paying for it runs out of room. bot-harness keeps the **same thread** going through both — it
rotates the context in place, and re-opens the thread on another account *you already own*.
No new chat, no re-login. Works with any Claude model.

![demo](assets/demo.gif)

## The two operations

**Context handoff** — `session rotate --in-place`. Same session id, same chat, memory
`14k → 0.7k`, work carried forward. Not a lossy compact, not a new window. Native makes you
choose: keep the window (`/compact`, lossy) or keep a clean context (`/clear`, work dropped).
This is both.

**Account handoff** — `switch you@personal.com`. The same thread re-opened on another account of
yours, auto-reconnected. Useful on the **desktop app**, where the account is welded to the
process at birth and nothing on the machine can pick it.

## Install

```bash
git clone https://github.com/ryukdev/bot-harness ~/.bot-harness-src
ln -sf ~/.bot-harness-src/bin/bot-harness /usr/local/bin/bot-harness
bot-harness doctor
```

No build, no dependencies — plain node (18+) and the `claude` CLI. Full setup, including the
desktop-app switcher, is in [install.md](install.md).

Or paste this into Claude Code and let it install itself:

```text
Clone https://github.com/ryukdev/bot-harness into ~/.bot-harness-src, read
install.md, put `bot-harness` on my PATH, register it as a skill from SKILL.md,
then walk me through onboarding.
```

## Use

```bash
bot-harness session status                # session id + how full its memory is
bot-harness session rotate --in-place     # same chat, fresh memory — work carried over
bot-harness switch you@personal.com       # move THIS chat to another account you own
bot-harness status                        # which account THIS session is paying
bot-harness token add you@work.com  sk-…  # add an account you own (paste the token)
bot-harness token list                    # your emails + who has headroom right now
bot-harness config model opus             # the model this pool is for (any Claude model)
bot-harness mobile on                     # keep the thread on your phone across both operations
```

Both operations reconnect the app **automatically** — a tiny launchd watcher drops the
connection after your reply renders, so it's usually zero clicks (at most one retry tap).

**On your phone.** Remote Control binds to the session, not to the account — so a thread stays live
on a phone through an account switch, even one signed into a different account than the one now
paying. A rotate is different: rewriting the transcript archives the old remote session, so the
phone needs the session registered again. `bot-harness mobile on` turns on Claude Code's own
`remoteControlAtStartup`, and since both operations restart the session process, the phone
re-registers by itself — nothing to re-run.

## How it works

The conversation is a local, **account-agnostic transcript**. `claude --resume <id>` continues
the same thread under a different account, and a transcript can be swapped under a live session
id — which is exactly what native auto-compact does internally. bot-harness builds both moves on
that: rotate seeds a fresh transcript with a handoff of your work under the **same id**; switch
picks a healthy account from your own pool and re-opens the thread on it.

The account itself is fixed the instant a session's process starts — the desktop app injects its
token before any shell runs — so a switch applies on the session restart the auto-reconnect
performs.

**On accounts and compliance.** bot-harness runs the **official `claude` binary**, authenticated
with **your own accounts**, one at a time. There is no relay, no proxy, nothing impersonating a
client, and no credential ever leaves your machine — tokens live only in
`~/.bot-harness/accounts.json` (chmod 600), never printed, never committed, never transmitted.
It stores and routes; it never acquires. See [SECURITY.md](SECURITY.md).

## How this differs from the account switchers

Several good tools swap which account the **CLI** is authenticated as —
[claude-swap](https://github.com/realiti4/claude-swap) does it well, with a usage dashboard and
automatic rotation. bot-harness overlaps there and doesn't try to beat them at it. The parts that
are ours: the **context handoff** and the **desktop app** surface, where the token is injected at
process birth.

The handoff is also a different thing from the memory tools. [claude-mem](https://github.com/thedotmack/claude-mem),
[mem0](https://github.com/mem0ai/mem0) and [basic-memory](https://github.com/basicmachines-co/basic-memory)
all answer the same human problem — *stop making me re-explain myself* — by extracting what happened
into a store and recalling it into a **new** session. That works, and for a lot of people it is the
right answer. bot-harness does the other one: it keeps **this** thread alive — same session id, same
chat — so there is nothing to extract and nothing to recall. Memory tools remember facts about your
work; a handoff keeps the thread that *is* the work.

## The honest limits — and where [sharingu](https://github.com/ryukdev) takes over

Every limit below is a property of *processes*, and every one is what a database-backed thread
removes.

| today, with bot-harness | tomorrow, with sharingu |
|---|---|
| one **reconnect** per handoff | context and seats rotate **while you type** |
| a rotate **re-registers** the phone rather than resuming it | the phone never re-pairs — the thread is a URL |
| a thread lives on **one machine's** transcripts | the thread lives in a **database** |
| switches **accounts** only | smart routing across **N models & harnesses** |

bot-harness keeps a *session* alive. sharingu changes what a session **is**: a thread that lives
in a database instead of a process — so context, accounts, sessions and models rotate underneath
it while it keeps going, and a thread that outlives its session can be promoted into a standing
**agent**. One primitive, **continuous threads for everything.** bot-harness is the wedge;
sharingu is where a session becomes a living thread.

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Found a security issue?
[SECURITY.md](SECURITY.md) has the private path.

---

MIT © [ryukdev](https://github.com/ryukdev)
