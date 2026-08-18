// prober.mjs — a Claude account's remaining quota is NOT readable over its OAuth token, so we ASK:
// a one-word call on the model you use, and read the refusal. Works for ANY model — set yours with
// `bot-harness config model <name>` (e.g. opus, sonnet, haiku, or a specific claude-* id).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { get } from './config.mjs';
const ex = promisify(execFile);
export async function probe(email, token, model = null){
  const m = model || get().model;
  try {
    const { stdout } = await ex('claude', ['-p','say ok','--model', m], { env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token }, timeout: 120000 });
    return /reached your .*limit|usage limit|rate.?limit/i.test(stdout) ? { email, ok:false, why:`no ${m} headroom` } : { email, ok:true, why:`${m} ✓` };
  } catch (e) { const s = String(e.stdout || e.message || ''); return { email, ok:false, why: /limit/i.test(s) ? `no ${m} headroom` : (s.slice(0,40) || 'error') }; }
}
export async function probeAll(rows, model = null, onResult = null){
  return Promise.all(rows.map(async r => { const res = await probe(r.email, r.token, model); if (onResult) onResult(res); return res; }));
}
