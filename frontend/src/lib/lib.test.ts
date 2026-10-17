import { test } from 'node:test';
import assert from 'node:assert/strict';
import { highlightNew, imaginationLabel } from './text.ts';
import { customPersona, personaForRound, PERSONAS } from './personas.ts';
import { parseSSE } from './sse.ts';

test('highlightNew marks only new words and keeps the text intact', () => {
  const parts = highlightNew('A brass lake, glowing.', ['brass', 'glowing']);
  assert.equal(parts.map((p) => p.text).join(''), 'A brass lake, glowing.');
  assert.deepEqual(parts.filter((p) => p.isNew).map((p) => p.text), ['brass', 'glowing']);
});

test('custom personas get a usable name and voice', () => {
  const p = customPersona('as a tired barista who sees coffee art everywhere');
  assert.equal(p.name, 'Tired barista');
  assert.equal(p.voice, 'as a tired barista who sees coffee art everywhere');
  assert.equal(customPersona('pirate').voice, 'as a pirate');
});

test('team members take turns, shuffle picks from the team', () => {
  const team = PERSONAS.slice(0, 3);
  assert.deepEqual([0, 1, 2, 3].map((i) => personaForRound(team, i, false).id), [team[0].id, team[1].id, team[2].id, team[0].id]);
  assert.equal(personaForRound(team, 0, true, () => 0.99).id, team[2].id);
});

test('imagination labels', () => {
  assert.deepEqual([0, 0.5, 0.9].map(imaginationLabel), ['Literal', 'Playful', 'Unhinged']);
});

test('parseSSE handles events split across chunks', () => {
  const events: [string, unknown][] = [];
  let buf = parseSSE('', 'event: stage\ndata: {"stage":"pain', (e, d) => events.push([e, d]));
  buf = parseSSE(buf, 'ting"}\n\nevent: token\ndata: {"text":"hi"}\n\n', (e, d) => events.push([e, d]));
  assert.equal(buf, '');
  assert.deepEqual(events, [['stage', { stage: 'painting' }], ['token', { text: 'hi' }]]);
});
