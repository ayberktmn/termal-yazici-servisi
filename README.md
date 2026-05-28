# Termal Yazıcı Servisi

## Proje Açıklaması

Bu proje, USB veya LAN bağlantılı termal yazıcılarla haberleşmek için geliştirilmiş mock/simülasyon tabanlı bir Node.js servisidir.

Servis:

* Yazıcı bağlantısı kurabilir
* Metin yazdırabilir
* QR yazdırabilir
* Görsel yazdırabilir
* Log tutabilir
* CSV log export alabilir
* Reprint işlemi yapabilir
* Basit token doğrulaması içerir

---

# Kullanılan Teknolojiler

* Node.js
* Express.js
* Nodemon
* UUID
* HTML/CSS/JavaScript

---

# Kurulum

## Gereksinimler

* Node.js v20+
* npm

## Paket Kurulumu

```bash
npm install
```

---

# Çalıştırma

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

Server:

```txt
http://localhost:3000
```

---

# API Endpointleri

## Yazıcı Bağlantısı

POST `/api/connect`

```json
{
  "mode": "usb"
}
```

---

## Durum

GET `/api/status`

---

## Metin Yazdırma

POST `/api/print/text`

```json
{
  "text": "Merhaba Dünya"
}
```

---

## QR Yazdırma

POST `/api/print/qr`

```json
{
  "data": "https://qrtagnow.com"
}
```

---

## Görsel Yazdırma

POST `/api/print/image`

```json
{
  "imageUrl": "https://via.placeholder.com/150"
}
```

---

## Loglar

GET `/api/logs`

---

## CSV Export

GET `/api/logs/export`

---

## Reprint

POST `/api/reprint/:jobId`

---

# Yetkilendirme

API isteklerinde aşağıdaki header kullanılmalıdır:

```txt
x-api-token: 123456
```

---

# UI

Tarayıcı üzerinden kullanılabilir arayüz:

```txt
http://localhost:3000
```

---

# Bonus Özellikler

* CSV log export
* Token authentication
* Health endpoint
* Reprint endpoint
* Mock printer simulation
* Docker desteği

---

# Docker

## Build

```bash
docker build -t thermal-printer-service .
```

## Run

```bash
docker run -p 3000:3000 thermal-printer-service
```

---

# Mimari

* `routes/` → API endpointleri
* `printer/` → Mock yazıcı işlemleri
* `logs/` → Log sistemi
* `public/` → Web arayüzü

---

# Not

Gerçek cihaz yerine mock/simülasyon sistemi kullanılmıştır.
