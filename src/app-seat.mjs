// app-seat.mjs — the desktop app spawns its remote CLI with its OWN account's token already on the
// process; no shell config can win (credentials are read at process birth). The only interception
// point is the binary path: move the real binary aside and exec it through a tiny POSIX shim that
// sources a machine-chosen seat first. `app on` writes the seat + installs; `app off` restores.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, existsSync, renameSync, unlinkSync, writeFileSync, chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { load } from './accounts.mjs';
import { pickHealthy } from './router.mjs';
const CLI_DIR = join(homedir(), '.claude', 'remote', 'ccd-cli');
const SEAT = join(homedir(), '.bot-harness', 'app-seat.env');
const SHIM = `#!/bin/sh
# bot-harness app-seat shim. Restore: bot-harness app off. Opt out once: BOT_HARNESS_KEEP=1
if [ -z "$BOT_HARNESS_KEEP" ] && [ -r "$HOME/.bot-harness/app-seat.env" ]; then . "$HOME/.bot-harness/app-seat.env"; export CLAUDE_CODE_OAUTH_TOKEN; fi
exec "$0.real" "$@"
`;
function versions(){ if (!existsSync(CLI_DIR)) return []; return readdirSync(CLI_DIR).filter(f=>!f.endsWith('.real')).map(f=>{ const p=join(CLI_DIR,f); let s=0; try{s=statSync(p).size;}catch{} return { p, big:s>1e6, shimmed:existsSync(`${p}.real`) }; }); }
export function shimmed(){ return versions().some(v=>v.shimmed); }
function writeSeat(token){ mkdirSync(dirname(SEAT),{recursive:true}); writeFileSync(SEAT, `CLAUDE_CODE_OAUTH_TOKEN=${token}\n`, {mode:0o600}); chmodSync(SEAT,0o600); }
export async function run(sub, rest){
  if (sub === 'off'){ let n=0; for (const v of versions()) if (existsSync(`${v.p}.real`)){ try{unlinkSync(v.p);}catch{} renameSync(`${v.p}.real`, v.p); n++; } return console.log(`app: restored ${n} binary(ies) — the app's own account is back`); }
  if (sub === 'status'){ return console.log(`app shim: ${shimmed()?'installed':'not installed'} · versions: ${versions().length}`); }
  // default: on — pick a healthy seat, write it, shim every version
  
  const { email } = await pickHealthy(null, { onResult: r => console.log(`  ${r.ok?'✓':'✗'} ${r.email} ${r.why}`) });
  if (!email) return console.error('app: no account has headroom to seat');
  writeSeat(load().find(r=>r.email===email).token);
  let n=0; for (const v of versions()) if (v.big && !v.shimmed){ renameSync(v.p, `${v.p}.real`); writeFileSync(v.p, SHIM, {mode:0o755}); chmodSync(v.p,0o755); n++; }
  console.log(`app: seat → ${email} · ${n} version(s) shimmed · reconnect the app and its sessions run on ${email}`);
}

export function setSeatFor(email){
  const row = load().find(r => r.email === email);
  if (!row) throw new Error(`no account ${email} in the pool`);
  writeSeat(row.token);
  let n=0; for (const v of versions()) if (v.big && !v.shimmed){ renameSync(v.p, `${v.p}.real`); writeFileSync(v.p, SHIM, {mode:0o755}); chmodSync(v.p,0o755); n++; }
  return { email, newlyShimmed: n };
}
