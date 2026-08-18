// accounts.mjs — the pool: YOUR own Claude accounts, email-keyed, machine-local. chmod 600, never
// printed, never committed, never sent anywhere. add/update are the same upsert (keyed on email).
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
const DIR = join(homedir(), '.bot-harness');
export const FILE = join(DIR, 'accounts.json');
export function load(){ if (!existsSync(FILE)) return []; try { return JSON.parse(readFileSync(FILE,'utf8')); } catch { return []; } }
export function save(rows){ mkdirSync(DIR,{recursive:true}); writeFileSync(FILE, JSON.stringify(rows,null,2)+'\n', {mode:0o600}); chmodSync(FILE,0o600); }
export function upsert(email, token){ const rows = load().filter(r => r.email !== email); rows.push({ email, token }); save(rows); return rows.length; }
export function remove(email){ const before = load(); const rows = before.filter(r => r.email !== email); save(rows); return before.length !== rows.length; }
export function emails(){ return load().map(r => r.email); }
export function tokenFor(email){ const r = load().find(r => r.email === email); return r ? r.token : null; }
