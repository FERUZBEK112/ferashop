import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, products, byId } from './src/catalog.js';
import { createOrder, getOrders, getUser, initStore, setTheme, upsertUser } from './src/store.js';
import { notifyAdmins, startBot, validateInitData } from './src/telegram.js';

const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
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

app.get('/api/health',(_,res)=>res.json({ok:true,name:'FERA SHOP'}));
app.get('/api/catalog',(_,res)=>res.json({categories,products}));
app.get('/api/config',(_,res)=>res.json({support:process.env.SUPPORT_USERNAME||'@fera_shop_support',card:process.env.PAYMENT_CARD||'0000 0000 0000 0000',cardOwner:process.env.PAYMENT_CARD_OWNER||'FERA SHOP'}));
app.post('/api/session',auth,async(req,res)=>{ await upsertUser(req.user); res.json({user:{...req.user,...await getUser(req.user.id)}}); });
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
app.use((req,res,next)=>{
  if(req.method!=='GET') return next();
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const port=process.env.PORT||3000;
await initStore();
app.listen(port,()=>console.log(`FERA SHOP http://localhost:${port}`));
startBot();
