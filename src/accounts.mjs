// accounts.mjs — the pool: YOUR own Claude accounts, email-keyed, machine-local. chmod 600, never
// printed, never committed, never sent anywhere. add/update are the same upsert (keyed on email).
//
// LABELS. An account may carry an optional display label. The pool is still keyed on email — the
// label only changes what gets PRINTED. That matters because the natural way to show this tool is a
// screenshot or a screen recording, and the default output puts your address on screen. A label lets
// you demo, file a bug, or ask for help without redacting anything afterwards.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
const DIR = join(homedir(), '.bot-harness');
export const FILE = join(DIR, 'accounts.json');
export function load(){ if (!existsSync(FILE)) return []; try { return JSON.parse(readFileSync(FILE,'utf8')); } catch { return []; } }
export function save(rows){ mkdirSync(DIR,{recursive:true}); writeFileSync(FILE, JSON.stringify(rows,null,2)+'\n', {mode:0o600}); chmodSync(FILE,0o600); }
export function upsert(email, token){ const prev = load().find(r => r.email === email); const rows = load().filter(r => r.email !== email); rows.push({ email, token, ...(prev?.label ? { label: prev.label } : {}) }); save(rows); return rows.length; }

// setLabel(email, label) — pass a falsy label to clear it and go back to showing the email.
export function setLabel(email, label){
  const rows = load(); const r = rows.find(r => r.email === email);
  if (!r) return null;
  if (label) r.label = String(label); else delete r.label;
  save(rows); return r.label || null;
}
// resolve(nameOrEmail) — accept a label wherever an email is accepted, so a user (or an agent
// reading a project file) never has to name the address out loud just to switch to it.
export function resolve(x){
  if (!x) return null;
  const rows = load();
  const hit = rows.find(r => r.email === x) || rows.find(r => r.label && r.label.toLowerCase() === String(x).toLowerCase());
  return hit ? hit.email : null;
}
// display(emailOrRow) — what the user should SEE for an account. Falls back to the email.
export function display(x){
  if (!x) return null;
  if (typeof x === 'object') return x.label || x.email;
  const r = load().find(r => r.email === x);
  return (r && r.label) || x;
}
export function remove(email){ const before = load(); const rows = before.filter(r => r.email !== email); save(rows); return before.length !== rows.length; }
export function emails(){ return load().map(r => r.email); }
export function tokenFor(email){ const r = load().find(r => r.email === email); return r ? r.token : null; }
