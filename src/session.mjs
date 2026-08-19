// session.mjs — SESSION ROTATION. Claude Code's own --resume reopens the FULL transcript, which is
// what fills the context. So rotation is: snapshot the work into a compact handoff → start a FRESH
// session (clean window) seeded with that handoff → continue. Continuity rides the snapshot, not the
// session id. The snapshot here is light (a summary + the recent tail); sharingu's is a rich spine.
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { newestSession } from './seat.mjs';
import { currentEmail } from './whoami.mjs';
import { tokenFor, load } from './accounts.mjs';

// resolveToken — the claude -p subprocess needs a REAL token; the ambient env may have none (learned
// 2026-08-18: nested claude in a shimmed session had no token → 'Not logged in'). Prefer THIS session's
// account, else any pool account.
function resolveToken(){
  try { const { email } = currentEmail(); if (email && email !== 'not-in-pool'){ const t = tokenFor(email); if (t) return t; } } catch {}
  const rows = load(); return rows[0] ? rows[0].token : null;
}
const ex = promisify(execFile);
const SNAP_DIR = join(homedir(), '.bot-harness', 'snapshots');

export function transcriptPath(sessionId, cwd = process.cwd()){
  const roots = [process.env.CLAUDE_CONFIG_DIR, join(homedir(),'.claude')].filter(Boolean);
  for (const root of roots){
    const p = join(root.endsWith('projects') ? root : join(root,'projects'), cwd.replace(/[^a-zA-Z0-9]/g,'-'), `${sessionId}.jsonl`);
    if (existsSync(p)) return p;
  }
  return null;
}
// conversationChars — what the THREAD actually costs, excluding harness scaffolding.
// On every reconnect the desktop app re-injects its own context: skill listings, MCP instructions,
// deferred-tool and agent listings. Measured on a real post-rotate transcript that was 68% scaffolding
// (33,884 of 49,830 bytes). Counting raw file size makes a freshly rotated session read as ~10k when
// the conversation in it is a 0.8k handoff — the tool would contradict its own "96% freed" a moment
// after printing it. These lines are re-created on demand and are not the user's thread, so they do
// not count toward it.
export function conversationChars(path){
  let n = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')){
    if (!line) continue;
    try { if (JSON.parse(line).type === 'attachment') continue; } catch {}
    n += line.length + 1;
  }
  return n;
}

export function extractText(msg){ if (!msg) return ''; const c = msg.content; if (typeof c === 'string') return c; if (Array.isArray(c)) return c.filter(b=>b.type==='text').map(b=>b.text).join(' '); return ''; }
export function readTurns(path, limit = 40){
  const out = [];
  for (const line of readFileSync(path,'utf8').split('\n')){
    if (!line) continue;
    try { const j = JSON.parse(line); const role = j.type==='user'?'user':(j.type==='assistant'?'assistant':null); if (!role) continue;
      const text = extractText(j.message); if (text && text.trim()) out.push({ role, text: text.trim() }); } catch {}
  }
  return out.slice(-limit);
}
export async function makeHandoff(sessionId, token = null){
  if (!token) token = resolveToken();
  const path = transcriptPath(sessionId); if (!path) throw new Error(`transcript not found for ${sessionId}`);
  const turns = readTurns(path);
  const convo = turns.map(t => `${t.role.toUpperCase()}: ${t.text.slice(0,600)}`).join('\n');
  const prompt = `Summarize this conversation into a concise HANDOFF a fresh session can continue from — the goal, key decisions made, current state, and the immediate next step. Be specific and brief.\n\n${convo}`;
  const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token || '' };
  // --no-session-persistence: without it this handoff call writes its OWN transcript into the user's
  // project dir. That stray is newest-by-mtime until rotateInPlace writes the real one, so any failure
  // between the two leaves `session status` reporting the PHANTOM session's id instead of the real one.
  const { stdout } = await ex('claude', ['-p', prompt, '--model','sonnet', '--no-session-persistence'], { env, timeout: 120000, maxBuffer: 20*1024*1024 });
  mkdirSync(SNAP_DIR, { recursive: true });
  const snap = join(SNAP_DIR, `${sessionId}.md`); writeFileSync(snap, stdout);
  return { snap, handoff: stdout.trim(), turns: turns.length, srcChars: convo.length };
}
export async function rotate(token = null){
  if (!token) token = resolveToken();
  const sid = newestSession(); if (!sid) throw new Error('no session to rotate');
  const { snap, handoff, turns, srcChars } = await makeHandoff(sid, token);
  console.log(`snapshot: ${turns} turns (${srcChars} chars) → handoff ${handoff.length} chars`);
  console.log(`\x1b[2m${snap}\x1b[0m`);
  console.log(`starting a fresh session, seeded with the handoff (clean window)…`);
  const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token || '' };
  const seed = `We are continuing earlier work. Handoff from the previous session:\n\n${handoff}\n\nContinue from the next step.`;
  return spawnSync('claude', [seed], { stdio:'inherit', env });
}

// ── rotateInPlace — ANGLE 1: same id, fresh context (the transcript-swap). Native auto-compact
// already rewrites the transcript under a live id, proving the app tolerates it; this does the same
// from outside, but seeds a STRUCTURED handoff instead of a lossy crush. Backup first, always.
// Line shapes are CLONED from the real transcript (uuid/parent chain re-linked) so the format is
// exactly what claude's own resume parser expects — never hand-invented.
import { randomUUID } from 'node:crypto';
export async function rotateInPlace(sessionId, token = null){
  const path = transcriptPath(sessionId); if (!path) throw new Error(`transcript not found for ${sessionId}`);
  const { handoff, turns } = await makeHandoff(sessionId, token);
  const lines = readFileSync(path,'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const uTpl = lines.find(j => j.type === 'user' && typeof j.message?.content === 'string');
  const aTpl = lines.find(j => j.type === 'assistant');
  if (!uTpl || !aTpl) throw new Error('no user/assistant template lines to clone');
  const now = new Date().toISOString();
  const uId = randomUUID(), aId = randomUUID();
  const u = { ...uTpl, uuid: uId, parentUuid: null, promptId: randomUUID(), timestamp: now,
    message: { role: 'user', content: `We are continuing earlier work in this same thread. Handoff from before the context rotation:\n\n${handoff}\n\nContinue from the next step.` } };
  const a = { ...aTpl, uuid: aId, parentUuid: uId, timestamp: now,
    message: { ...aTpl.message, role: 'assistant', content: [{ type: 'text', text: 'Got it — continuing from the handoff, with a fresh context window.' }] } };
  const backup = `${path}.pre-rotate-${Date.now()}`;
  writeFileSync(backup, readFileSync(path));
  writeFileSync(path, JSON.stringify(u) + '\n' + JSON.stringify(a) + '\n');
  return { backup, before: { turns, chars: conversationChars(backup) }, after: { chars: conversationChars(path) } };
}

