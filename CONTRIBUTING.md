# Contributing

Thanks for looking at bot-harness. It's small on purpose — plain node, no build,
no dependencies — so it stays easy to read and easy to trust.

## Ground rules

- **Never commit a token.** `~/.bot-harness/` is gitignored; keep it that way.
  If you touch account handling, prove nothing leaks to stdout, logs, or the tree.
- **No dependencies.** If a change needs an npm package, open an issue first —
  the zero-dep property is a feature, not an accident.
- **Keep it honest.** The README's limits section is a promise. If a change moves
  a limit, move the docs in the same PR.

## Developing

```bash
git clone https://github.com/ryukdev/bot-harness
cd bot-harness
node --test         # run the test suite
node bin/bot-harness doctor
```

## Pull requests

1. Fork, branch, make the change small and focused.
2. Add or update a test under `tests/` when behavior changes.
3. Run `node --test` and `node bin/bot-harness doctor` — both green.
4. Open the PR with a one-line summary of what changed and why.

Bug reports and feature ideas are just as welcome as code — open an issue.
