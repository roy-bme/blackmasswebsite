const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const file = path.resolve('lib/ops/trading.ts');
const mod = new Module(file, module);
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const { tradingClusters, weeklyCounts, harareWeek, parseTradingLink } = mod.exports;
const edge = (a,b,status='confirmed') => ({buyer_business_id:a,seller_business_id:b,status});
test('connected components include chains, merge bridges, ignore reported edges and pairs', () => {
  const links = [edge('a','b'),edge('c','b'),edge('c','d'),edge('x','y'),edge('y','z'),edge('d','x','reported'),edge('one','two'),edge(null,'a'),edge('a','a'),edge('b','a')];
  assert.deepEqual(tradingClusters(links), [['a','b','c','d'], ['x','y','z']]);
  assert.deepEqual(tradingClusters([...links,edge('d','x')]), [['a','b','c','d','x','y','z']]);
});
test('Harare week boundary is Monday midnight, not rolling 7 days or server local time', () => {
  assert.deepEqual(harareWeek(new Date('2026-10-18T22:00:00Z')), {start:'2026-10-18T22:00:00.000Z',end:'2026-10-25T22:00:00.000Z'});
  assert.equal(harareWeek(new Date('2026-10-18T21:59:59Z')).start, '2026-10-11T22:00:00.000Z');
});
test('weekly summary includes start, excludes end and groups per author/status', () => {
  const at = (created_at,created_by,status) => ({created_at,created_by,status});
  assert.deepEqual(weeklyCounts([
    at('2026-10-18T22:00:00.000Z','brendon','reported'),
    at('2026-10-20T09:00:00.000Z','brendon','confirmed'),
    at('2026-10-20T09:00:00.000Z','roy','confirmed'),
    at('2026-10-25T22:00:00.000Z','roy','reported'),
    at('2026-10-18T21:59:59.000Z','roy','reported'),
  ],new Date('2026-10-21')), [{id:'brendon',reported:1,confirmed:1},{id:'roy',reported:0,confirmed:1}]);
});
const valid = {buyer_business_id:'00000000-0000-0000-0000-000000000001',seller_business_id:'00000000-0000-0000-0000-000000000002',goods_or_service:'Bread',trade_frequency:'weekly',current_payment_method:'EcoCash',status:'reported'};
test('validation rejects self links, malformed payloads, unexpected enums and unacknowledged confirmation', () => {
  for (const body of [null,[],{...valid,buyer_business_id:valid.seller_business_id},{...valid,trade_frequency:'daily'},{...valid,current_payment_method:'bitcoin'},{...valid,status:'confirmed'},{...valid,buyer_whatsapp:'not a number'},{...valid,goods_or_service:' '}]) assert.throws(()=>parseTradingLink(body));
  assert.equal(parseTradingLink({...valid,status:'confirmed',confirmed_by_both:true}).status,'confirmed');
});
test('caller cannot inject attribution, timestamps or financial fields', () => {
  const row = parseTradingLink({...valid,created_by:'someone-else',created_at:'2000-01-01',est_monthly_volume:10000});
  assert.equal(row.created_by,undefined); assert.equal(row.created_at,undefined); assert.equal(row.est_monthly_volume,undefined);
});
