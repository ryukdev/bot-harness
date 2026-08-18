# install

Requires: node 18+, and the `claude` CLI on PATH.

```bash
git clone https://github.com/ryukdev/bot-harness ~/.bot-harness-src
ln -sf ~/.bot-harness-src/bin/bot-harness /usr/local/bin/bot-harness   # or add bin/ to PATH
bot-harness doctor
```

No build step, no dependencies — plain node.

## The switcher agent (desktop-app switches)

`switch` and `rotate --in-place` write `~/.bot-harness/pending-switch`; a tiny launchd agent watches
that file, waits ~8s (so the reply renders), then drops the app's remote server so it reconnects on
the new seat / fresh context. Install once:

```bash
cp assets/io.bot-harness.switcher.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/io.bot-harness.switcher.plist
```
