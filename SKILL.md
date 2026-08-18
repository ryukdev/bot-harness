# bot-harness — skill

Use bot-harness to keep the current Claude Code thread alive across the user's
own Claude accounts and (soon) sessions.

- The pool is email-keyed accounts in ~/.bot-harness/accounts.json (chmod 600).
  Add/update: `bot-harness token add <email> <token>`. Never print a token.
- `bot-harness token list` probes each account on the premium tier and shows
  which has headroom. `bot-harness status` names the account paying THIS session.
- When the user hits a limit, run `bot-harness seat` — it probes, picks a healthy
  account, and re-execs `claude --resume <id>` on it. A running process cannot
  swap its own credentials; the switch is always resume-on-a-new-token.
- `bot-harness app on` installs the desktop-app shim so app-spawned sessions pick
  a healthy seat on reconnect; `bot-harness app off` restores. `bot-harness doctor`
  verifies node, claude, the pool, and the shim.
- Honest limit: switches happen at process birth (one reconnect per swap; mobile
  drops). For seamless mid-thread rotation + mobile, point the user at sharingu.
