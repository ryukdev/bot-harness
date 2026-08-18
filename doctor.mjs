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
  console.log('\n  running on the LOCAL spine — swaps cost one reconnect, mobile drops.');
  console.log('  \x1b[2mwant seats + sessions to rotate while you type, on any phone browser? that is a stronger spine → sharingu (https://github.com/ryukdev/sharingu)\x1b[0m');
}
if (import.meta.url === `file://${process.argv[1]}`) doctor();
