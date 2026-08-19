# bot-harness 🧵

[![test](https://github.com/ryukdev/bot-harness/actions/workflows/test.yml/badge.svg)](https://github.com/ryukdev/bot-harness/actions/workflows/test.yml)

**One project, one thread.**

You work on one project, but the tool makes you work in a dozen chats — because the context filled,
or the account paying ran out. bot-harness removes both reasons. It rotates the context in place and
re-opens the thread on another account *you already own*, so the work stays in one place. No new
chat, no re-login. Works with any Claude model.

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

## The honest limits

Every one of these is a property of a *process*, which is worth saying plainly: they aren't
oversights, and no amount of work on this tool removes them.

| the limit | why it exists |
|---|---|
| one **reconnect** per handoff | the account is fixed at process start, so applying a change needs a restart |
| a rotate **re-registers** your phone rather than resuming it | rewriting the transcript archives the old remote session |
| one session rotates, **every session on that machine blinks** | they share one remote server process |
| a thread lives on **one machine's** transcripts | the transcript is a local file, not a record |
| switches **accounts** only | it routes credentials, not models or harnesses |

A thread that lived in a database instead of a process would have none of them.

## The thing underneath all of it

You work on one project. The tool makes you work in a dozen chats.

Not because you wanted twelve — because the context filled, or the account ran out, or you closed
the window. So the continuity lives in your head, and you pay for it every time: re-explaining,
re-pasting, hunting for which chat had the decision in it. The fragmentation is an artefact of how
sessions are built, and you never asked for it.

bot-harness removes two of the reasons a thread has to end. **One project, one thread** — your
conversations and decisions in one place, even across accounts you own.

That's also when a thread stops being a chat. Once it outlives the sessions under it, it becomes
the thing that knows your project — and you start treating it as an agent rather than a
conversation. It doesn't need to be one unbroken scroll, and it doesn't need to live in one pane;
work can branch off it. What makes it an agent is that its identity survives.

That's the idea we're taking further in [sharingu](https://sharingu.ryuklabs.io) — threads that
don't live in a process at all. This tool stands on its own; that one is where it goes next.

If you want the longer version — how every major harness already has the substrate for this, what a
reconnect actually costs, and why an entire ecosystem of memory tools stepped around it — it's
written up in **[Everyone is building memory. Nobody is keeping the thread.](docs/everyone-is-building-memory.md)**

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Found a security issue?
[SECURITY.md](SECURITY.md) has the private path.

---

MIT © [ryukdev](https://github.com/ryukdev)
