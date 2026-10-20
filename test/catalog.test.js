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

test('Telegram Stars prices match the full configured tariff list',()=>{
  const expected = new Map([
    [50,12000],[100,22000],[150,33000],[200,44000],[250,55000],
    [300,65000],[500,99000],[750,150000],[1000,220000],[1500,300000],
    [2500,500000],[5000,950000],[10000,1999000]
  ]);
  const stars = products.filter(product=>product.category==='stars');
  assert.equal(stars.length,expected.size);
  for(const [amount,price] of expected){
    assert.equal(byId(`stars-${amount}`)?.price,price);
  }
});
