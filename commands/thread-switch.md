---
description: Move this chat to another Claude account you own
argument-hint: [account name or email]
allowed-tools: Bash(bot-harness status), Bash(bot-harness switch:*), Bash(bot-harness token list)
---

Move this thread to a different account in the user's own pool.

1. Run `bot-harness status` to see which account is currently paying.
2. Switch to the account named in $ARGUMENTS. If no account was named, pick any pool account
   that is **not** the current one — switching to the account already in use is a no-op and is
   never what was wanted.
3. Reply with one line: `→ <account>`

Accounts may carry labels; use the label if one is set, so no email address ends up on screen.

The account is fixed when a session's process starts, so the switch applies on the restart that
the auto-reconnect performs. Expect a brief disconnect. Don't re-run afterwards, and don't say
"restart to apply".
