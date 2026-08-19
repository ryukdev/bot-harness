// config.mjs — bot-harness works with ANY Claude model. Set the one whose limit you actually hit;
// that's what the prober asks each account about. Default: sonnet (broadly available).
//
// WINDOW. `session status` reports how full a thread is, which needs a denominator. Claude Code does
// not expose the session's context window — there is no config key, no env var, and the CLI only
// surfaces a range (`--autocompact` accepts 100k–1M). So we assume the default 200k and let you say
// otherwise: on Opus 4.6+ / Sonnet 4.6+ the window can be switched to 1M, and against that a 200k
// denominator overstates fullness by 5x. Assumed, stated, and overridable — never silently wrong.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const FILE = join(homedir(), '.bot-harness', 'config.json');
const DEFAULTS = { model: 'sonnet', window: 200000 };
export const DEFAULT_WINDOW = DEFAULTS.window;
export function get(){ if (!existsSync(FILE)) return { ...DEFAULTS }; try { return { ...DEFAULTS, ...JSON.parse(readFileSync(FILE,'utf8')) }; } catch { return { ...DEFAULTS }; } }
function save(next){ mkdirSync(join(homedir(),'.bot-harness'),{recursive:true}); writeFileSync(FILE, JSON.stringify(next, null, 2)+'\n'); }
export function setModel(model){ save({ ...get(), model }); return model; }
// setWindow accepts 200000 or '200k' or '1m'. Anything outside 1k–10M is a typo, not a window.
export function setWindow(v){
  const m = String(v).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([km])?$/);
  if (!m) throw new Error(`not a token count: ${v}  (try 200k, 1m, or 200000)`);
  const n = Math.round(Number(m[1]) * (m[2] === 'm' ? 1e6 : m[2] === 'k' ? 1e3 : 1));
  if (!(n >= 1000 && n <= 10_000_000)) throw new Error(`window out of range: ${n} (expected 1k–10M)`);
  save({ ...get(), window: n }); return n;
}
