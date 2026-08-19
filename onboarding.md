# onboarding

Two minutes. You add the Claude accounts you already own, and bot-harness keeps one thread
running across them.

## 1 · Add your accounts

You paste a token per account; bot-harness only stores and routes — it never acquires a
credential and nothing leaves your machine.

```bash
bot-harness token add you@work.com      <paste-token>
bot-harness token add you@personal.com  <paste-token>
bot-harness token list                  # who has headroom right now
```

## 2 · Name them (optional, but do it)

Every command prints the account. Give them names and your email never appears in a
screenshot, a bug report, or a demo:

```bash
bot-harness token label you@work.com      "work"
bot-harness token label you@personal.com  "personal"
bot-harness switch personal               # labels work anywhere an email does
```

## 3 · Let the desktop app pick the seat

```bash
bot-harness app on     # installs the shim; reconnect the app once
bot-harness doctor     # everything should be ✓
```

## 4 · Keep the thread on your phone (optional)

```bash
bot-harness mobile on
```

Remote Control binds to the session, not the account — so a thread stays live on your phone
through an account switch. A context refresh rewrites the transcript, which archives the old
remote session; this setting re-registers it automatically so you never re-run anything.

## Then, day to day

```bash
bot-harness session status              # how full is this chat?
bot-harness session rotate --in-place   # refill the context, same chat, work carried over
bot-harness switch work                 # move this chat to another account you own
```
