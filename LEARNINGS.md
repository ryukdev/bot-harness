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
profiles must point at the profile that owns the transcript. Remaining unknown: whether the desktop
app's WINDOW re-renders the fresh transcript on reconnect (the ccd-cli resume layer is proven; the
window repaint needs one visual check). Backup is always written before the swap.

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
