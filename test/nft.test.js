import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNftListing,
  createNftSubmission,
  getNftListing,
  getNftListings,
  getNftSubmissions,
  setNftSubmissionStatus
} from '../src/store.js';

test('NFT submission can be created and reviewed',async()=>{
  const submission=await createNftSubmission({
    telegram_id:'7001',
    username:'seller',
    nft_url:'https://t.me/nft/example',
    price:250000
  });
  assert.equal(submission.status,'pending');
  assert.ok((await getNftSubmissions()).some(item=>item.id===submission.id));
  const reviewed=await setNftSubmissionStatus(submission.id,'bought');
  assert.equal(reviewed.status,'bought');
});

test('admin NFT listing is visible in the marketplace',async()=>{
  const listing=await createNftListing({
    image_url:'https://example.com/nft.png',
    price:350000,
    username:'fera_shop'
  });
  assert.equal((await getNftListing(listing.id)).price,350000);
  assert.ok((await getNftListings()).some(item=>item.id===listing.id));
});
