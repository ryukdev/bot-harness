// config.mjs — bot-harness works with ANY Claude model. Set the one whose limit you actually hit;
// that's what the prober asks each account about. Default: sonnet (broadly available).
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const FILE = join(homedir(), '.bot-harness', 'config.json');
export function get(){ if (!existsSync(FILE)) return { model: 'sonnet' }; try { return { model: 'sonnet', ...JSON.parse(readFileSync(FILE,'utf8')) }; } catch { return { model: 'sonnet' }; } }
export function setModel(model){ mkdirSync(join(homedir(),'.bot-harness'),{recursive:true}); writeFileSync(FILE, JSON.stringify({ ...get(), model }, null, 2)+'\n'); return model; }
