import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { status, set, KEY } from '../src/mobile.mjs';

const tmp = () => join(mkdtempSync(join(tmpdir(), 'bh-mobile-')), 'settings.json');

test('status reports off when the file or key is absent', () => {
  const p = tmp();
  assert.deepEqual(status(p), { path: p, enabled: false, present: false, value: undefined });
  writeFileSync(p, JSON.stringify({ theme: 'dark' }));
  assert.equal(status(p).enabled, false);
  assert.equal(status(p).present, false);
});

test('set preserves unrelated settings and backs the file up', () => {
  const p = tmp();
  writeFileSync(p, JSON.stringify({ theme: 'dark', permissions: { defaultMode: 'auto' } }, null, 2));
  const st = set(true, p);
  assert.equal(st.enabled, true);
  const after = JSON.parse(readFileSync(p, 'utf8'));
  assert.equal(after[KEY], true);
  assert.equal(after.theme, 'dark', 'unrelated keys survive');
  assert.deepEqual(after.permissions, { defaultMode: 'auto' }, 'nested settings survive');
  assert.ok(existsSync(`${p}.bot-harness.bak`), 'a backup is written before the change');
  assert.equal(JSON.parse(readFileSync(`${p}.bot-harness.bak`, 'utf8')).theme, 'dark');
});

test('set(false) writes an explicit false rather than deleting the key', () => {
  const p = tmp();
  set(true, p);
  const st = set(false, p);
  assert.equal(st.enabled, false);
  assert.equal(st.present, true, 'an explicit false is meaningful — it outranks a managed true');
});

test('a corrupt settings file fails loudly instead of being overwritten', () => {
  const p = tmp();
  writeFileSync(p, '{ this is not json');
  assert.throws(() => status(p), /could not parse/);
  assert.equal(readFileSync(p, 'utf8'), '{ this is not json', 'the file is left untouched');
});
