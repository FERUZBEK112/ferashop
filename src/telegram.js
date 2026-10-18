import crypto from 'node:crypto';
import { getOrders, setOrderStatus, stats, upsertUser } from './store.js';

const token=process.env.BOT_TOKEN;
const admins=new Set((process.env.ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean));
const api=method=>`https://api.telegram.org/bot${token}/${method}`;
let offset=0;

export function validateInitData(initData){
  if(!token || !initData) return process.env.NODE_ENV!=='production';
  const p=new URLSearchParams(initData), hash=p.get('hash'); p.delete('hash');
  const data=[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const secret=crypto.createHmac('sha256','WebAppData').update(token).digest();
  const check=crypto.createHmac('sha256',secret).update(data).digest('hex');
  if(!hash || hash.length!==check.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash),Buffer.from(check));
}

async function call(method,body){
  if(!token) return null;
  const r=await fetch(api(method),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`Telegram ${method}: ${r.status}`);
  return r.json();
}

export async function sendMessage(chatId,text,extra={}){ return call('sendMessage',{chat_id:chatId,text,parse_mode:'HTML',...extra}); }

async function handle(message){
  const chatId=message.chat.id, text=message.text||'', user=message.from;
  await upsertUser(user);
  const url=process.env.WEBAPP_URL||'http://localhost:3000';
  const shop={inline_keyboard:[[{text:'🛍 FERA SHOP’ni ochish',web_app:{url}}]]};
  if(text.startsWith('/start')) return sendMessage(chatId,`👋 <b>FERA SHOP</b>’ga xush kelibsiz, ${user.first_name}!\n\nStars, Premium, PUBG UC va boshqa raqamli xizmatlar bir joyda.`,{reply_markup:shop});
  if(text==='/shop') return sendMessage(chatId,'Kerakli xizmatni tanlang:',{reply_markup:shop});
  if(text==='/id') return sendMessage(chatId,`Sizning Telegram ID: <code>${user.id}</code>`);
  if(text==='/stats' && admins.has(String(user.id))){ const s=await stats(); return sendMessage(chatId,`👥 ${s.users} foydalanuvchi\n📦 ${s.orders} buyurtma\n💰 ${s.revenue.toLocaleString('uz-UZ')} so‘m`); }
  if(text==='/orders' && admins.has(String(user.id))){ const os=await getOrders(); return sendMessage(chatId,os.slice(0,20).map(o=>`#${o.id} | ${o.username||o.telegram_id} | ${o.total} | ${o.status}`).join('\n')||'Buyurtma yo‘q'); }
  if(text==='/orders'){
    const orders=await getOrders(user.id);
    return sendMessage(chatId,orders.length?orders.slice(0,10).map(o=>`<b>#${o.id}</b> — ${Number(o.total).toLocaleString('uz-UZ')} so‘m — ${o.status}`).join('\n'):'Sizda hali buyurtma yo‘q.');
  }
  if(text==='/admin' && admins.has(String(user.id))) return sendMessage(chatId,'Admin buyruqlari:\n/stats\n/orders\n/setstatus ID ready');
  if(text.startsWith('/setstatus') && admins.has(String(user.id))){ const [,id,status]=text.split(/\s+/); const o=await setOrderStatus(id,status); if(o){await sendMessage(o.telegram_id,`📦 Buyurtma <b>#${o.id}</b> holati: <b>${status}</b>`); return sendMessage(chatId,'✅ Yangilandi');} return sendMessage(chatId,'Buyurtma topilmadi'); }
  return sendMessage(chatId,'FERA SHOP’ni ochish uchun quyidagi tugmani bosing.',{reply_markup:shop});
}

export async function startBot(){
  if(!token){ console.log('BOT_TOKEN yo‘q — bot polling o‘chirilgan'); return; }
  await call('setMyCommands',{commands:[{command:'start',description:'Botni boshlash'},{command:'shop',description:'FERA SHOP’ni ochish'},{command:'orders',description:'Buyurtmalarim'},{command:'id',description:'Telegram ID'}]});
  const loop=async()=>{
    try{
      const r=await fetch(api(`getUpdates?timeout=25&offset=${offset}`));
      const data=await r.json();
      for(const u of data.result||[]){ offset=u.update_id+1; if(u.message) await handle(u.message); }
    }catch(e){ console.error('Bot polling:',e.message); await new Promise(r=>setTimeout(r,2000)); }
    setImmediate(loop);
  }; loop();
}

export async function notifyAdmins(order){
  const text=`🆕 <b>Yangi buyurtma #${order.id}</b>\n👤 @${order.username||'username_yoq'} (${order.telegram_id})\n💰 ${Number(order.total).toLocaleString('uz-UZ')} so‘m\n💳 ${order.payment_method}\n📦 ${order.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}`;
  await Promise.all([...admins].map(id=>sendMessage(id,text).catch(()=>null)));
}
