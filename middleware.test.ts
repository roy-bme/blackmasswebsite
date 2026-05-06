import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRouteMode } from './lib/ops/route-mode';

test('blocks /indaba paths on non-indaba hosts', () => {
  assert.equal(resolveRouteMode('blackmass.co.uk', '/indaba'), 'block_portal');
  assert.equal(resolveRouteMode('evil.example', '/indaba/map'), 'block_portal');
});

test('allows marketing paths on marketing hosts', () => {
  assert.equal(resolveRouteMode('blackmass.co.uk', '/about'), 'marketing');
});

test('routes indaba hosts to indaba surface', () => {
  assert.equal(resolveRouteMode('indaba.zimx.io', '/'), 'indaba');
  assert.equal(resolveRouteMode('indaba-demo.vercel.app', '/map'), 'indaba');
});
