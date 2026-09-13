# Deploy — 4 kişi internetten oynasın

Backend ve frontend ayrı yerlere çıkar. Sebebi: oyun **socket.io** kullanıyor, yani
sürekli açık bir WebSocket bağlantısı gerekiyor. Vercel'in sunucusuz yapısı bunu
kaldırmaz — bu yüzden **backend Render'a**, **frontend Vercel'e** gider.

İkisi de ücretsiz.

---

## 0. Kodu GitHub'a koy

```bash
git init
git add .
git commit -m "Istanbul Monopoly Deal"
git branch -M main
git remote add origin https://github.com/<kullanıcı>/<repo>.git
git push -u origin main
```

---

## 1. Backend → Render

1. [render.com](https://render.com) → GitHub ile giriş yap
2. **New → Web Service** → repoyu seç
3. Ayarlar:

   | Alan | Değer |
   |------|-------|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install && npm run build` |
   | Start Command | `npm start` |
   | Instance Type | Free |
   | Region | Frankfurt (Türkiye'ye en yakın) |

4. **Environment** sekmesine değişkenleri gir:

   ```
   FRONTEND_URL   = http://localhost:3000     ← şimdilik, 3. adımda güncelleyeceğiz
   PLAYER1_NAME   = yasin
   PLAYER2_NAME   = yunus
   PLAYER3_NAME   = serkan
   PLAYER4_NAME   = zorbey
   NODE_VERSION   = 20
   ```

   > `PORT` **tanımlama** — Render kendisi veriyor.

5. Deploy bitince adresi not al: `https://istanbul-deal-backend.onrender.com`
6. Kontrol: tarayıcıda `<adres>/health` → `{"ok":true}` görmelisin

---

## 2. Frontend → Vercel

1. [vercel.com](https://vercel.com) → GitHub ile giriş yap
2. **Add New → Project** → repoyu seç
3. **Root Directory: `frontend`** (bunu seçmezsen build patlar)
4. Environment Variables:

   ```
   NEXT_PUBLIC_WS_URL = https://istanbul-deal-backend.onrender.com
   ```

5. Deploy → adresi not al: `https://istanbul-deal.vercel.app`

---

## 3. Backend'e frontend adresini söyle

Render → Environment → `FRONTEND_URL` değerini Vercel adresinle değiştir:

```
FRONTEND_URL = https://istanbul-deal.vercel.app
```

Kaydet, Render otomatik yeniden başlatır. **Bu adım olmadan CORS engeller, oyun bağlanmaz.**

Birden fazla adres gerekiyorsa virgülle yaz:

```
FRONTEND_URL = https://istanbul-deal.vercel.app,https://istanbul-deal-git-main-xxx.vercel.app
```

---

## 4. Oyna

Vercel adresini 4 kişiye at. Herkes kendi adını seçip katılır, biri "Oyunu Başlat"a basar.

---

## Bilmen gerekenler

**İlk açılış yavaş.** Render ücretsiz plan 15 dakika kullanılmazsa uyur. İlk giren
30–50 saniye bekler, sonrası normal. Oyun sürerken trafik olduğu için uyumaz.

**Oyun durumu bellekte.** Sunucu yeniden başlarsa (deploy, uyku, çökme) devam eden
oyun sıfırlanır ve lobiye döner. 4 arkadaş için sorun değil ama bilmekte fayda var.
Kalıcı olması gerekirse Redis eklenmeli.

**Bağlantı kopması sorun değil.** İsim tarayıcıda saklanıyor; sayfa yenilense veya
internet kopsa da aynı isimle otomatik geri dönersin, oyun kaldığı yerden devam eder.

**Telefondan da oynanır** — arayüz mobil uyumlu.

---

## Alternatif: uyumayan sunucu

Render'ın uyumasını istemiyorsan:

- **Railway** — ayda ~5$ kredi hediye, uyumaz. Aynı ayarlar (root `backend`,
  build `npm install && npm run build`, start `npm start`).
- **Fly.io** — ücretsiz kotası var, biraz daha teknik (`fly launch`).

---

## Yerelde çalıştırma

```bash
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

Backend `:3001`, frontend `:3000`.
