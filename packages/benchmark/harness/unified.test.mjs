import assert from 'node:assert/strict';
import test from 'node:test';
import { auditRecords, comparisonKey, normalizeMode } from './unified-lib.mjs';

const base = { environment: 'lynx-for-web', workload: 'select@1k', scale: 1000, metric: 'latency', boundary: 'pointerdown-to-dom-predicate', unit: 'ms', revision: 'abc123' };

test('only identical measurement contracts are comparable', () => {
  const valid = { ...base, variant: 'react' };
  const peer = { ...base, variant: 'vue-vdom' };
  const wrongBoundary = { ...base, variant: 'vue-vapor', boundary: 'mt-ack' };
  const wrongRevision = { ...base, variant: 'vue-vapor', revision: 'def456' };
  const audit = auditRecords([valid, peer, wrongBoundary, wrongRevision]);
  assert.equal(audit.comparable.length, 1);
  assert.equal(audit.singleton.length, 2);
  assert.equal(comparisonKey(valid), comparisonKey(peer));
  assert.notEqual(comparisonKey(valid), comparisonKey(wrongBoundary));
  assert.notEqual(comparisonKey(valid), comparisonKey(wrongRevision));
});

test('legacy Vue mode names normalize without changing React', () => {
  assert.equal(normalizeMode('vdom'), 'vue-vdom');
  assert.equal(normalizeMode('vapor'), 'vue-vapor');
  assert.equal(normalizeMode('react'), 'react');
});
