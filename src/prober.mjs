// prober.mjs — quota is NOT readable over an OAuth token, so we ASK: a one-word call on the tier's
// model, and read the refusal text. premium = Fable/Opus class · standard = sonnet/haiku.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const ex = promisify(execFile);
export const TIER_MODEL = { premium: 'claude-fable-5', standard: 'sonnet' };
export async function probe(email, token, tier='premium'){
  try {
    const { stdout } = await ex('claude', ['-p','say ok','--model', TIER_MODEL[tier]], { env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token }, timeout: 120000 });
    return /reached your .*limit|usage limit|rate.?limit/i.test(stdout) ? { email, ok:false, why:'limit reached' } : { email, ok:true, why:'answers' };
  } catch (e) { const s = String(e.stdout || e.message || ''); return { email, ok:false, why: /limit/i.test(s) ? 'limit reached' : (s.slice(0,40) || 'error') }; }
}
export async function probeAll(rows, tier='premium', onResult=null){
  return Promise.all(rows.map(async r => { const res = await probe(r.email, r.token, tier); if (onResult) onResult(res); return res; }));
}
