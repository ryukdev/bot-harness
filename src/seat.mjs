// seat.mjs — a running Claude cannot swap its own credentials (read once at startup). The conversation
// is a local transcript file, account-agnostic — so the switch is: pick a healthy account, re-exec
// `claude --resume <id>` with that account's token. Same thread, new payer.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export function newestSession(cwd = process.cwd()){
  const roots = [process.env.CLAUDE_CONFIG_DIR, join(homedir(),'.claude'), join(homedir(),'.claude-bunny')].filter(Boolean);
  const rows = [];
  for (const root of roots){
    const dir = join(root.endsWith('projects') ? root : join(root,'projects'), cwd.replace(/[^a-zA-Z0-9]/g,'-'));
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) { try { rows.push({ id: f.replace(/\.jsonl$/,''), at: statSync(join(dir,f)).mtimeMs }); } catch {} }
  }
  rows.sort((a,b)=>b.at-a.at); return rows[0]?.id || null;
}
export function resumeOn(token, session){
  const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token };
  const args = session ? ['--resume', session] : [];
  if (!session) return spawnSync('claude', args, { stdio:'inherit', env });
  let r = spawnSync('claude', ['--resume', session], { stdio:['inherit','inherit','pipe'], env });
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0 && /No deferred tool marker/i.test(String(r.stderr||''))) r = spawnSync('claude', ['--resume', session, 'continue'], { stdio:'inherit', env });
  return r;
}
