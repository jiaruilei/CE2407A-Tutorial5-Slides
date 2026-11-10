import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { InkHistory, pointFromClient, segmentHitsStroke, clipSegmentToRect } from '../annotations-model.js';

const viewKeys = ['slide-1', 'explore-t3-q2', 'explore-t3-q2:expanded', 'explore-t3-q3', 'explore-t3-q3:expanded'];
const stroke = (id = 'a', points = [{ x: 0, y: 0 }, { x: 100, y: 0 }], options = {}) =>
  ({ id, tool: 'pen', color: '#abcdef', width: 4, anchor: 'slide', points, ...options });
const closeSegment = (actual, expected) => {
  assert.ok(actual);
  for (const endpoint of ['from', 'to']) for (const axis of ['x', 'y']) {
    assert.ok(Math.abs(actual[endpoint][axis] - expected[endpoint][axis]) < 1e-9);
  }
};

test('snapshots are deeply immutable, detached from caller data and isolated by slide/layout', () => {
  const history = new InkHistory(viewKeys), first = stroke('a');
  history.add('slide-1', first);
  first.points[0].x = 1000; first.width = 20;
  const saved = history.get('slide-1');
  assert.equal(saved[0].points[0].x, 0);
  assert.equal(saved[0].width, 4);
  assert.throws(() => { saved[0].points[0].x = 20; }, TypeError);
  assert.throws(() => saved.push(stroke('b')), TypeError);
  history.add('explore-t3-q2', stroke('b'));
  history.add('explore-t3-q2:expanded', stroke('c', undefined, { anchor: 'question' }));
  history.add('slide-1', stroke('d'));
  assert.equal(history.undo('slide-1'), true);
  assert.deepEqual(history.get('slide-1').map(s => s.id), ['a']);
  assert.deepEqual(history.get('explore-t3-q2').map(s => s.id), ['b']);
  assert.deepEqual(history.get('explore-t3-q2:expanded').map(s => s.id), ['c']);
  assert.equal(history.redo('slide-1'), true);
  assert.deepEqual(history.get('slide-1').map(s => s.id), ['a', 'd']);
});

test('clear is undoable, no-op changes preserve history and edits after undo discard redo', () => {
  const history = new InkHistory(viewKeys);
  assert.equal(history.clear('slide-1'), false);
  history.add('slide-1', stroke());
  assert.equal(history.commit('slide-1', [stroke()]), false);
  assert.equal(history.clear('slide-1'), true);
  assert.equal(history.canUndo('slide-1'), true);
  assert.equal(history.get('slide-1').length, 0);
  history.undo('slide-1');
  assert.equal(history.get('slide-1').length, 1);
  assert.equal(history.canRedo('slide-1'), true);
  assert.equal(history.commit('slide-1', history.get('slide-1')), false);
  assert.equal(history.canRedo('slide-1'), true);
  history.add('slide-1', stroke('b'));
  assert.equal(history.canRedo('slide-1'), false);
  assert.equal(history.redo('slide-1'), false);
});

test('each slide retains at most 50 revisions including the current snapshot', () => {
  const history = new InkHistory(viewKeys);
  for (let i = 0; i < 60; i++) history.commit('slide-1', [stroke(String(i))]);
  history.add('explore-t3-q3', stroke('independent'));
  let undos = 0;
  while (history.undo('slide-1')) undos++;
  assert.equal(undos, 49);
  assert.equal(history.get('slide-1')[0].id, '10');
  assert.equal(history.canUndo('explore-t3-q3'), true);
  assert.throws(() => new InkHistory(viewKeys, 51), RangeError);
});

test('serialized current ink round-trips, preserves document coordinates and resets undo history', () => {
  const source = new InkHistory(viewKeys);
  source.add('explore-t3-q3:expanded', stroke('notes', [{ x: -25, y: 8500 }, { x: 300, y: 9000 }], { anchor: 'question', tool: 'highlighter' }));
  source.add('slide-1', stroke('title'));
  source.clear('slide-1');
  const payload = source.serialize(), destination = new InkHistory(viewKeys);
  assert.equal(payload.version, 1);
  assert.deepEqual(Object.keys(payload.slides), ['explore-t3-q3:expanded']);
  assert.equal(destination.load(JSON.stringify(payload)), true);
  assert.deepEqual(destination.serialize(), payload);
  assert.equal(destination.canUndo('explore-t3-q3:expanded'), false);
  assert.equal(destination.canRedo('explore-t3-q3:expanded'), false);
  assert.equal(destination.load({ version: 1, slides: {} }), true);
  assert.equal(destination.get('explore-t3-q3:expanded').length, 0);
});

test('each slide and expanded exercise has an independent, restorable ink history', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
  const keys = sections.flatMap(([, id, body]) =>
    /class="web-panel"/.test(body) ? [id, `${id}:expanded`] : [id]);
  assert.ok(keys.includes('slide-1'));
  for (const question of [2, 3, 4, 5]) {
    assert.ok(keys.includes(`question-t3-q${question}`));
    assert.ok(keys.some(key => key === `notes-t3-q${question}` || key.startsWith(`notes-t3-q${question}-`)));
    assert.ok(keys.includes(`explore-t3-q${question}:expanded`));
  }
  assert.equal(new Set(keys).size, keys.length);
  const history = new InkHistory(keys);
  for (const key of keys) {
    assert.equal(history.add(key, stroke(`ink-${key}`)), true);
    assert.equal(history.clear(key), true);
    assert.equal(history.undo(key), true);
  }
  const restored = new InkHistory(keys);
  assert.equal(restored.load(JSON.stringify(history.serialize())), true);
  for (const key of keys) assert.equal(restored.get(key)[0].id, `ink-${key}`);
});

test('invalid loads are atomic and cannot inject keys, bad coordinates or extra stroke properties', () => {
  const history = new InkHistory(viewKeys);
  history.add('slide-1', stroke('existing'));
  const before = history.serialize();
  const invalid = [
    '{bad JSON', null, { version: 2, slides: {} }, { version: 1, slides: [] },
    { version: 1, slides: new Date() }, { version: 1, slides: new Map() },
    { version: 1, slides: { 'unknown': [] } },
    { version: 1, slides: { 'slide-1:expanded': [] } },
    { version: 1, slides: { 'explore-t3-q2:other': [] } },
    { version: 1, slides: { 'question-t3-q2:expanded': [] } },
    JSON.parse('{"version":1,"slides":{"__proto__":[]}}'),
    { version: 1, slides: { 'explore-t3-q2': [stroke('valid')], 'explore-t3-q3': [stroke('invalid', [{ x: Infinity, y: 1 }])] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a', [{ x: 1e7 + 1, y: 0 }])] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a', [], {})] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a', undefined, { width: 41 })] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a', undefined, { tool: 'script' })] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a', undefined, { color: 'url(javascript:x)' })] } },
    { version: 1, slides: { 'explore-t3-q2': [stroke('a'), stroke('a')] } }
  ];
  for (const payload of invalid) {
    assert.equal(history.load(payload), false);
    assert.deepEqual(history.serialize(), before);
    assert.equal(history.canUndo('slide-1'), true);
  }
  assert.equal(history.load({ version: 1, slides: { 'explore-t3-q2': [{ ...stroke(), html: '<script>bad</script>' }] } }), true);
  assert.equal('html' in history.get('explore-t3-q2')[0], false);
  assert.equal({}.polluted, undefined);
});

test('stroke and point limits apply across slides and rejected commits leave state intact', () => {
  const history = new InkHistory(viewKeys);
  history.commit('slide-1', Array.from({ length: 5000 }, (_, i) => stroke(String(i), [{ x: i, y: 0 }])));
  assert.throws(() => history.add('explore-t3-q2', stroke()), RangeError);
  assert.equal(history.get('explore-t3-q2').length, 0);
  assert.equal(history.load({ version: 1, slides: { 'slide-1': [stroke('huge', Array(200001).fill({ x: 0, y: 0 }))] } }), false);
  const atLimit = new InkHistory(viewKeys);
  assert.equal(atLimit.load({ version: 1, slides: {
    'slide-1': [stroke('large', Array(199999).fill({ x: 0, y: 0 }))],
    'explore-t3-q2': [stroke('last', [{ x: 1, y: 1 }])]
  } }), true);
  assert.throws(() => atLimit.add('explore-t3-q3', stroke('overflow', [{ x: 1, y: 1 }])), RangeError);
  assert.equal(atLimit.get('explore-t3-q3').length, 0);
});

test('undo cannot restore an old snapshot beyond the document-wide stroke budget', () => {
  const history = new InkHistory(viewKeys);
  history.commit('slide-1', Array.from({ length: 5000 }, (_, i) => stroke(String(i), [{ x: i, y: 0 }])));
  history.clear('slide-1');
  history.add('explore-t3-q2', stroke('new'));
  assert.equal(history.canUndo('slide-1'), false);
  assert.equal(history.undo('slide-1'), false);
  assert.equal(history.get('slide-1').length, 0);
  history.clear('explore-t3-q2');
  assert.equal(history.undo('slide-1'), true);
  assert.equal(history.get('slide-1').length, 5000);
});

test('eraser detects crossings even when both eraser endpoints are far from the stroke', () => {
  const horizontal = stroke('a', [{ x: -100, y: 0 }, { x: 100, y: 0 }]);
  assert.equal(segmentHitsStroke(horizontal, { x: 0, y: -100 }, { x: 0, y: 100 }, 0), true);
  assert.equal(segmentHitsStroke(horizontal, { x: -100, y: 5 }, { x: 100, y: 5 }, 3), true);
  assert.equal(segmentHitsStroke(horizontal, { x: -100, y: 5.1 }, { x: 100, y: 5.1 }, 3), false);
  assert.equal(segmentHitsStroke(horizontal, { x: 200, y: 0 }, { x: 300, y: 0 }, 2), false);
  assert.equal(segmentHitsStroke(horizontal, { x: 90, y: 0 }, { x: 200, y: 0 }, 0), true);
});

test('eraser handles a single-point mark, stationary pointer, zero-length stroke segments and joints', () => {
  assert.equal(segmentHitsStroke(stroke('dot', [{ x: 10, y: 10 }]), { x: 0, y: 10 }, { x: 20, y: 10 }, 0), true);
  assert.equal(segmentHitsStroke(stroke('dot', [{ x: 10, y: 10 }]), { x: 15, y: 10 }, { x: 15, y: 10 }, 2), false);
  assert.equal(segmentHitsStroke(stroke('line', [{ x: 10, y: 10 }, { x: 10, y: 10 }]), { x: 10, y: 12 }, { x: 10, y: 12 }, 0), true);
  assert.equal(segmentHitsStroke(stroke('corner', [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }]), { x: 15, y: 10 }, { x: 25, y: 10 }, 0), true);
  assert.equal(segmentHitsStroke(stroke(), { x: NaN, y: 0 }, { x: 0, y: 0 }, 1), false);
});

test('client positions map through scaling and offsets without losing outside or document positions', () => {
  assert.deepEqual(pointFromClient(420, 230, { left: 100, top: 50, width: 640, height: 360 }), { x: 640, y: 360 });
  assert.deepEqual(pointFromClient(100, 50, { left: 100, top: 50, width: 1920, height: 1080 }), { x: 0, y: 0 });
  assert.deepEqual(pointFromClient(90, 40, { left: 100, top: 50, width: 640, height: 360 }), { x: -20, y: -20 });
  assert.deepEqual(pointFromClient(50, 25, { left: 0, top: 0, width: 100, height: 50 }, 1200, 600), { x: 600, y: 300 });
  assert.throws(() => pointFromClient(1, 2, { left: 0, top: 0, width: 0, height: 1 }), TypeError);
});

test('clipping retains the visible part of crossing, entering and leaving eraser sweeps', () => {
  const rect = { x: 10, y: 20, width: 100, height: 50 };
  closeSegment(clipSegmentToRect({ x: 0, y: 40 }, { x: 150, y: 40 }, rect), {
    from: { x: 10, y: 40 }, to: { x: 110, y: 40 }
  });
  closeSegment(clipSegmentToRect({ x: 150, y: 40 }, { x: 0, y: 40 }, rect), {
    from: { x: 110, y: 40 }, to: { x: 10, y: 40 }
  });
  closeSegment(clipSegmentToRect({ x: 60, y: 40 }, { x: 60, y: 100 }, rect), {
    from: { x: 60, y: 40 }, to: { x: 60, y: 70 }
  });
  closeSegment(clipSegmentToRect({ x: -10, y: -10 }, { x: 20, y: 20 }, { x: 0, y: 0, width: 10, height: 10 }), {
    from: { x: 0, y: 0 }, to: { x: 10, y: 10 }
  });
});

test('clipping rejects outside paths and handles stationary points and boundary contact', () => {
  const rect = { x: 10, y: 20, width: 100, height: 50 };
  assert.equal(clipSegmentToRect({ x: 0, y: 10 }, { x: 150, y: 10 }, rect), null);
  assert.equal(clipSegmentToRect({ x: 0, y: 40 }, { x: 5, y: 40 }, rect), null);
  assert.equal(clipSegmentToRect({ x: 0, y: 40 }, { x: 0, y: 40 }, rect), null);
  const from = { x: 20, y: 40 }, to = { x: 20, y: 40 };
  const clipped = clipSegmentToRect(from, to, rect);
  assert.deepEqual(clipped, { from, to });
  assert.notEqual(clipped.from, from);
  assert.deepEqual(clipSegmentToRect({ x: 0, y: 10 }, { x: 10, y: 20 }, rect), {
    from: { x: 10, y: 20 }, to: { x: 10, y: 20 }
  });
  assert.equal(clipSegmentToRect(from, to, { ...rect, width: -1 }), null);
  assert.equal(clipSegmentToRect({ x: Infinity, y: 1 }, to, rect), null);
});
