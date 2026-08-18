# Security

bot-harness handles Claude account tokens, so it's built to hold as little as
possible and to move it nowhere.

## What it stores, and where

- Tokens live only in `~/.bot-harness/accounts.json`, written `chmod 600`.
- They are **never** printed to stdout, written to logs, or committed — `.bot-harness/`
  and `accounts.json` are gitignored.
- bot-harness has **no network egress of its own.** It stores and routes; every
  credential is one you paste in, and the only thing that ever uses a token is the
  `claude` CLI you already run.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem. Report it privately
through GitHub's [security advisory](https://github.com/ryukdev/bot-harness/security/advisories/new)
form. You'll get an acknowledgement, and a fix or explanation before any public
disclosure.

## Scope

In scope: token leakage (to logs, stdout, the tree, or any network call), the
desktop-app shim, and the launchd switcher. Out of scope: the `claude` CLI itself
and the Claude accounts you supply.
