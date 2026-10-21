import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, products, byId } from './src/catalog.js';
import { createNftListing, createNftSubmission, createOrder, getNftListing, getNftListings, getNftSubmissions, getOrders, getUser, initStore, setNftSubmissionStatus, setTheme, upsertUser } from './src/store.js';
import { notifyAdmins, notifyNftSubmission, notifyNftSubmissionStatus, startBot, validateInitData } from './src/telegram.js';

const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
const admins=new Set((process.env.ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean));
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));

function auth(req,res,next){
  const initData=req.header('x-telegram-init-data')||'';
  if(!validateInitData(initData)) return res.status(401).json({error:'Telegram tasdiqlashi xato'});
  try{
    const raw=new URLSearchParams(initData).get('user');
    req.user=raw?JSON.parse(raw):{id:req.header('x-demo-user')||'guest',username:'demo_user',first_name:'Foydalanuvchi'};
  }catch{ req.user={id:'guest',username:'demo_user',first_name:'Foydalanuvchi'}; }
  next();
}

function adminOnly(req,res,next){
  if(!admins.has(String(req.user?.id))) return res.status(403).json({error:'Faqat admin uchun'});
  next();
}
function cleanUrl(value){
  try{ const url=new URL(String(value||'').trim()); return ['http:','https:'].includes(url.protocol)?url.href:null; }catch{return null;}
}
function cleanPrice(value){ const price=Math.round(Number(value)); return Number.isSafeInteger(price)&&price>0&&price<=999999999?price:null; }
function cleanUsername(value){ return String(value||'').trim().replace(/^@/,'').slice(0,64); }

app.get('/api/health',(_,res)=>res.json({ok:true,name:'FERA SHOP'}));
app.get('/api/catalog',(_,res)=>res.json({categories,products}));
app.get('/api/config',(_,res)=>res.json({support:process.env.SUPPORT_USERNAME||'@fera_shop_support',card:process.env.PAYMENT_CARD||'0000 0000 0000 0000',cardOwner:process.env.PAYMENT_CARD_OWNER||'FERA SHOP'}));
app.post('/api/session',auth,async(req,res)=>{ await upsertUser(req.user); res.json({user:{...req.user,...await getUser(req.user.id),isAdmin:admins.has(String(req.user.id))}}); });
app.put('/api/theme',auth,async(req,res)=>{ await upsertUser(req.user); await setTheme(req.user.id,req.body.theme); res.json({ok:true}); });
app.get('/api/orders',auth,async(req,res)=>res.json({orders:await getOrders(req.user.id)}));
app.post('/api/orders',auth,async(req,res)=>{
  const clean=(req.body.items||[]).map(i=>{const p=byId(i.id); return p?{id:p.id,name:p.name,price:p.price,qty:Math.max(1,Math.min(99,Number(i.qty)||1))}:null}).filter(Boolean);
  if(!clean.length) return res.status(400).json({error:'Savat bo‘sh'});
  const total=clean.reduce((s,i)=>s+i.price*i.qty,0);
  const order=await createOrder({telegram_id:String(req.user.id),username:req.user.username||'',items:clean,total,payment_method:req.body.paymentMethod||'card',contact:String(req.body.contact||'').slice(0,100)});
  await notifyAdmins(order);
  res.status(201).json({order});
});
app.get('/api/nfts',async(req,res)=>res.json({listings:await getNftListings()}));
app.post('/api/nft-submissions',auth,async(req,res)=>{
  const nftUrl=cleanUrl(req.body.nftUrl),price=cleanPrice(req.body.price),username=cleanUsername(req.body.username||req.user.username);
  if(!nftUrl) return res.status(400).json({error:'NFT havolasini to‘g‘ri kiriting'});
  if(!price) return res.status(400).json({error:'NFT narxini to‘g‘ri kiriting'});
  if(!username) return res.status(400).json({error:'Telegram username kiriting'});
  const submission=await createNftSubmission({telegram_id:String(req.user.id),username,nft_url:nftUrl,price});
  await notifyNftSubmission(submission);
  res.status(201).json({submission});
});
app.post('/api/nft-purchases',auth,async(req,res)=>{
  const listing=await getNftListing(String(req.body.listingId||''));
  if(!listing) return res.status(404).json({error:'NFT e’loni topilmadi'});
  const order=await createOrder({telegram_id:String(req.user.id),username:req.user.username||'',items:[{id:`nft-${listing.id}`,name:`NFT @${listing.username}`,price:Number(listing.price),qty:1}],total:Number(listing.price),payment_method:'nft',contact:req.user.username?`@${req.user.username}`:''});
  await notifyAdmins(order);
  res.status(201).json({order});
});
app.get('/api/admin/nft-submissions',auth,adminOnly,async(req,res)=>res.json({submissions:await getNftSubmissions()}));
app.post('/api/admin/nfts',auth,adminOnly,async(req,res)=>{
  const imageUrl=cleanUrl(req.body.imageUrl),price=cleanPrice(req.body.price),username=cleanUsername(req.body.username);
  if(!imageUrl) return res.status(400).json({error:'NFT rasmi havolasini to‘g‘ri kiriting'});
  if(!price) return res.status(400).json({error:'NFT narxini to‘g‘ri kiriting'});
  if(!username) return res.status(400).json({error:'Username kiriting'});
  res.status(201).json({listing:await createNftListing({image_url:imageUrl,price,username})});
});
app.patch('/api/admin/nft-submissions/:id',auth,adminOnly,async(req,res)=>{
  const status=String(req.body.status||'');
  if(!['bought','rejected'].includes(status)) return res.status(400).json({error:'Noto‘g‘ri holat'});
  const submission=await setNftSubmissionStatus(req.params.id,status);
  if(!submission) return res.status(404).json({error:'NFT arizasi topilmadi'});
  await notifyNftSubmissionStatus(submission);
  res.json({submission});
});
app.use((req,res,next)=>{
  if(req.method!=='GET') return next();
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const port=process.env.PORT||3000;
await initStore();
app.listen(port,()=>console.log(`FERA SHOP http://localhost:${port}`));
startBot();
