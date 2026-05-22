# 💝 Shopify Custom Wishlist App - Complete Setup Guide
## (Bilkul Wishlist Hero jaisi!)

---

## 📦 Is App Mein Kya Hai?

- ✅ Product page par **Heart Button** (Add to Wishlist)
- ✅ **Login/Signup Modal** - Guest users ke liye
- ✅ Customer ka **My Wishlist Page**
- ✅ Admin **Dashboard** - saare customers ki wishlists dekhein
- ✅ **Toast Notifications** - added/removed messages
- ✅ **SQLite Database** - Prisma ORM ke saath
- ✅ Complete **REST API**

---

## 🛠️ Step-by-Step Setup

### STEP 1: Prerequisites Install Karo

```bash
# Node.js 18+ chahiye
node --version

# Shopify CLI install karo
npm install -g @shopify/cli @shopify/theme

# Verify karo
shopify version
```

---

### STEP 2: Shopify Partners Account Banao

1. **https://partners.shopify.com** par jao
2. Account banao (free hai)
3. **Apps → Create App → Create app manually** click karo
4. App naam rakho: `My Wishlist App`
5. **API Key** aur **API Secret** copy karo (baad mein chahiye)

---

### STEP 3: Development Store Banao

Partners dashboard mein:
1. **Stores → Add Store → Development Store** click karo
2. Store naam rakho aur banao
3. Yeh tumhara test store hoga

---

### STEP 4: ZIP Extract Karo aur Setup Karo

```bash
# ZIP extract karo
unzip shopify-wishlist-app.zip
cd shopify-wishlist-app

# .env file banao
cp .env.example .env
```

**.env file edit karo** (koi bhi text editor mein):
```
SHOPIFY_API_KEY=your_actual_api_key     ← Partners dashboard se copy karo
SHOPIFY_API_SECRET=your_actual_secret   ← Partners dashboard se copy karo
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
```

---

### STEP 5: Dependencies Install Karo

```bash
# Root level
npm install

# Web backend
cd web
npm install

# Frontend
cd frontend
npm install
cd ..

cd ..  # root par wapas ao
```

---

### STEP 6: Database Setup

```bash
cd web

# Prisma database generate karo
npx prisma generate
npx prisma db push

cd ..
```

---

### STEP 7: App ko Shopify se Connect Karo

```bash
# Shopify CLI se login karo
shopify auth login

# Browser khulega → apne Partners account se login karo
```

---

### STEP 8: App Run Karo! 🚀

```bash
# Root folder mein ye command chalao
shopify app dev
```

Ye command:
- Automatically ngrok tunnel banata hai
- App URL generate karta hai  
- Browser mein app kholta hai
- Development store se connect karta hai

**Console mein ye dikhega:**
```
✅ App running at: https://xxxxx.ngrok.io
📱 Open in Shopify: https://your-store.myshopify.com/admin/apps/...
```

---

### STEP 9: Theme Extension Add Karo

Development server chalne ke baad:

1. Shopify Admin → **Online Store → Themes** jao
2. **Customize** click karo
3. Kisi bhi **Product Page** par jao
4. **Add Section/Block** click karo
5. **Apps** section mein **"Wishlist Button"** dhundo
6. Add karo aur **Save** karo

---

### STEP 10: Wishlist Page Banao

1. Shopify Admin → **Online Store → Pages** jao
2. **Add Page** click karo
3. Title: `Wishlist`
4. Handle/URL: `wishlist` (automatic hoga)
5. **Save** karo
6. Theme Customize mein → Pages → Wishlist page par jao
7. **Wishlist Page** block add karo

---

## 🔑 Login/Signup Kaise Kaam Karta Hai?

```
Guest User → Heart Button Click karo
    ↓
Login/Signup Modal khulega (beautiful popup)
    ↓
"Log In" → Shopify native account login page
"Sign Up Free" → Shopify account registration page
    ↓
Login ke baad → automatically wishlist mein save ho jata hai
```

**Customer ko Account banana ZARURI hai** kyunki wishlist
unke Shopify customer ID se tied hoti hai.

---

## 📊 Admin Dashboard Access

App install hone ke baad:
- Shopify Admin → **Apps → Your Wishlist App**
- Dashboard mein **saare customers ki wishlists** dikhti hain
- Customer ID click karke uski poori wishlist dekho

---

## 🎨 Customization

### Button Color Badlo:
`extensions/wishlist-button/blocks/wishlist-button.liquid` mein:
```css
/* Is line ko dhundo aur color badlo */
.wishlist-btn.active { background: #fce4ec; border-color: #e91e63; }
```

### Button Text Badlo:
Theme Customizer mein → Wishlist Button settings mein "Button Text" field hai.

---

## 🚀 Production Deployment

```bash
# App deploy karo
shopify app deploy

# Extensions deploy karo
shopify app deploy --include-config-on-deploy
```

Phir koi bhi hosting use karo:
- **Railway.app** (easiest, free tier available)
- **Render.com** (free tier)
- **Heroku**
- **DigitalOcean**

---

## ❗ Common Issues

| Problem | Solution |
|---------|----------|
| `shopify: command not found` | `npm install -g @shopify/cli` |
| Database error | `cd web && npx prisma db push` |
| App not loading | `.env` mein API key check karo |
| Button nahi dikh raha | Theme mein extension add ki? |
| Login redirect nahi ho raha | Store URL `.env` mein set karo |

---

## 📁 Files Structure

```
shopify-wishlist-app/
├── shopify.app.toml          ← App config
├── .env.example              ← Environment variables template
├── web/
│   ├── index.js              ← Express server (main backend)
│   ├── shopify.js            ← Shopify auth config
│   ├── routes/
│   │   ├── wishlist.js       ← Wishlist API (add/remove/get)
│   │   └── auth.js           ← Login/signup URLs
│   ├── prisma/
│   │   └── schema.prisma     ← Database schema
│   └── frontend/
│       └── src/
│           ├── App.jsx       ← Main React app
│           └── pages/
│               ├── Dashboard.jsx      ← Admin dashboard
│               └── WishlistDetails.jsx ← Customer wishlist view
└── extensions/
    └── wishlist-button/
        └── blocks/
            ├── wishlist-button.liquid  ← Heart button (product page)
            └── wishlist-page.liquid    ← Customer wishlist page
```

---

## 💡 Extra Features Add Karna Chahte Ho?

- **Email notifications** - jab wishlist item sale par ho
- **Share wishlist** - social sharing
- **Multiple wishlists** - "Birthday", "Anniversary" etc.
- **Stock alerts** - out-of-stock items wapas stock mein aayein to notify

In sab ke liye bas batao! 😊

---

*Made with ❤️ | Shopify Wishlist App v1.0*
