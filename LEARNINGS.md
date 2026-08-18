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
