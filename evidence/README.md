# evidence

A read-only repro for the one fact the rest of this project is built on.

```bash
node evidence/credential-birth.mjs
```

Runs `ps` and one login shell. Writes nothing, sends nothing, and never prints a token — only a
salted SHA-256 fingerprint. The salt is regenerated per run, so fingerprints are comparable *within*
one run and meaningless across runs.

## What it shows

A Claude Code session's OAuth credential is placed on the session **process** when that process is
spawned. Machine configuration — `~/.zshenv`, `~/.zshrc`, ssh environment, a wrapper script — is
downstream of that, so nothing on the machine can select which account an app-spawned session bills.

## Recorded runs

**Run A — two credentials live in one ancestry chain.** The tool subshell carried one credential
while the session process it descends from carried a different one, and the session went on billing
its own:

```
   0  pid 983     node                   no token on this process
   1  pid 978     zsh                    CLAUDE_CODE_OAUTH_TOKEN present  fp=8008d5100449
   2  pid 70589   2.1.229.real           CLAUDE_CODE_OAUTH_TOKEN present  fp=e09d0ab9f443
   3  pid 58094   server                 no token on this process
   4  pid 1       launchd                no token on this process
```

**Run B — the stable case.** On the same machine minutes later, the subshell carried no credential
at all, while the session process still carried one and the machine's own login shell resolved none:

```
   0  pid 1488    node                   no token on this process
   1  pid 1479    zsh                    no token on this process
   2  pid 70589   2.1.229.real           CLAUDE_CODE_OAUTH_TOKEN present  fp=9827c40fc95f
   3  pid 58094   server                 no token on this process
   4  pid 1       launchd                no token on this process

  login shell (/bin/zsh -lic)   no CLAUDE_CODE_OAUTH_TOKEN in the shell environment
```

Run A is the sharper illustration but it is **not deterministic** — whether a tool subshell inherits
an injected credential varies by how that subshell was spawned. Run B is what reproduces reliably,
and it is sufficient on its own: the session bills an account that exists nowhere in the machine's
own environment, so it can only have arrived on the process at spawn time.

## Reading the output honestly

* `2.1.229.real` is the versioned Claude Code CLI **after bot-harness has installed its shim** — the
  shim renames the real binary and takes its place. On a machine without bot-harness the same row
  appears under the plain versioned name. The shim's presence does not affect what this repro
  measures: the credential is on that process either way.
* "No ancestor carries CLAUDE_CODE_OAUTH_TOKEN" means the session was not started with an injected
  credential. Run it from a session spawned by the desktop app to see the case this describes.
