// mobile.mjs — MOBILE CONTINUITY. Remote Control keeps a thread reachable from a phone or browser.
// Two facts decide how it behaves across our operations:
//
//   1. An ACCOUNT switch doesn't touch the conversation, so the Remote Control binding survives it —
//      the phone keeps rendering the thread even when it is signed into a different account than the
//      one now paying. (Observed, and consistent with Remote Control binding to the session, not the
//      credential.)
//   2. A SESSION rotation rewrites the transcript. Claude Code archives the server session it was
//      serving when compaction rewrites the conversation, so the binding goes stale and the phone
//      needs the session re-registered.
//
// Both of our operations restart the session PROCESS. So the fix for (2) is not to re-run anything
// by hand: turn on Claude Code's own `remoteControlAtStartup`, and every restarted session
// re-registers Remote Control by itself. We set the supported setting; we never reimplement it.
//
// This is opt-in. With it on, each interactive session registers a remote session in the user's OWN
// claude.ai account — nobody else gains access — but it is still the user's call to make.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export const KEY = 'remoteControlAtStartup';

export function settingsPath(){
  const root = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  return join(root, 'settings.json');
}

export function readSettings(path = settingsPath()){
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf8')) || {}; }
  catch (e) { throw new Error(`could not parse ${path}: ${e.message}`); }
}

export function status(path = settingsPath()){
  const s = readSettings(path);
  return { path, enabled: s[KEY] === true, present: Object.hasOwn(s, KEY), value: s[KEY] };
}

// Merge-and-write: never rewrite the user's settings file from scratch, and always leave a backup.
export function set(enabled, path = settingsPath()){
  const s = readSettings(path);
  s[KEY] = enabled;
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) copyFileSync(path, `${path}.bot-harness.bak`);
  writeFileSync(path, JSON.stringify(s, null, 2) + '\n');
  return status(path);
}

export function run(sub){
  if (sub === 'on' || sub === 'off'){
    const st = set(sub === 'on');
    console.log(`\x1b[1mmobile continuity ${st.enabled ? 'on' : 'off'}\x1b[0m`);
    console.log(st.enabled
      ? '  every new session registers Remote Control by itself — so after a switch or a rotate the\n  phone reconnects without you re-running anything.'
      : '  sessions no longer auto-register Remote Control; run /remote-control when you want it.');
    console.log(`  \x1b[2m${KEY} → ${st.enabled} in ${st.path}\x1b[0m`);
    return;
  }
  const st = status();
  console.log(st.enabled
    ? `\x1b[1mmobile continuity: on\x1b[0m — switch and rotate re-register Remote Control automatically`
    : `\x1b[1mmobile continuity: off\x1b[0m — a rotate needs /remote-control re-run by hand (bot-harness mobile on)`);
  console.log(`  \x1b[2m${st.path}${st.present ? '' : ' (key not set)'}\x1b[0m`);
}
