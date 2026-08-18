# onboarding — add your accounts

You add each Claude account you own as an **email + token** pair. You paste them;
bot-harness only stores and routes.

```bash
bot-harness token add you@personal.com  <paste-token>
bot-harness token add you@work.com      <paste-token>
bot-harness token list      # ✓/✗ per account on the premium tier
```

Then, to keep the desktop app on a healthy account automatically:

```bash
bot-harness app on          # reconnect the app once; its sessions now pick a healthy seat
```

That's it. When an account runs dry mid-thread, `bot-harness seat` moves you to a
healthy one and resumes the same conversation.
