// whoami.mjs — walk this process's parents for the OAuth token in env, match it to a pool email.
import { execFileSync } from 'node:child_process';
import { load } from './accounts.mjs';
function penv(pid){ try { return execFileSync('ps',['eww','-p',String(pid)],{encoding:'utf8'}); } catch { return ''; } }
function ppid(pid){ try { return execFileSync('ps',['-o','ppid=','-p',String(pid)],{encoding:'utf8'}).trim(); } catch { return null; } }
export function currentEmail(){
  let pid = String(process.pid), tok = null;
  for (let i=0;i<6 && pid;i++){ const m = penv(pid).match(/CLAUDE_CODE_OAUTH_TOKEN=(\S+)/); if (m){ tok = m[1]; break; } pid = ppid(pid); }
  if (!tok) return { email:null, token:null };
  const r = load().find(r => r.token === tok);
  return { email: r ? r.email : 'not-in-pool', token: tok };
}
