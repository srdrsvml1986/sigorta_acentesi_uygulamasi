# REST API Destekli Sigorta Acentesi Yazılımı

Bu proje, sigorta acentelerinin müşteri ilişkilerini, poliçe yönetimini, hasar ve komisyon takibini yapabilmesi için geliştirilmiş modüler bir REST API sunmaktadır.

## Özellikler

- **Kullanıcı ve Rol Yönetimi:** JWT tabanlı kimlik doğrulama ve rol bazlı erişim kontrolü
- **Müşteri Yönetimi:** Müşteri kayıt, güncelleme, listeleme ve silme işlemleri
- **Poliçe Yönetimi:** Poliçe oluşturma, güncelleme, iptal ve listeleme
- **Hasar ve Talep Yönetimi:** Hasar bildirimleri oluşturma, durumları güncelleme ve takip
- **Komisyon ve Finans Yönetimi:** Komisyon hesaplama, ödeme takibi ve finansal işlemler
- **Doküman ve Dosya Yönetimi:** Poliçe, hasar ve diğer belgelerin dijital ortamda saklanması
- **Bildirim ve İletişim Sistemi:** E-posta, SMS veya uygulama içi bildirimler
- **Raporlama ve Analitik:** İş süreçlerine ilişkin detaylı raporlar ve istatistikler

## Teknolojik Altyapı

- **Backend:** Node.js, Express.js
- **Veritabanı:** SQLite3 (Geliştirme ortamı için, production'da PostgreSQL veya MySQL önerilir)
- **Kimlik Doğrulama:** JWT (JSON Web Tokens)
- **API Dokümantasyonu:** Swagger/OpenAPI
- **Dosya Yükleme:** Multer

## Kurulum

### Gereksinimler

- Node.js (v14 veya üstü)
- npm (v6 veya üstü)

### Adımlar

1. Repo'yu klonlayın:
```bash
git clone [repo-url]
cd sigorta-acentesi-api
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

Uygulama varsayılan olarak 3000 portunda çalışacaktır. Tarayıcınızda `http://localhost:3000` adresine giderek ana sayfaya erişebilirsiniz.

## API Dokümantasyonu

API dokümantasyonuna `http://localhost:3000/api-docs` adresinden erişebilirsiniz. Swagger UI arayüzü, tüm endpoint'leri ve örnek istekleri görüntülemenizi sağlar.

## Kullanım

### Kimlik Doğrulama

API'yi kullanabilmek için önce bir kullanıcı kaydı yapmalı ve giriş yaparak JWT token almalısınız:

```bash
# Kullanıcı kaydı
curl -X POST http://localhost:3000/api/v1/users/register -H "Content-Type: application/json" -d '{
  "username": "kullanici",
  "password": "sifre123",
  "role": "agent"
}'

# Giriş yapma ve token alma
curl -X POST http://localhost:3000/api/v1/users/login -H "Content-Type: application/json" -d '{
  "username": "kullanici",
  "password": "sifre123"
}'
```

Başarılı giriş sonrası alınan token, diğer API çağrılarında kullanılmalıdır:

```bash
# Token ile müşteri listesini alma
curl -X GET http://localhost:3000/api/v1/customers -H "Authorization: Bearer {TOKEN}"
```

### Örnek API Çağrıları

#### Müşteri Oluşturma

```bash
curl -X POST http://localhost:3000/api/v1/customers -H "Authorization: Bearer {TOKEN}" -H "Content-Type: application/json" -d '{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "phone": "5551234567",
  "address": "Örnek Mah. Test Sok. No:1",
  "city": "İstanbul",
  "postalCode": "34000",
  "birthDate": "1980-01-01",
  "identityNumber": "12345678901"
}'
```

#### Poliçe Oluşturma

```bash
curl -X POST http://localhost:3000/api/v1/policies -H "Authorization: Bearer {TOKEN}" -H "Content-Type: application/json" -d '{
  "customerId": 1,
  "policyNumber": "POL-2023-001",
  "insuranceType": "Kasko",
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "premium": 5000,
  "status": "active"
}'
```

## Kod Yapısı

- `index.js` - Ana uygulama girişi
- `db.js` - Veritabanı bağlantısı ve şema tanımları
- `middleware/` - Kimlik doğrulama ve yetkilendirme middleware'leri
- `routes/` - API rotaları
  - `userRoutes.js` - Kullanıcı yönetimi endpoint'leri
  - `customerRoutes.js` - Müşteri yönetimi endpoint'leri
  - `policyRoutes.js` - Poliçe yönetimi endpoint'leri
  - `claimRoutes.js` - Hasar yönetimi endpoint'leri
  - `commissionRoutes.js` - Komisyon yönetimi endpoint'leri
  - `documentRoutes.js` - Doküman yönetimi endpoint'leri
  - `notificationRoutes.js` - Bildirim yönetimi endpoint'leri
  - `reportRoutes.js` - Raporlama endpoint'leri
- `uploads/` - Yüklenen dosyaların saklandığı dizin
- `swagger.yaml` - API dokümantasyonu

## Güvenlik Önlemleri

- JWT tabanlı kimlik doğrulama
- Rol bazlı erişim kontrolü
- Şifrelerin bcrypt ile hash'lenmesi
- Yetkilendirme kontrolleri
- Dosya tipi ve boyut validasyonu
- SQL injection koruması (parametreli sorgular)

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için lisans dosyasına bakınız.

---

## Production Ortamına Geçiş İçin Öneriler

- SQLite yerine PostgreSQL veya MySQL gibi üretim ortamı için uygun bir veritabanı kullanın
- `JWT_SECRET` anahtarını güvenli bir şekilde saklayın ve ortam değişkeni olarak ayarlayın
- Rate limiting ekleyin
- HTTPS kullanın
- PM2 gibi bir process manager ile uygulamayı çalıştırın
- Loglama mekanizması ekleyin
- Yük testi yapın 