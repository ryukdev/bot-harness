import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The pool path is derived from $HOME, so give each test its own.
const sandbox = () => { process.env.HOME = mkdtempSync(join(tmpdir(), 'bh-acct-')); };

test('a label changes what is displayed, never what is keyed', async () => {
  sandbox();
  const { upsert, setLabel, display, tokenFor, emails } = await import('../src/accounts.mjs?1');
  upsert('me@work.com', 'tok-a');
  upsert('me@home.com', 'tok-b');
  assert.equal(display('me@work.com'), 'me@work.com', 'no label means show the email');

  setLabel('me@work.com', 'account 1');
  assert.equal(display('me@work.com'), 'account 1');
  assert.equal(tokenFor('me@work.com'), 'tok-a', 'lookup is still by email');
  assert.deepEqual(emails(), ['me@work.com', 'me@home.com'], 'the pool is still email-keyed');
});

test('clearing a label goes back to the email', async () => {
  sandbox();
  const { upsert, setLabel, display } = await import('../src/accounts.mjs?2');
  upsert('me@work.com', 'tok');
  setLabel('me@work.com', 'account 1');
  setLabel('me@work.com', '');
  assert.equal(display('me@work.com'), 'me@work.com');
});

test('a token update keeps the label', async () => {
  sandbox();
  const { upsert, setLabel, display, tokenFor } = await import('../src/accounts.mjs?3');
  upsert('me@work.com', 'old');
  setLabel('me@work.com', 'account 1');
  upsert('me@work.com', 'new');
  assert.equal(tokenFor('me@work.com'), 'new', 'the token really was replaced');
  assert.equal(display('me@work.com'), 'account 1', 'and the label survived it');
});

test('labelling an account that is not in the pool reports nothing set', async () => {
  sandbox();
  const { setLabel } = await import('../src/accounts.mjs?4');
  assert.equal(setLabel('stranger@example.com', 'x'), null);
});

test('the pool file stays chmod 600 after a label change', async () => {
  sandbox();
  const { upsert, setLabel, FILE } = await import('../src/accounts.mjs?5');
  upsert('me@work.com', 'tok');
  setLabel('me@work.com', 'account 1');
  const { statSync } = await import('node:fs');
  assert.equal(statSync(FILE).mode & 0o777, 0o600);
});

test('an account can be resolved by label or by email', async () => {
  sandbox();
  const { upsert, setLabel, resolve } = await import('../src/accounts.mjs?6');
  upsert('me@work.com', 'tok');
  setLabel('me@work.com', 'account 1');
  assert.equal(resolve('me@work.com'), 'me@work.com', 'email still works');
  assert.equal(resolve('account 1'), 'me@work.com', 'label resolves to the email');
  assert.equal(resolve('ACCOUNT 1'), 'me@work.com', 'label match is case-insensitive');
  assert.equal(resolve('nobody'), null, 'an unknown name resolves to nothing');
});
