import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sandbox = () => { process.env.HOME = mkdtempSync(join(tmpdir(), 'bh-cfg-')); };

test('the window defaults to 200k and is reported as assumed', async () => {
  sandbox();
  const { get, DEFAULT_WINDOW } = await import('../src/config.mjs?a');
  assert.equal(get().window, 200000);
  assert.equal(DEFAULT_WINDOW, 200000);
});

test('the window accepts 200000, 200k and 1m', async () => {
  sandbox();
  const { setWindow, get } = await import('../src/config.mjs?b');
  assert.equal(setWindow('1m'), 1_000_000);
  assert.equal(get().window, 1_000_000);
  assert.equal(setWindow('200k'), 200000);
  assert.equal(setWindow('350000'), 350000);
  assert.equal(setWindow('1.5m'), 1_500_000);
});

test('a typo is rejected rather than silently stored', async () => {
  sandbox();
  const { setWindow, get } = await import('../src/config.mjs?c');
  assert.throws(() => setWindow('lots'), /not a token count/);
  assert.throws(() => setWindow('12'), /out of range/, '12 tokens is a typo, not a window');
  assert.throws(() => setWindow('99m'), /out of range/);
  assert.equal(get().window, 200000, 'the stored value is untouched by a rejected input');
});

test('setting the window keeps the model, and vice versa', async () => {
  sandbox();
  const { setWindow, setModel, get } = await import('../src/config.mjs?d');
  setModel('opus');
  setWindow('1m');
  assert.equal(get().model, 'opus');
  assert.equal(get().window, 1_000_000);
  setModel('haiku');
  assert.equal(get().window, 1_000_000, 'the window survives a model change');
});
