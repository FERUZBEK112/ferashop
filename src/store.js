import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized:false } : undefined }) : null;
const memory = { users:new Map(), orders:[] };

export async function initStore(){
  if(!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, theme TEXT DEFAULT 'glass', created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, telegram_id TEXT, username TEXT, items JSONB NOT NULL, total BIGINT NOT NULL,
    payment_method TEXT, contact TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
}

export async function upsertUser(user){
  const u={telegram_id:String(user.id||'guest'),username:user.username||'',first_name:user.first_name||'Mehmon'};
  if(!pool){ memory.users.set(u.telegram_id,{...memory.users.get(u.telegram_id),...u}); return u; }
  await pool.query(`INSERT INTO users(telegram_id,username,first_name) VALUES($1,$2,$3)
    ON CONFLICT(telegram_id) DO UPDATE SET username=$2,first_name=$3`,[u.telegram_id,u.username,u.first_name]);
  return u;
}

export async function setTheme(telegramId,theme){
  if(!['glass','dark','light'].includes(theme)) throw new Error('Invalid theme');
  if(!pool){ const u=memory.users.get(String(telegramId))||{telegram_id:String(telegramId)}; u.theme=theme; memory.users.set(String(telegramId),u); return; }
  await pool.query('UPDATE users SET theme=$1 WHERE telegram_id=$2',[theme,String(telegramId)]);
}

export async function getUser(telegramId){
  if(!pool) return memory.users.get(String(telegramId))||null;
  return (await pool.query('SELECT * FROM users WHERE telegram_id=$1',[String(telegramId)])).rows[0]||null;
}

export async function createOrder(order){
  const saved={id:crypto.randomUUID().slice(0,8).toUpperCase(),status:'pending',created_at:new Date().toISOString(),...order};
  if(!pool){ memory.orders.unshift(saved); return saved; }
  await pool.query(`INSERT INTO orders(id,telegram_id,username,items,total,payment_method,contact,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[saved.id,saved.telegram_id,saved.username,JSON.stringify(saved.items),saved.total,saved.payment_method,saved.contact,saved.status]);
  return saved;
}

export async function getOrders(telegramId){
  if(!pool) return memory.orders.filter(o=>!telegramId||String(o.telegram_id)===String(telegramId));
  const q=telegramId?await pool.query('SELECT * FROM orders WHERE telegram_id=$1 ORDER BY created_at DESC',[String(telegramId)]):await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');
  return q.rows;
}

export async function setOrderStatus(id,status){
  const allowed=['pending','processing','ready','cancelled'];
  if(!allowed.includes(status)) throw new Error('Invalid status');
  if(!pool){ const o=memory.orders.find(x=>x.id===id); if(!o) return null; o.status=status; return o; }
  return (await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',[status,id])).rows[0]||null;
}

export async function stats(){
  if(!pool) return {users:memory.users.size,orders:memory.orders.length,revenue:memory.orders.reduce((s,o)=>s+Number(o.total),0)};
  const [u,o]=await Promise.all([pool.query('SELECT COUNT(*) count FROM users'),pool.query(`SELECT COUNT(*) count,COALESCE(SUM(total),0) revenue FROM orders WHERE status!='cancelled'`)]);
  return {users:Number(u.rows[0].count),orders:Number(o.rows[0].count),revenue:Number(o.rows[0].revenue)};
}
