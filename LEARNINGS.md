# bot-harness — learnings (folded as we built it)

Hard-won facts from making account + session switching real on a live Claude Code desktop session
over ssh. Each one is now guarded in code (doctor / the fix) so it can't silently recur.

## 1 · One seat authority, or the account gets pinned
Two leftover mechanisms both hardcoded one account and silently overrode the seat:
a `~/.zshenv` export of `CLAUDE_CODE_OAUTH_TOKEN`, and a *foreign* shim reading a different seat file.
`app on` also silently skipped an already-shimmed path. Symptom: "switch to X worked, switch to Y
didn't" — because everything was pinned to X. **Fix:** `doctor` now flags a foreign shim and a
shell hardcode; `app on` replaces a foreign shim. One shim, one seat file, switchable.

## 2 · A nested `claude -p` has no ambient token
`session snapshot/rotate` shell out to `claude -p` to write the handoff. The subprocess inherited no
valid token → "Not logged in" (worse once the shell hardcode was removed). **Fix:** resolve a pool
token (this session's account, else any) and pass it to the subprocess explicitly. Never rely on the
ambient env for a shelled-out claude call.

## 3 · The account is bound to the PROCESS; the thread is not
Switching the paying account requires the session PROCESS to restart (respawn through the shim). A
plain reconnect reuses the same process and keeps the old account. But the transcript (the thread)
survives a restart — so "same thread, new account" works after a real restart. Verified live.

## 4 · Natively, the chat WINDOW *is* the session
The desktop app's chat window binds to a session ID = one transcript = one context window. You cannot
hold the window still while rotating the session underneath — they're welded. Native has only
auto-compact (same window, lossy, in place) or a new session (fresh window). bot-harness rotation is
the latter done well: snapshot → fresh session carrying the work. **"Same window, session rotates
underneath" is only possible when the window is a VIEW of a DB thread — that is sharingu.**

## 5 · The honest limit is the wedge
Every wall here (restart to switch account, new window to rotate session, no mobile, one seat per
machine) is a process/file limit of native Claude Code. Each is precisely what a database-backed
thread removes. bot-harness makes the desktop experience better; sharingu makes it seamless.

## 6 · The transcript-swap works — same id, fresh context (VERIFIED)
Native auto-compact rewrites the transcript under a live id — so an EXTERNAL swap does too. Verified
end-to-end: cloned a real 800KB session under a fresh UUID, `rotate --in-place` swapped it to a 4KB
handoff-seeded transcript (line shapes CLONED from real lines, uuid chain re-linked, same sessionId),
and `claude -p --resume <id>` loaded the fresh transcript and continued from the handoff's next step.
99.5% of the context reclaimed, id unchanged. Gotchas that cost time: the session id must be a real
UUID (resume rejects non-UUID ids), and resume looks in `CLAUDE_CONFIG_DIR` — a machine with multiple
profiles must point at the profile that owns the transcript. Backup is always written before the swap.

**RESOLVED 2026-08-19 on a live desktop remote session.** The rotation holds: the pre-rotate
conversation (87KB, 62 lines) is genuinely gone from the transcript and does not come back — a
distinctive phrase from before the swap appears zero times afterwards. The window keeps its
scrollback, but the model's context really is the handoff, so "same chat, fresh memory" is accurate.

## 7 · Remote Control survives an ACCOUNT switch but not a SESSION rotation — and that's documented
Observed live: a phone kept rendering and driving a thread across an account switch **while signed
into a different account than the one now paying**. So Remote Control binds to the session, not to
the credential — native Claude Code already has a thread identity that is account-portable. A
rotation is different: rewriting the transcript is a compaction-shaped event, and Claude Code
"archives the server session it was using" when compaction rewrites the conversation, so the phone's
binding goes stale and the session has to be registered again.

The fix is not to re-run anything by hand. Both of our operations restart the session PROCESS, and
Claude Code's own `remoteControlAtStartup` setting re-registers Remote Control on every interactive
session start — so `bot-harness mobile on` sets that supported key and the phone reconnects by
itself after both operations. **We set the supported setting; we never reimplement it.**

Two consequences worth keeping straight. For the product: "no mobile" was wrong and understated the
tool — the honest limit is that a rotate re-registers rather than resumes. For the upstream ask: the
account-portable thread identity we're asking for already exists in their own product, on the most
constrained surface they ship. That is a much stronger argument than a feature request.

## 8 · A reconnect re-injects the harness, and it dwarfs the thread
Measured on the transcript of a live rotate: 33,884 of 49,830 bytes — **68%** — were attachment lines
the desktop app re-injects when the session comes back: `skill_listing` (14.6KB),
`mcp_instructions_delta` (8.1KB), `deferred_tools_delta` (7.1KB), `agent_listing_delta` (2.6KB),
`auto_mode`. The conversation itself was 15.9KB.

We were measuring raw file size, so `session status` reported **~12k** for a session whose thread was
a 0.8k handoff — the tool contradicting its own "96% freed" one prompt after printing it. On camera
that reads as a failed rotation. `conversationChars()` now excludes attachment lines; the same real
transcript reports 4k instead of 12k.

The lesson generalises past the bug: on a process-bound harness a meaningful part of every context
window is scaffolding that gets rebuilt on every reconnect, and it is charged to the user's window.
A thread that lives in a database carries its own state and pays that cost once.
