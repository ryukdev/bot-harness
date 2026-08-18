#!/usr/bin/env node
// credential-birth.mjs — a read-only repro of ONE fact:
//
//   A Claude Code session's OAuth credential is placed on the session PROCESS when that process is
//   spawned. Nothing the machine does afterwards — ~/.zshenv, ~/.zshrc, ssh environment, a wrapper —
//   can change which account that session bills, because the decision was already made upstream.
//
// It walks this process's ancestry looking for CLAUDE_CODE_OAUTH_TOKEN, and compares what the
// ANCESTOR carries against what a fresh login shell on this machine resolves. If the two differ,
// the environment is provably downstream of the credential decision.
//
// Read-only: it runs `ps` and one login shell. It never writes, never transmits, and NEVER prints a
// token — only a salted SHA-256 fingerprint, so two runs on the same machine are comparable and the
// secret is not recoverable from the output.
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';

const SALT = randomBytes(16).toString('hex'); // per-run: fingerprints compare within a run, not across
const fp = t => t ? createHash('sha256').update(SALT + t).digest('hex').slice(0, 12) : null;
const sh = (c, a) => { try { return execFileSync(c, a, { encoding: 'utf8' }); } catch { return ''; } };

const tokenOf = pid => (sh('ps', ['eww', '-p', String(pid)]).match(/CLAUDE_CODE_OAUTH_TOKEN=(\S+)/) || [])[1] || null;
const parentOf = pid => sh('ps', ['-o', 'ppid=', '-p', String(pid)]).trim() || null;
const nameOf = pid => (sh('ps', ['-o', 'comm=', '-p', String(pid)]).trim() || '?').split('/').pop();

console.log('credential-birth — where does a session\'s account actually come from?\n');
console.log('process ancestry (nearest first):');

let pid = String(process.pid), carrier = null, depth = 0;
const carriers = [];
while (pid && pid !== '0' && depth < 8) {
  const t = tokenOf(pid);
  if (t) carriers.push({ pid, name: nameOf(pid), fp: fp(t), depth });
  if (t && !carrier) carrier = { pid, name: nameOf(pid), fp: fp(t), depth };
  console.log(`  ${String(depth).padStart(2)}  pid ${pid.padEnd(7)} ${nameOf(pid).padEnd(22)} ${t ? `CLAUDE_CODE_OAUTH_TOKEN present  fp=${fp(t)}` : 'no token on this process'}`);
  pid = parentOf(pid); depth++;
}

// what a fresh login shell on THIS machine resolves, i.e. everything the operator controls
const shellTok = sh(process.env.SHELL || '/bin/zsh', ['-lic', 'printf %s "$CLAUDE_CODE_OAUTH_TOKEN"']).trim() || null;

console.log('\nwhat this machine resolves on its own:');
console.log(`  login shell (${process.env.SHELL || '/bin/zsh'} -lic)   ${shellTok ? `fp=${fp(shellTok)}` : 'no CLAUDE_CODE_OAUTH_TOKEN in the shell environment'}`);

console.log('\nverdict:');
const distinct = [...new Set(carriers.map(c => c.fp))];
if (!carrier) {
  console.log('  No ancestor carries CLAUDE_CODE_OAUTH_TOKEN. This session was not started with an');
  console.log('  injected token — run this from inside a session spawned by the desktop app to see the case.');
} else if (distinct.length > 1) {
  // The strongest form of the evidence: two different credentials are live in one ancestry chain.
  const inner = carriers[0], outer = carriers[carriers.length - 1];
  console.log(`  TWO DIFFERENT CREDENTIALS ARE LIVE IN ONE ANCESTRY CHAIN.`);
  console.log(`    depth ${inner.depth} (${inner.name}) carries fp=${inner.fp}  <- what the machine put on the subshell`);
  console.log(`    depth ${outer.depth} (${outer.name}) carries fp=${outer.fp}  <- what the session is actually billing`);
  console.log('  The session process kept the credential it was spawned with. A descendant of that same');
  console.log('  session resolved a different one, and it changed nothing about who pays.');
  console.log('  => Credentials are read once, at process birth. There is no supported point at which the');
  console.log('     machine can select the paying account for an app-spawned session.');
} else if (shellTok && fp(shellTok) !== carrier.fp) {
  console.log(`  The credential is carried by an ANCESTOR process (depth ${carrier.depth}, ${carrier.name}), not by this one.`);
  console.log(`  The machine's own shell resolves a DIFFERENT credential (fp=${fp(shellTok)}) than the one the`);
  console.log(`  session is billing (fp=${carrier.fp}).`);
  console.log('  => The session\'s account was fixed when its process was spawned. Machine configuration is');
  console.log('     downstream of a decision already made.');
} else if (shellTok) {
  console.log('  The shell resolves the SAME credential, so this run does not separate the two sources.');
  console.log('  Configure a different token in your shell environment and re-run to see the split.');
} else {
  console.log(`  The credential is carried by an ANCESTOR process (depth ${carrier.depth}, ${carrier.name}), not by this one.`);
  console.log('  The machine\'s shell resolves no credential at all, yet the session bills one — it can only');
  console.log('  have arrived on the process at spawn time.');
}

console.log('\n(no token was printed; fingerprints are salted per run and are not reversible)');
