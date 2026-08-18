import { test } from 'node:test';
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { readTurns, extractText } from '../src/session.mjs';
test('extractText handles string and block content', () => {
  assert.equal(extractText({ content: 'hi' }), 'hi');
  assert.equal(extractText({ content: [{type:'text',text:'a'},{type:'tool_use'},{type:'text',text:'b'}] }), 'a b');
  assert.equal(extractText(null), '');
});
test('readTurns extracts ordered user/assistant turns, tail-limited', () => {
  const p = '/tmp/bh-session-test.jsonl';
  writeFileSync(p, [
    JSON.stringify({type:'user',message:{role:'user',content:'one'}}),
    JSON.stringify({type:'assistant',message:{role:'assistant',content:[{type:'text',text:'two'}]}}),
    JSON.stringify({type:'system',message:{content:'ignore me'}}),
    JSON.stringify({type:'user',message:{role:'user',content:'three'}}),
  ].join('\n'));
  const turns = readTurns(p);
  assert.equal(turns.length, 3);
  assert.deepEqual(turns.map(t=>t.role), ['user','assistant','user']);
  assert.equal(turns[2].text, 'three');
  assert.equal(readTurns(p, 1).length, 1);
});
