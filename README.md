# Salus AI - Yapay Zeka Destekli Siber Güvenlik Platformu

[![Turkish](https://img.shields.io/badge/Dil-Türkçe-red.svg)](#tr) [![English](https://img.shields.io/badge/Language-English-blue.svg)](#en) [![React](https://img.shields.io/badge/Frontend-React%20%28Vite%29-blue.svg)](#) [![Node.js](https://img.shields.io/badge/Backend-Node.js%20%28Express%29-green.svg)](#) [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](#) [![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](#)

---

<a name="tr"></a>
## Türkçe

**Salus AI**, siber güvenlik operasyonlarını modernleştirmek ve yapay zeka ile tehdit analizi süreçlerini hızlandırmak amacıyla geliştirilmiş bir güvenlik platformudur. Google Gemini API entegrasyonu sayesinde ağ tarama, IP/alan adı analizi, güvenlik açığı tespiti ve sistem loglarının anlamlandırılmasını tek bir çatı altında sunar.

Geliştirici: **Eren Söğütlü**

---

### Temel Özellikler

- **AI Tehdit Analizi**: URL, IP ve alan adlarını analiz ederek risk skorları ve güvenlik bulguları üretir.
- **Log Analizi**: Sistem, erişim ve denetim loglarını analiz ederek olası saldırı kalıplarını ve anomalileri raporlar.
- **Ağ ve Port Tarayıcı**: Hedef sistemlerdeki açık portları, çalışan servisleri ve olası zafiyetleri tespit eder.
- **Siber Güvenlik Araçları**:
  - Şifre Dayanıklılık Testi ve Güvenli Şifre Üretici
  - Kriptografi ve Kodlama Araçları (MD5, SHA, Base64, Hex, URL)
  - IP İstihbaratı, Konum ve ISP Sorgulama
  - Subdomain (Alt Alan Adı) Keşfi
  - HTTP Güvenlik Başlıkları (Security Headers) Analizi
- **AI Güvenlik Asistanı**: Siber güvenlik soruları ve zafiyet giderme adımları için 7/24 interaktif sohbet modülü.
- **Sistem Güvenliği Katmanı**:
  - Devre Kesici (Circuit Breaker): Kritik rotalarda ardışık hataları önler.
  - İstek Sınırlama (Rate Limiting): Brute-force ve DoS girişimlerini sınırlar.
  - Girdi Temizleme (Sanitization): XSS ve SQL Injection filtreleri.
  - Güvenli Parola Saklama: BcryptJS (12 salt turu).
  - Denetim Günlükleri (Audit Logs): Kimlik doğrulama ve kritik aksiyonların takibi.
- **Yönetici Paneli**: Sistem kaynak kullanımı, servis durumları, denetim kayıtları ve kullanıcı yönetimi.

---

### Sistem Mimarisi

```mermaid
graph TD
    A[İstemci - React/Vite] -->|HTTPS| B[Sunucu - Node.js/Express]
    B --> C{Circuit Breaker & Rate Limit}
    C -->|Onaylandı| D[Güvenlik Filtreleri]
    D --> E[Yönlendiriciler]
    E --> F[(PostgreSQL)]
    E --> G[Gemini AI API]
    E --> H[Siber Güvenlik Motoru]
    E --> I[Redis / Önbellek]
```

---

### Teknolojiler

- **Frontend**: React, Vite, Vanilla CSS (Glassmorphism & Tema Sistemi), Lucide Icons, React Router, TanStack Query.
- **Backend**: Node.js, Express, Python, PostgreSQL, Knex.js, Helmet, Express Rate Limit, BcryptJS, JWT, BullMQ, Redis.

---

### Kurulum ve Çalıştırma

#### 1. Gereksinimler
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL veritabanı
- Google Gemini API Anahtarı

#### 2. Bağımlılıkların Yüklenmesi

İstemci:
```bash
cd istemci
npm install
```

Sunucu:
```bash
cd sunucu
npm install
```

#### 3. Çevre Değişkenleri (`sunucu/.env`)

```env
PORT=5000
VERITABANI_URL=postgresql://kullanici:sifre@host:5432/veritabani?sslmode=require
JWT_GIZLI_ANAHTAR=guvenli_jwt_anahtari
GEMINI_API_ANAHTARI=gemini_api_anahtariniz
REDIS_URL=redis://127.0.0.1:6379 # Opsiyonel
```

#### 4. Uygulamayı Başlatma

Sunucu:
```bash
cd sunucu
npm run dev
```

İstemci:
```bash
cd istemci
npm run dev
```

---

### Örnek Hesaplar

| Rol | E-Posta | Şifre | Yetki |
| :--- | :--- | :--- | :--- |
| **Yönetici** | `admin@salus.ai` | `Salus#AdminSecured*2026` | `admin` |
| **Kullanıcı** | `deneme@salus.ai` | `salus123` | `kullanici` |

---

<br/>

---

<a name="en"></a>
## English

**Salus AI** is a cybersecurity platform designed to streamline security operations and accelerate threat analysis workflows through AI integration. Powered by Google Gemini API, it unifies network scanning, IP/domain threat assessment, vulnerability discovery, and log analysis into a single platform.

Developer: **Eren Söğütlü**

---

### Key Features

- **AI Threat Analysis**: Evaluates URLs, IPs, and domains to produce dynamic threat scores and security findings.
- **Log Analysis**: Inspects system, server, and audit logs to identify anomalies, attack signatures, and mitigation steps.
- **Network and Port Scanner**: Detects open ports, running services, and potential vulnerabilities on target hosts.
- **Cybersecurity Tools**:
  - Password Strength Tester and Generator
  - Cryptography & Encoding Tools (MD5, SHA, Base64, Hex, URL)
  - IP Geolocation, ISP, and WHOIS Lookup
  - Subdomain Discovery
  - HTTP Security Header Analyzer
- **AI Security Assistant**: 24/7 interactive chat for cybersecurity questions and remediation advice.
- **Platform Hardening**:
  - Circuit Breaker: Mitigates cascading failures on sensitive routes.
  - Rate Limiting: Defends against brute-force and DoS attempts.
  - Input Sanitization: Filters against XSS and SQL Injection.
  - Password Security: BcryptJS hashing (12 salt rounds).
  - Audit Trail: Tracks authentication events and administrative actions.
- **Admin Dashboard**: Real-time server resource metrics, service statuses, audit logs, and user management.

---

### System Architecture

```mermaid
graph TD
    A[Client - React/Vite] -->|HTTPS| B[Server - Node.js/Express]
    B --> C{Circuit Breaker & Rate Limit}
    C -->|Allowed| D[Security Filters]
    D --> E[Routers]
    E --> F[(PostgreSQL)]
    E --> G[Gemini AI API]
    E --> H[Security Engine]
    E --> I[Redis / Cache]
```

---

### Tech Stack

- **Frontend**: React, Vite, Vanilla CSS, Lucide Icons, React Router, TanStack Query.
- **Backend**: Node.js, Express, Python, PostgreSQL, Knex.js, Helmet, Express Rate Limit, BcryptJS, JWT, BullMQ, Redis.

---

### Installation

#### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database
- Google Gemini API Key

#### 2. Install Dependencies

Frontend:
```bash
cd istemci
npm install
```

Backend:
```bash
cd sunucu
npm install
```

#### 3. Environment Configuration (`sunucu/.env`)

```env
PORT=5000
VERITABANI_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_GIZLI_ANAHTAR=your_secure_jwt_secret
GEMINI_API_ANAHTARI=your_gemini_api_key
REDIS_URL=redis://127.0.0.1:6379 # Optional
```

#### 4. Run the Project

Backend:
```bash
cd sunucu
npm run dev
```

Frontend:
```bash
cd istemci
npm run dev
```

---

### Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@salus.ai` | `Salus#AdminSecured*2026` | `admin` |
| **User** | `deneme@salus.ai` | `salus123` | `kullanici` |

---

Salus AI - 2026
