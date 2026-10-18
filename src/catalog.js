export const categories = [
  { id: 'stars', name: 'Telegram Stars', short: 'Stars Gift', subtitle: 'Premium sovg‘alar', icon: 'star', color: '#1677ff' },
  { id: 'premium', name: 'Telegram Premium', short: 'Premium', subtitle: 'Telegram Premium', icon: 'telegram', color: '#168cff' },
  { id: 'nft', name: 'NFT', short: 'NFT', subtitle: 'Raqamli kolleksiyalar', icon: 'nft', color: '#8659ff' },
  { id: 'pubg', name: 'PUBG UC', short: 'PUBG UC', subtitle: 'Barcha serverlar', icon: 'pubg', color: '#df9c13' },
  { id: 'social', name: 'Nakruttka', short: 'Nakruttka', subtitle: 'Ijtimoiy tarmoqlar', icon: 'social', color: '#ef3c88' },
  { id: 'gemini', name: 'Gemini 18 oy', short: 'Gemini 18 oy', subtitle: 'AI xizmati', icon: 'gemini', color: '#336cdf' },
  { id: 'capcut', name: 'CapCut Pro', short: 'CapCut Pro', subtitle: 'Video tahrirlash', icon: 'capcut', color: '#111' }
];

export const products = [
  ...[[50,12000],[100,22000],[250,50000],[500,95000],[1000,180000]].map(([amount,price],i)=>({id:`stars-${amount}`,category:'stars',name:`${amount} Stars`,description:'Telegram Stars',price,badge:i===1?'Mashhur':'',icon:'star'})),
  ...[[3,150000],[6,289000],[12,499000]].map(([months,price],i)=>({id:`premium-${months}`,category:'premium',name:`${months} oy`,description:'Telegram Premium',price,badge:i===0?'Mashhur':'',icon:'telegram'})),
  ...[[60,13000],[325,62000],[660,125000],[1800,310000],[3850,620000]].map(([amount,price],i)=>({id:`pubg-${amount}`,category:'pubg',name:`${amount} UC`,description:'Global server',price,badge:i===1?'Mashhur':'',icon:'pubg'})),
  {id:'instagram-followers',category:'social',group:'Instagram',name:'Instagram Obunachilar',description:'1000 ta',price:20000,icon:'instagram'},
  {id:'instagram-like',category:'social',group:'Instagram',name:'Instagram Like',description:'1000 ta',price:12000,icon:'heart'},
  {id:'tiktok-followers',category:'social',group:'TikTok',name:'TikTok Obunachilar',description:'1000 ta',price:18000,icon:'tiktok'},
  {id:'tiktok-like',category:'social',group:'TikTok',name:'TikTok Like',description:'1000 ta',price:10000,icon:'tiktok'},
  {id:'youtube-followers',category:'social',group:'YouTube',name:'YouTube Obunachilar',description:'1000 ta',price:25000,icon:'youtube'},
  {id:'telegram-followers',category:'social',group:'Telegram',name:'Telegram Obunachilar',description:'1000 ta',price:15000,icon:'telegram'},
  {id:'gemini-18',category:'gemini',name:'18 oy',description:'Gemini Advanced',price:299000,badge:'Eng yaxshi tanlov',icon:'gemini'},
  {id:'capcut-1',category:'capcut',name:'1 oy',description:'CapCut Pro',price:79000,icon:'capcut'},
  {id:'capcut-3',category:'capcut',name:'3 oy',description:'CapCut Pro',price:179000,badge:'Mashhur',icon:'capcut'},
  {id:'capcut-12',category:'capcut',name:'12 oy',description:'CapCut Pro',price:499000,icon:'capcut'},
  {id:'nft-basic',category:'nft',name:'NFT Basic',description:'Raqamli sovg‘a',price:99000,icon:'nft'}
];

export const byId = id => products.find(p => p.id === id);
