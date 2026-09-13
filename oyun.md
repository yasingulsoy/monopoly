# İstanbul Monopoly Deal — Oyun Kılavuzu

İstanbul'un ilçeleri, ulaşım hatları ve kamu hizmetleriyle temalandırılmış kart oyunu.  
Temel mekanik **Monopoly Deal** kurallarına dayanır; kazanmak için **3 farklı renkte tam mülk seti** toplarsın.

| Bilgi | Değer |
|-------|-------|
| Oyuncu sayısı | 2–5 |
| Süre | ~15 dakika |
| Deste | 110 kart |
| Para birimi | Milyon (M) |

---

## İçindekiler

1. [Amaç](#amaç)
2. [Kurulum](#kurulum)
3. [Tur Akışı](#tur-akışı)
4. [Oyun Alanı](#oyun-alanı)
5. [Mülk Kartları — İstanbul İlçeleri](#mülk-kartları--istanbul-ilçeleri)
6. [Kira Tablosu](#kira-tablosu)
7. [Mülk Joker Kartları](#mülk-joker-kartları)
8. [Kira Kartları](#kira-kartları)
9. [Aksiyon Kartları](#aksiyon-kartları)
10. [Para Kartları](#para-kartları)
11. [Ödeme Kuralları](#ödeme-kuralları)
12. [Kazanma ve Özel Durumlar](#kazanma-ve-özel-durumlar)
13. [Geliştirme Referansı](#geliştirme-referansı)

---

## Amaç

**3 farklı renkte tam ilçe seti** toplayan ilk oyuncu kazanır.

- Tam set = o renkteki **tüm** mülk kartları (2, 3 veya 4 adet)
- Bankadaki para kazanma koşulu değildir
- Aynı renkten bilinçli olarak iki ayrı set oluşturabilirsin (Haciz kartına karşı koruma)

---

## Kurulum

1. 4 kural kartını desteden çıkar
2. Kalan **106 kartı** karıştır
3. Her oyuncuya **5 kart** dağıt (gizli — el)
4. Geri kalan kartlar **çekme yığını** olur
5. İlk oyuncuyu belirle; sıra saat yönünde devam eder

---

## Tur Akışı

### 1. Kart çek

| Durum | Çekilen kart |
|-------|--------------|
| Normal | 2 kart |
| Elde 0 kart | 5 kart |

### 2. Oyna (en fazla 3 kart)

Her kart üç yoldan biriyle oynanır:

| Kod | Ad | Açıklama |
|-----|-----|----------|
| **A** | Banka | Para veya aksiyon kartını bankaya koy |
| **B** | Mülk | İlçe / ulaşım / hizmet kartını önüne koy |
| **C** | Aksiyon | Ortaya at, talimatı uygula |

**Tur limitine sayılmayanlar:**
- Reddet kartı (sana karşı oynanan aksiyonu iptal eder)
- Mülk jokerlerini setler arası taşımak
- Mülkleri setler arası yeniden düzenlemek (sadece kendi turunda)

### 3. El limiti

Tur sonunda elde **7'den fazla** kart varsa fazlası **destenin altına** atılır.  
Önündeki banka ve mülk kartları sayılmaz.

---

## Oyun Alanı

```
┌──────────────────────────────────────────────┐
│  OYUNCU ALANI                                │
│  ┌──────────┐  ┌───────────────────────────┐ │
│  │  BANKA   │  │  MÜLK KOLEKSİYONU         │ │
│  │  (para + │  │  [Kahverengi set]         │ │
│  │  banka   │  │  [Açık mavi set]          │ │
│  │  aksiyon)│  │  [Ev / Otel set üstünde]  │ │
│  └──────────┘  └───────────────────────────┘ │
│  EL (gizli, en fazla 7 kart)                 │
└──────────────────────────────────────────────┘

ORTAK ALAN: Çekme yığını · Kullanılan aksiyonlar
```

---

## Mülk Kartları — İstanbul İlçeleri

Toplam **28 mülk kartı**, **10 renk grubu**.  
Her kartın üstündeki renk şeridi set rengini gösterir.

**Banka değeri** renk grubuna sabittir, karta göre değişmez — kartın sol üst köşesindeki rozette yazar ve ödeme yaparken o değer sayılır.

### Kahverengi (2 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Kasımpaşa | 2 | 1M | 2M |
| Dolapdere | 2 | 1M | 2M |

### Açık Mavi (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Sultanahmet | 3 | 1M | 3M |
| Karaköy | 3 | 1M | 3M |
| Sirkeci | 3 | 1M | 3M |

### Pembe (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Beyoğlu | 3 | 2M | 4M |
| Beşiktaş | 3 | 2M | 4M |
| Taksim | 3 | 2M | 4M |

### Turuncu (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Harbiye | 3 | 2M | 5M |
| Şişli | 3 | 2M | 5M |
| Mecidiyeköy | 3 | 2M | 5M |

### Kırmızı (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Bostancı | 3 | 3M | 6M |
| Erenköy | 3 | 3M | 6M |
| Caddebostan | 3 | 3M | 6M |

### Sarı (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Nişantaşı | 3 | 3M | 6M |
| Teşvikiye | 3 | 3M | 6M |
| Maçka | 3 | 3M | 6M |

### Yeşil (3 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Bakırköy | 3 | 4M | 7M |
| Yeşilköy | 3 | 4M | 7M |
| Levent | 3 | 4M | 7M |

### Koyu Mavi (2 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Tarabya | 2 | 4M | 8M |
| Yeniköy | 2 | 4M | 8M |

### Siyah — İstasyonlar (4 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Haydarpaşa Garı | 4 | 2M | 4M |
| Sirkeci Garı | 4 | 2M | 4M |
| Alsancak Garı | 4 | 2M | 4M |
| Basmane Garı | 4 | 2M | 4M |

### Kamu Kuruluşları (2 kart)

| Kart | Set boyutu | Banka değeri | Tam set kirası |
|------|------------|--------------|----------------|
| Elektrik İdaresi | 2 | 2M | 2M |
| Sular İdaresi | 2 | 2M | 2M |

---

## Kira Tablosu

Kira, **o renkte kaç kartın varsa** ona göre hesaplanır. Kira kartı oynandığında bu değer tahsil edilir.

| Renk | 1 kart | 2 kart | 3 kart | 4 kart |
|------|--------|--------|--------|--------|
| Kahverengi | 1M | **2M** ✓ | — | — |
| Açık Mavi | 1M | 2M | **3M** ✓ | — |
| Pembe | 1M | 2M | **4M** ✓ | — |
| Turuncu | 1M | 3M | **5M** ✓ | — |
| Kırmızı | 2M | 3M | **6M** ✓ | — |
| Sarı | 2M | 4M | **6M** ✓ | — |
| Yeşil | 2M | 4M | **7M** ✓ | — |
| Koyu Mavi | 3M | **8M** ✓ | — | — |
| İstasyon (Siyah) | 1M | 2M | 3M | **4M** ✓ |
| Kamu Kuruluşları | 1M | **2M** ✓ | — | — |

✓ = tam set

### Ev ve Otel bonusu

Sadece **tam ilçe setlerine** eklenir. İstasyon ve Kamu Kuruluşları setlerine konamaz.

| Kart | Banka değeri | Kira bonusu | Koşul |
|------|--------------|-------------|-------|
| Ev | 3M | +3M | Tam set gerekli |
| Otel | 4M | +4M | Evden sonra, tam set |

**Örnek:** Yeşil tam set (Bakırköy + Yeşilköy + Levent) = 7M  
Ev (+3M) + Otel (+4M) → toplam kira = **14M**

---

## Mülk Joker Kartları

Toplam **11 joker**. İki renkli veya çok renkli olabilir.

| Joker | Adet | Kullanım |
|-------|------|----------|
| Kahverengi / Açık Mavi | 1 | İki renkten biri |
| Pembe / Turuncu | 2 | İki renkten biri |
| Kırmızı / Sarı | 2 | İki renkten biri |
| Koyu Mavi / Yeşil | 1 | İki renkten biri |
| İstasyon / Kamu Kuruluşu | 1 | İki renkten biri |
| İstasyon / Açık Mavi | 1 | İki renkten biri |
| İstasyon / Yeşil | 1 | İki renkten biri |
| **Çok Renkli Joker** | 2 | Herhangi bir renk (banka değeri yok) |

**Kurallar:**
- Set **yalnızca jokerle tamamlanamaz** — en az 1 gerçek ilçe kartı gerekir
- Çok renkli jokerlerin para değeri yoktur; ödeme yapılamaz
- Jokerleri kendi turunda setler arası taşıyabilirsin (tur harcamaz)
- Tapu Devri ve Değiş Tokuş ile tam setten kart alınamaz; tam set yalnızca Haciz ile alınır

---

## Kira Kartları

Toplam **13 kira kartı**.

### İki renkli kira (10 adet)

| Renk çifti | Adet | Etki | Banka |
|------------|------|------|-------|
| Kahverengi / Açık Mavi | 2 | **Tüm rakipler** seçilen renk için öder | 1M |
| Pembe / Turuncu | 2 | **Tüm rakipler** öder | 1M |
| Kırmızı / Sarı | 2 | **Tüm rakipler** öder | 1M |
| Koyu Mavi / Yeşil | 2 | **Tüm rakipler** öder | 1M |
| İstasyon / Kamu Kuruluşları | 2 | **Tüm rakipler** öder | 1M |

**Akış:** Kartı oyna → iki renkten birini seç → o renkte mülkün varsa her rakip kirasını öder.

### Joker Kira (3 adet)

| Etki | Banka |
|------|-------|
| **Tek bir rakibi** seç; **herhangi bir** mülk setinden kira al | 3M |

### Kirayı Katla (2 adet)

Normal kira kartından hemen sonra oynanır; toplam kirayı **×2** yapar.  
1 tur hakkı harcar. Ev/Otel bonusu dahil tüm kira ikiye katlanır.

---

## Aksiyon Kartları

Toplam **34 aksiyon kartı** (kira kartları ve ev/otel dahil).

| Kart (Türkçe) | Orijinal ad | Adet | Etki | Banka |
|---------------|-------------|------|------|-------|
| **Geçiş Ücreti** (2 Kart Çek) | Pass Go | 10 | Desteden 2 kart çek | 1M |
| **Tapu Devri** | Sly Deal | 3 | Rakipten 1 mülk al (tam setten değil) | 3M |
| **Değiş Tokuş** | Forced Deal | 3 | Kendi mülkünle rakibin mülkünü takas et (tam setten değil) | 3M |
| **Haciz** | Deal Breaker | 2 | Rakipten **tam seti** al (Ev/Otel dahil) | 5M |
| **Borç Tahsildarı** | Debt Collector | 3 | 1 rakip sana **5M** öder | 3M |
| **Doğum Günüm** | It's My Birthday | 3 | Herkes sana **2M** öder | 2M |
| **Reddet** | Just Say No | 3 | Sana karşı oynanan hamleyi iptal et | 4M |
| **Kirayı Katla** | Double the Rent | 2 | Kira kartıyla birlikte; kirayı ×2 yap | 1M |
| **Ev** | House | 3 | Tam sete +3M kira | 3M |
| **Otel** | Hotel | 2 | Ev olan tam sete +4M kira | 4M |

Her aksiyon kartı istenirse **para olarak bankaya** konabilir (köşesindeki değer kadar). Bankaya konan kart bir daha aksiyon olarak oynanamaz.

### Reddet zinciri

```
Oyuncu A: Haciz
Oyuncu B: Reddet       → iptal
Oyuncu A: Reddet       → tekrar geçerli
Oyuncu B: Reddet       → tekrar iptal
...
```

- **Reddet** tur limitine sayılmaz; sırası olmayan oyuncu da oynayabilir
- Bekleyen bir hamle yokken Reddet oynanamaz (kart boşa gitmez); istenirse bankaya 4M olarak konur
- Doğum Günüm veya iki renkli kirada Reddet oynayan **sadece kendini** korur; diğer oyuncular ödemeye devam eder
- Kirayı Katla ile büyütülmüş bir kiraya Reddet oynanırsa kiranın **tamamı** (taban + x2) iptal olur; borçlu hiçbir şey ödemez

---

## Para Kartları

Toplam **20 kart**, **57M**.

| Değer | Adet |
|-------|------|
| 1M | 6 |
| 2M | 5 |
| 3M | 3 |
| 4M | 3 |
| 5M | 2 |
| 10M | 1 |

Her kartın sol üst köşesindeki koyu rozet (örn. M4) = banka değeri.

---

## Ödeme Kuralları

| Kural | Açıklama |
|-------|----------|
| Elden ödeme | **Yasak** — sadece masadaki kartlar |
| Geri ele alma | **Yasak** — kart masaya konunca kalır |
| Kim seçer | **Borçlu** neyle ödeyeceğine karar verir |
| Para üstü | **Yok** — 2M borç için 3M verirsen 1M geri alamazsın |
| Mülkle ödeme | Kart rakibin mülk koleksiyonuna gider |
| Ev/Otel ile ödeme | Rakibin uygun setine konur veya bankasına gider |
| Bankadaki aksiyon | Rakibin bankasına gider; aksiyon olarak kullanılamaz |
| Hiç kart yok | **Hiçbir şey ödemezsin** |
| Yetersiz ödeme | Elindekilerin tamamını verirsin |

---

## Kazanma ve Özel Durumlar

| Durum | Kural |
|-------|-------|
| Kazanma | 3. farklı renkte tam set tamamlandığı **an** oyun biter |
| Kira kartı ama mülk yok | Kart oynanabilir; etkisiz kalır |
| Haciz + Ev/Otel | Hepsi birlikte alınır |
| Değiş Tokuş / Tapu Devri + tam set kartı | **Alınamaz** — tam set yalnızca Haciz ile alınır |
| Çevrimdışı oyuncu | Ona Borç Tahsildarı / Joker Kira / çalma hamlesi yapılamaz; Doğum Günü ve genel kirada borcu atlanır; sırası gelince turu atlanır; aynı adla geri dönünce kaldığı yerden devam eder |
| Oyun bitince | "Yeni Oyun" ile aynı oyuncularla lobiye dönülür |
| Aynı turda 3× Geçiş Ücreti | 6 ekstra kart çekilir |
| 6+ oyuncu | 2 deste birleştirilir |

---

## Geliştirme Referansı

Kod tarafında kartları renk kimliği ile eşleştirmek için aşağıdaki tabloyu kullan.

### Renk → İlçe eşlemesi

```json
{
  "brown":       ["Kasımpaşa", "Dolapdere"],
  "light_blue":  ["Sultanahmet", "Karaköy", "Sirkeci"],
  "pink":        ["Beyoğlu", "Beşiktaş", "Taksim"],
  "orange":      ["Harbiye", "Şişli", "Mecidiyeköy"],
  "red":         ["Bostancı", "Erenköy", "Caddebostan"],
  "yellow":      ["Nişantaşı", "Teşvikiye", "Maçka"],
  "green":       ["Bakırköy", "Yeşilköy", "Levent"],
  "dark_blue":   ["Tarabya", "Yeniköy"],
  "railroad":    ["Haydarpaşa Garı", "Sirkeci Garı", "Alsancak Garı", "Basmane Garı"],
  "utility":     ["Elektrik İdaresi", "Sular İdaresi"]
}
```

### Set boyutu, banka değeri ve kira dizileri

```json
{
  "brown":       { "size": 2, "bankValue": 1, "rent": [1, 2] },
  "light_blue":  { "size": 3, "bankValue": 1, "rent": [1, 2, 3] },
  "pink":        { "size": 3, "bankValue": 2, "rent": [1, 2, 4] },
  "orange":      { "size": 3, "bankValue": 2, "rent": [1, 3, 5] },
  "red":         { "size": 3, "bankValue": 3, "rent": [2, 3, 6] },
  "yellow":      { "size": 3, "bankValue": 3, "rent": [2, 4, 6] },
  "green":       { "size": 3, "bankValue": 4, "rent": [2, 4, 7] },
  "dark_blue":   { "size": 2, "bankValue": 4, "rent": [3, 8] },
  "railroad":    { "size": 4, "bankValue": 2, "rent": [1, 2, 3, 4] },
  "utility":     { "size": 2, "bankValue": 2, "rent": [1, 2] }
}
```

### Deste envanteri

```json
{
  "property": {
    "brown": 2, "light_blue": 3, "pink": 3, "orange": 3,
    "red": 3, "yellow": 3, "green": 3, "dark_blue": 2,
    "railroad": 4, "utility": 2
  },
  "wildcards": {
    "light_blue/brown": 1,
    "light_blue/railroad": 1,
    "pink/orange": 2,
    "red/yellow": 2,
    "dark_blue/green": 1,
    "green/railroad": 1,
    "railroad/utility": 1,
    "multi": 2
  },
  "rent": {
    "brown/light_blue": 2,
    "pink/orange": 2,
    "red/yellow": 2,
    "dark_blue/green": 2,
    "railroad/utility": 2,
    "any": 3
  },
  "actions": {
    "pass_go": 10,
    "sly_deal": 3,
    "forced_deal": 3,
    "deal_breaker": 2,
    "debt_collector": 3,
    "birthday": 3,
    "just_say_no": 3,
    "double_rent": 2,
    "house": 3,
    "hotel": 2
  },
  "money": { "1": 6, "2": 5, "3": 3, "4": 3, "5": 2, "10": 1 }
}
```

### Kart kimliği örneği

```typescript
interface IstanbulPropertyCard {
  id: string;
  name: string;           // "Tarabya"
  color: PropertyColor;   // "green"
  displayName: string;    // UI'da gösterilecek Türkçe ad
  rentIndex: number;      // set içindeki sıra (0-based)
}

interface Card {
  id: string;
  type: CardType;
  bankValue: number;
  colors?: PropertyColor[];
  displayName: string;    // Türkçe kart adı
}
```

---

## Tema Notları

- **Kahverengi → Koyu Mavi** arası ilçeler, klasik Monopoly'deki düşük → yüksek değer sıralamasını takip eder
- **Siyah (ulaşım)** grubu demiryolu/istasyon kartlarının yerini alır; kira değerleri aynıdır
- **Kamu Kuruluşları** grubu su ve elektrik altyapısını temsil eder
- İlçe isimleri oyun dengesini bozmaz; sadece **görsel/tematik** katmandır — mekanik renk kimliği (`brown`, `green` vb.) backend'de sabit kalır

---

*Hasbro Monopoly Deal resmi kurallarına dayanır. İstanbul ilçe teması bu proje için özelleştirilmiştir.*
