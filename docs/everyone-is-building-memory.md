# Everyone is building memory. Nobody is keeping the thread.

On 13 August 2026, DeepSeek published an agent harness whose premise is that every part of the
runtime is a plugin — the model adapter, the tool registry, the agent loop, and the session log. Six
days later it had 161,093 stars, and the `dsh-plugin` topic had **7,539 repositories**.

I went looking through them for one specific thing and didn't find it.

There are a lot of memory plugins. OpenViking calls itself a self-evolving context database (29,460
stars). EverOS is a portable memory layer for every agent (12,144). There's mnemon, memmy-agent,
graph-memory, dsh-memory-evolve. Outside that ecosystem the same shape repeats at larger scale:
claude-mem (91,168), mem0 (63,551), cognee (30,111), Letta (24,296), basic-memory (3,680).

They are good, and several are better engineered than anything I've written. They also all answer
the same question, and it isn't the one I had.

## The question they answer

Every one of these tools solves *"stop making me re-explain myself."* The mechanism is consistent:
capture what happened, compress or structure it, store it somewhere durable, and inject the relevant
parts back into a **new** session when it starts.

claude-mem states it plainly in its own README — it "maintains continuity of knowledge *between
distinct sessions*, not within a single persistent session window." That is an accurate and honest
description of the entire category.

Note what's assumed: that the session will end, and a new one will begin, and the job is to carry
knowledge across the gap. Nobody argues with the assumption. It's so consistent that it stops looking
like an assumption.

## The question nobody is answering

Why does the session end?

Not for any reason the user chose. It ends because the context window filled. Or because the account
paying for it ran out of room. Or because the process died. The thread you were in the middle of is
not conceptually over — it's just that the thing rendering it stopped.

So there are two possible responses. Reconstruct the context in a new session, which is what the
memory category does. Or **don't lose it** — keep the same thread alive through the thing that was
about to end it.

I could not find a single plugin in that ecosystem doing the second one. Given six days, 161,093
stars of attention and 7,539 attempts, that's not an oversight of effort. It's a blind spot about
where the constraint actually lives.

## Where the constraint lives

Here is the thing I measured, on Claude Code, because it's what I use.

A session's account is fixed the instant its process starts. The desktop app puts an OAuth token on
the CLI process before any shell runs, so nothing on the machine — shell profile, ssh environment, a
wrapper script — can change which account that session bills. It's read once, at process birth.

Two lines from inside a session, neither of which prints a token:

```sh
# the session process carries a credential…
ps eww -p "$(ps -o ppid= -p $$ | tr -d ' ')" | grep -c CLAUDE_CODE_OAUTH_TOKEN   # → 1
# …while the machine's own login shell has none
sh -lc '[ -n "$CLAUDE_CODE_OAUTH_TOKEN" ] && echo set || echo unset'             # → unset
```

The session bills an account that exists nowhere in the machine's environment. It can only have
arrived at spawn.

That single fact explains a surprising amount. It's why the multi-account request on Claude Code's
tracker has 833 reactions and 167 comments, and why every workaround in that thread ends up running
separate application instances rather than switching inside one. You cannot switch what was decided
before your code ran.

And it generalises past credentials. When identity is bound to a process, everything else bound to
that process — the context window, the session, the connection your phone is holding — inherits the
same lifetime. The session is not a container for your work. It's a container for the runtime, and
your work is a passenger.

## Two architectures, one of them already built

opencode took the other path, and it's worth looking at because it's not a small project — 198,860
stars, MIT. Its sessions live in SQLite, projected from events, with a `SessionStore`, a
`SessionProjector`, credentials in SQL, and a control plane with an operation called `move-session`.
A thread there is a record, and the process is one of several things that can render it.

Claude Code binds sessions to a process and stores conversations as flat JSONL files.

Neither is wrong. They're different bets about what a session *is*. But only one of them makes
"keep the thread through the thing that would have ended it" a normal operation rather than a trick.

## What every harness already has

Here's the part that surprised me, and it's why I think the gap is closeable rather than structural.

I looked at the storage and resume surfaces of the major harnesses. gemini-cli writes `session.json`
and `checkpoint.json` under `~/.gemini`, has `--resume` and `/chat save|resume`, and carries a
`sessionId`. qwen-code does the same under `~/.qwen` with `--resume` and `--continue`. grok-build,
written in Rust, uses `~/.grok`, has `--resume`, `--continue`, a `resume_picker`, and the string
`session_id` appears 9,480 times in its source. Claude Code keeps JSONL transcripts and resumes by id.

**Every one of them already has a stable session identity, an on-disk conversation, and a resume
path.** The substrate for a continuous thread exists everywhere. What differs is only whether the
runtime treats that substrate as authoritative, or as a log it happens to write.

To be precise about what I did *not* measure: I have not verified how any harness other than Claude
Code binds its credentials. Keyword counts can't answer that, and I'm not going to imply otherwise.
The storage and resume findings above are from reading their source. The credential finding is from
Claude Code alone, and it has a repro.

## The cost you can't see

One more measurement, because it changed how I think about context.

After a reconnect, I looked at what was actually inside a session transcript. Of 49,830 bytes,
**33,884 — 68% — was not conversation.** It was the harness re-injecting its own inventory: a skill
listing (14.6KB), MCP instructions (8.1KB), deferred tool definitions (7.1KB), an agent listing
(2.6KB). The actual conversation was 15.9KB.

That overhead is real, it's charged to your context window, and it is rebuilt every time the process
restarts. Which means the cost of a process-bound session isn't only the work you lose — it's the
tax you pay to stand the runtime back up, over and over, out of the same budget as your thinking.

A thread that outlives its runtime pays that once.

## The worked example

I built the second answer for Claude Code, because I wanted it for myself.

The conversation there is a local, account-agnostic transcript, which turns out to be the whole
opening: `claude --resume <id>` under a different credential continues the exact same thread. So a
thread can move between accounts you own. And a transcript can be swapped underneath a live session
id, seeded with a handoff of the work — which refills the context without a lossy compact and without
a new window. Measured on a real session: 16k tokens down to 0.8k, same session id, work carried
forward.

It's called [bot-harness](https://github.com/ryukdev/bot-harness). MIT, no dependencies, and the
repro above is in `evidence/`. It has real limits, all of them properties of a process: each swap
costs a reconnect, and rotating one session blinks every session sharing that machine's remote
server. Those limits are in the README, because they're the most interesting part.

## What I'd like someone to take from this

If you're building in the memory category: you're solving a real problem and I'd rather have your
tools than not. But the assumption underneath — that the session ends and knowledge must survive the
gap — is a choice the runtime made for you, not a law.

If you're building a harness: you already have a session id, a stored conversation, and a resume
command. Three things would make continuous threads a first-class operation rather than a
workaround — a credential selection point at spawn, documented resume across identities, and an
addressable current context that can be rotated in place.

And if you just wanted to know why you have twelve chats open about one project: it isn't you. It's
that a session is a process, and processes end.

That's the idea I'm taking further in [sharingu](https://sharingu.ryuklabs.io) — threads that don't
live in a process at all.

---

*Every number here is from the GitHub API or from reading source, on 19 August 2026. The Claude Code
measurements are reproducible with the script in `evidence/`. Where I haven't measured something, I
say so.*
