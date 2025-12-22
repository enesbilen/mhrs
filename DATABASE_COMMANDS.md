# Database Commands

Laravel tarzı veritabanı yönetim komutları.

## 📋 Komut Listesi

### Temel Komutlar

#### `npm run db:migrate`
Migration'ları çalıştırır (tablolar oluşturulur).
- ✅ Daha önce çalıştırılmış migration'lar atlanır
- ✅ Veritabanı yoksa otomatik oluşturulur
- ✅ Sadece yeni migration'lar çalıştırılır

```bash
npm run db:migrate
```

#### `npm run db:seed`
Seed dosyalarını çalıştırır (örnek veriler eklenir).
- ⚠️ Kategoriler ve tanılar için UNIQUE constraint sayesinde duplicate oluşmaz
- ⚠️ Sorular için DELETE + INSERT yapılır

```bash
npm run db:seed
```

#### `npm run db:setup`
Migration + Seed komutlarını sırayla çalıştırır.
- İlk kurulum için idealdir

```bash
npm run db:setup
```

---

### Reset Komutları

#### `npm run db:reset`
**Veritabanını tamamen siler** (DROP DATABASE).
- ⚠️ **DİKKAT:** Tüm veriler silinir!
- Sadece veritabanını siler, migration çalıştırmaz

```bash
npm run db:reset
```

#### `npm run db:fresh`
**Veritabanını sıfırdan oluşturur** (DROP + CREATE + MIGRATE).
- Veritabanını siler
- Yeniden oluşturur
- Tüm migration'ları çalıştırır
- ⚠️ Seed **çalıştırmaz** (sadece yapı oluşur, veri eklenmez)

```bash
npm run db:fresh
```

#### `npm run db:migrate:reset`
`db:reset` + `db:migrate` kombinasyonu.
- Veritabanını siler
- Migration'ları yeniden çalıştırır

```bash
npm run db:migrate:reset
```

---

### Seed Komutları

#### `npm run db:seed:fresh`
**Tabloları temizler ve seed'leri yeniden çalıştırır**.
- Tabloları DROP etmez (yapı korunur)
- Sadece verileri temizler (DELETE FROM)
- AUTO_INCREMENT değerlerini sıfırlar
- Seed'leri yeniden çalıştırır
- ✅ Hızlı veri sıfırlama için idealdir

```bash
npm run db:seed:fresh
```

#### `npm run db:seed:reset`
`db:seed:fresh` ile aynı işlevi görür.

```bash
npm run db:seed:reset
```

---

### Kombo Komutlar

#### `npm run db:wipe`
**HERŞEYİ SIFIRLAR** (FRESH + SEED).
- Veritabanını siler
- Yeniden oluşturur
- Migration'ları çalıştırır
- Seed'leri çalıştırır
- ✅ Temiz başlangıç için idealdir

```bash
npm run db:wipe
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: İlk Kurulum
```bash
npm run db:setup
# veya
npm run db:wipe
```

### Senaryo 2: Migration'a Yeni Tablo Eklendi
```bash
npm run db:migrate
```

### Senaryo 3: Verileri Sıfırlamak İstiyorum (Tabloları Koruyarak)
```bash
npm run db:seed:fresh
```

### Senaryo 4: Tamamen Temiz Başlangıç
```bash
npm run db:wipe
```

### Senaryo 5: Sadece Migration'ları Yeniden Çalıştırmak
```bash
npm run db:fresh
```

### Senaryo 6: Veritabanı Bozuldu, Her Şeyi Sıfırla
```bash
npm run db:wipe
```

---

## ⚠️ Uyarılar

### PRODUCTION'da DİKKAT!
- ❌ `db:reset`, `db:fresh`, `db:wipe` komutlarını **ASLA** production'da kullanmayın!
- ❌ Bu komutlar tüm verileri siler!
- ✅ Sadece development ortamında kullanın

### Güvenli Komutlar (Production'da)
- ✅ `npm run db:migrate` - Sadece yeni migration'ları çalıştırır
- ✅ `npm run db:seed` - Sadece seed'leri ekler (UNIQUE constraint sayesinde güvenli)

---

## 📊 Komut Karşılaştırması

| Komut | Veritabanı Sil | Tablolar Oluştur | Veriler Ekle | Hız | Kullanım |
|-------|----------------|------------------|--------------|-----|----------|
| `db:migrate` | ❌ | ✅ Yeni | ❌ | ⚡⚡⚡ | Günlük |
| `db:seed` | ❌ | ❌ | ✅ | ⚡⚡⚡ | Günlük |
| `db:setup` | ❌ | ✅ Yeni | ✅ | ⚡⚡ | İlk kurulum |
| `db:reset` | ✅ | ❌ | ❌ | ⚡⚡⚡ | Nadiren |
| `db:fresh` | ✅ | ✅ Tümü | ❌ | ⚡⚡ | Nadiren |
| `db:seed:fresh` | ❌ | ❌ | ✅ Temiz | ⚡⚡⚡ | Sık |
| `db:wipe` | ✅ | ✅ Tümü | ✅ | ⚡ | Sık |

---

## 🔧 Teknik Detaylar

### Migration Sistemi
- Migration'lar `migrations/` klasöründe `.sql` dosyaları olarak saklanır
- Çalıştırılan migration'lar `migrations` tablosunda kaydedilir
- Aynı migration iki kez çalıştırılmaz

### Seed Sistemi
- Seed'ler `seeders/` klasöründe `.sql` dosyaları olarak saklanır
- Kategoriler ve tanılar için `UNIQUE` constraint sayesinde duplicate önlenir
- Sorular için `DELETE FROM` yapılır (duplicate önleme)

### Veritabanı Ayarları
`.env.local` dosyasında:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=mhrs
```

---

## 📝 Test Kullanıcıları

Seed'ler çalıştırıldıktan sonra:

```
Admin:
- Kullanıcı: admin
- Şifre: admin123

Kullanıcı:
- Kullanıcı: kullanici
- Şifre: user123
```

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Projeyi klonla
git clone ...

# 2. Bağımlılıkları yükle
npm install

# 3. .env.local dosyasını oluştur
cp .env.example .env.local

# 4. Veritabanını kur
npm run db:wipe

# 5. Geliştirme sunucusunu başlat
npm run dev
```

---

Made with ❤️ for MHRS - Çocuk Hasta Takip Sistemi
