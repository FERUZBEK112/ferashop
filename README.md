# FERA SHOP

Telegram Mini App va bot: Stars, Telegram Premium, PUBG UC, ijtimoiy tarmoq xizmatlari, Gemini va CapCut xizmatlarini sotish uchun tayyor do‘kon.

## Lokal ishga tushirish

```bash
cp .env.example .env
npm install
npm start
```

Brauzer: `http://localhost:3000`

## Muhit o‘zgaruvchilari

- `BOT_TOKEN` — @BotFather bergan token
- `ADMIN_IDS` — admin Telegram IDlari, vergul bilan
- `WEBAPP_URL` — Railway public URL
- `DATABASE_URL` — Railway PostgreSQL URL
- `PAYMENT_CARD`, `PAYMENT_CARD_OWNER` — to‘lov rekvizitlari
- `SUPPORT_USERNAME` — yordam username

Bot `/start`, `/shop`, `/orders`, `/id`, `/admin` buyruqlarini qo‘llaydi. Adminlar `/stats`, `/orders`, `/setstatus ORDER_ID STATUS` buyruqlaridan foydalanadi.
