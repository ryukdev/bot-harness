import { test } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readTurns, extractText, conversationChars } from '../src/session.mjs';
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

test('conversationChars ignores harness scaffolding re-injected on reconnect', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'bh-conv-')), 's.jsonl');
  const convo = [
    JSON.stringify({ type: 'user', message: { role: 'user', content: 'hello' } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: 'hi' } }),
  ];
  const scaffolding = [
    JSON.stringify({ type: 'attachment', attachment: { type: 'skill_listing', body: 'x'.repeat(5000) } }),
    JSON.stringify({ type: 'attachment', attachment: { type: 'mcp_instructions_delta', body: 'y'.repeat(3000) } }),
  ];
  writeFileSync(p, [...convo, ...scaffolding].join('\n') + '\n');
  const raw = readFileSync(p, 'utf8').length;
  const conv = conversationChars(p);
  assert.ok(raw > 8000, 'the file really is dominated by scaffolding');
  assert.ok(conv < 200, `conversation should be tiny, got ${conv}`);
  assert.equal(conv, convo.reduce((n, l) => n + l.length + 1, 0));
});

test('conversationChars survives an unparseable line', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'bh-conv2-')), 's.jsonl');
  writeFileSync(p, 'not json\n' + JSON.stringify({ type: 'user', message: {} }) + '\n');
  assert.ok(conversationChars(p) > 0, 'a corrupt line is counted, never thrown on');
});
