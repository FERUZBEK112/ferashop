import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, products, byId } from '../src/catalog.js';

test('catalog has all FERA SHOP sections',()=>{
  assert.equal(categories.length,7);
  for(const id of ['stars','premium','pubg','social','gemini','capcut']) assert.ok(categories.some(c=>c.id===id));
  assert.ok(products.length>=20);
});

test('product IDs are unique and resolvable',()=>{
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  for(const p of products) assert.equal(byId(p.id),p);
});
