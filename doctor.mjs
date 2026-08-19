// doctor.mjs — verify the chain: node, claude on PATH, the pool, and the desktop-app shim state.
import { execFileSync } from 'node:child_process';
import { load } from './src/accounts.mjs';
export async function doctor(){
  const ok = (b) => b ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  const has = (c) => { try { execFileSync('which',[c],{stdio:'ignore'}); return true; } catch { return false; } };
  console.log('bot-harness doctor');
  console.log(`  ${ok(has('node'))} node`);
  console.log(`  ${ok(has('claude'))} claude on PATH`);
  const n = load().length; console.log(`  ${ok(n>0)} pool has ${n} account(s)`);
  let appShim = false; try { const { shimmed } = await import('./src/app-seat.mjs'); appShim = shimmed(); } catch {}
  console.log(`  ${ok(true)} desktop-app shim: ${appShim ? 'installed' : 'not installed (bot-harness app on)'}`);
  // conflict checks — the two things that silently pin the account (learned 2026-08-18):
  let foreign=false;
  try { const { readdirSync, readFileSync } = await import('node:fs'); const { homedir } = await import('node:os'); const { join } = await import('node:path');
    const dir = join(homedir(),'.claude','remote','ccd-cli');
    for (const f of readdirSync(dir)){ const p=join(dir,f); if (!p.endsWith('.real')) { try { const t=readFileSync(p,'utf8'); if (t.includes('#!/bin/sh') && !t.includes('.bot-harness/app-seat.env')) foreign=true; } catch {} } }
  } catch {}
  console.log(`  ${foreign?'\x1b[31m✗\x1b[0m':'\x1b[32m✓\x1b[0m'} no FOREIGN shim on the CLI path (a non-bot-harness shim silently pins the account)`);
  let shellForces=false;
  try { const { execSync } = await import('node:child_process'); const out=execSync('sh -lc "echo $CLAUDE_CODE_OAUTH_TOKEN" 2>/dev/null',{encoding:'utf8'}); shellForces = out.trim().length>0; } catch {}
  console.log(`  ${shellForces?'\x1b[33m!\x1b[0m':'\x1b[32m✓\x1b[0m'} login shell does not hardcode CLAUDE_CODE_OAUTH_TOKEN (${shellForces?'a shell export overrides the seat — check ~/.zshenv/.zprofile':'clean'})`);
  const { status: mobileStatus } = await import('./src/mobile.mjs');
  let m; try { m = mobileStatus(); } catch { m = null; }
  console.log(`  ${m?.enabled?'\x1b[32m✓\x1b[0m':'\x1b[33m!\x1b[0m'} mobile continuity: ${m?.enabled?'on — a switch or rotate re-registers Remote Control by itself':'off — after a rotate the phone needs /remote-control again (bot-harness mobile on)'}`);
  console.log('\n  running on the LOCAL spine — each swap costs one reconnect.');
  console.log('  \x1b[2mwant seats + sessions to rotate while you type, on any phone browser? that is a stronger spine → sharingu (https://sharingu.ryuklabs.io)\x1b[0m');
}
if (import.meta.url === `file://${process.argv[1]}`) doctor();
