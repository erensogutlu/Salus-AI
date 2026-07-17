# 🛡️ Salus AI – Yapay Zeka Destekli Siber Güvenlik Platformu

[![Turkish](https://img.shields.io/badge/Language-Turkish-red.svg)](#tr) [![English](https://img.shields.io/badge/Language-English-blue.svg)](#en) [![React](https://img.shields.io/badge/Frontend-React%20%28Vite%29-blue.svg)](#) [![Node.js](https://img.shields.io/badge/Backend-Node.js%20%28Express%29-green.svg)](#) [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](#) [![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](#)

---

<a name="tr"></a>
## 🇹🇷 Türkçe Proje Tanımı

**Salus AI**, modern siber güvenlik operasyonlarını kolaylaştırmak ve yapay zeka entegrasyonu ile tehdit analizi süreçlerini hızlandırmak için geliştirilmiş kurumsal düzeyde bir siber güvenlik platformudur. Google Gemini API'sinin güçlü modelleri ile entegre olan bu sistem, ağ analizi, IP/Alan adı tehdit keşifleri, zayıflık taramaları ve siber güvenlik olay günlüklerinin (log) anlamlandırılması süreçlerini tek bir platformda birleştirir.

Platform, **Eren Söğütlü** tarafından tasarlanmış ve geliştirilmiştir.

---

### 🌟 Temel Özellikler

- **🤖 AI Destekli Tehdit Analizi**: Şüpheli URL, IP adresi ve alan adlarını Google Gemini altyapısıyla derinlemesine inceler ve dinamik tehdit skorlamaları üretir.
- **📄 Akıllı Log Analizi**: Syslog, web sunucu logları veya denetim (audit) loglarını girdi olarak kabul edip, yapay zeka ile anomalileri ve potansiyel saldırı paternlerini tespit eder; çözüm önerileri sunar.
- **🌐 Ağ Güvenliği ve Port Tarayıcı**: Belirtilen IP adresi veya hostname üzerindeki açık portları, servisleri ve olası zafiyetleri tespit eden entegre ağ tarayıcısı.
- **🛠️ Zengin Siber Güvenlik Araç Kutusu**:
  - **Şifre Güvenlik Testi & Jeneratörü**: Parola karmaşıklık analizi ve kriptografik olarak güvenli şifre üretimi.
  - **Kriptografik Dönüştürücü**: MD5, SHA-1, SHA-256 vb. hash algoritmaları ve Base64 kodlama/kod çözme işlemleri.
  - **IP & GeoIP Bilgi Sorgulama**: IP adreslerinin coğrafi konumunu, ISP bilgisini ve ağ detaylarını sorgular.
  - **Subdomain Bulucu**: Belirtilen alan adının alt alan adlarını (subdomain) haritalandırır.
  - **HTTP Header Analizi**: Hedef web sitelerinin güvenlik başlıklarını (Helmet, CSP vb.) denetler.
- **💬 Yapay Zeka Siber Danışman (Sohbet)**: Siber güvenlik sorularına yanıt veren, tehdit azaltma önerileri sunan 7/24 aktif etkileşimli sohbet asistanı.
- **🔒 Ultra Seviye Sistem Güvenliği (Zırhlı Altyapı)**:
  - **Circuit Breaker (Devre Kesici)**: Sunucu tarafında ardışık 5 hata (HTTP 500) durumunda hassas rotaları otomatik kilitleyerek sistemin tamamen çökmesini önler.
  - **Dinamik Rate Limiting**: Küresel istek limitleyici (15 dk / 100 istek) ve giriş denemeleri için sıkılaştırılmış limitör (15 dk / 20 giriş denemesi).
  - **Slowloris & TCP Koruması**: HTTP header ve boş bağlantı zaman aşımları (`keepAliveTimeout`, `headersTimeout`) ile yavaş istemci saldırılarını engeller.
  - **XSS & SQL Injection Korumaları**: HTTP gövde/parametre temizliği ve girdi filtreleme.
  - **Güçlü Şifreleme**: Kullanıcı şifreleri BcryptJS (12 salt turu) ile veritabanında tuzlanarak saklanır.
  - **Siber Güvenlik Loglama (Audit Logs)**: Sistemdeki kritik tüm kimlik doğrulama, yetki aşımı ve tehdit taramaları arka planda denetim loglarına kaydedilir.
- **📊 Yönetici Komuta Merkezi (Admin Dashboard)**:
  - Canlı sunucu kaynak kullanımı (CPU, RAM, OS, Uptime metrikleri).
  - PostgreSQL ve Önbellek (Redis / Local Cache) durum kontrolü.
  - Canlı siber güvenlik olay kayıtları (Audit Logs) takibi.
  - Devre Kesici (Circuit Breaker) aktiflik izleme paneli.
  - Kullanıcı rolleri ve hesap yetkileri (Admin/Kullanıcı) düzenleme/silme.

---

### 🏗️ Sistem Mimarisi

Aşağıdaki şemada Salus AI platformunun veri akışı ve bileşen ilişkileri gösterilmektedir:

```mermaid
graph TD
    A[İstemci - React/Vite] -- HTTPS Requests --> B[Sunucu - Node.js/Express]
    B --> C{Circuit Breaker & Rate Limit}
    C -- Bloke Edilmediyse --> D[Güvenlik Filtreleri / XSS / SQLi]
    D --> E[Yönlendiriciler / Routers]
    E --> F[(PostgreSQL Veritabanı)]
    E --> G[Gemini AI API]
    E --> H[Python Siber Güvenlik Modülleri]
    E --> I[Redis / Local Cache]
```

---

### 🛠️ Kullanılan Teknolojiler

#### **Frontend (İstemci)**
* **React.js & Vite**: Hızlı ve verimli modüler yapı.
* **Vanilla CSS**: Sıfırdan tasarlanmış modern, premium karanlık tema (dark mode) odaklı glassmorphic arayüz.
* **Lucide React**: Tutarlı, vektörel siber güvenlik ve sistem ikonları.
* **React Router DOM**: İstemci tarafı yönlendirme ve rol bazlı rota koruması.
* **React Query (TanStack)**: Veri çekme, önbellekleme ve durum yönetimi.

#### **Backend (Sunucu)**
* **Node.js & Express**: Hızlı ve esnek API sunucusu.
* **Python 3.10+**: Siber araçları tetikleyen arka plan analiz motorları.
* **PostgreSQL (Knex.js)**: Veri saklama, şema yönetimi ve otomatik göçler (migrations).
* **Helmet & Express Rate Limit**: Temel ve orta seviye OWASP 10 güvenlik katmanı.
* **BcryptJS & JWT**: Güvenli parola saklama ve token tabanlı oturum yönetimi.
* **BullMQ & Redis**: Arka plan iş kuyruğu ve performanslı önbellekleme (olmadığında bellek içi önbelleğe otomatik geçer).

---

### 🚀 Kurulum ve Çalıştırma

Platformun yerel ortamınızda çalıştırılabilmesi için aşağıdaki adımları sırasıyla uygulayınız.

#### 1. Ön Gereksinimler
* Bilgisayarınızda **Node.js (v18+)** ve **Python (3.10+)** yüklü olmalıdır.
* Çalışır durumda bir **PostgreSQL** veritabanı veya NeonDB gibi bulut veritabanı adresi.
* Google AI Studio üzerinden alacağınız bir **Gemini API Anahtarı**.

#### 2. Depo Kurulumu ve Bağımlılıklar

Projenin kök dizinindeyken istemci ve sunucu paketlerini yükleyin:

**İstemci (Frontend) Kurulumu:**
```bash
cd istemci
npm install
```

**Sunucu (Backend) Kurulumu:**
```bash
cd ../sunucu
npm install
```

#### 3. Çevre Değişkenleri Yapılandırması (`.env`)

`sunucu` dizini içerisinde `.env` dosyası oluşturun ve aşağıdaki değişkenleri kendi bilgilerinize göre doldurun:

```env
PORT=5000
VERITABANI_URL=postgresql://kullanici:sifre@host:5432/veritabanil_adi?sslmode=require
JWT_GIZLI_ANAHTAR=rastgele_ve_guvenli_bir_anahtar
GEMINI_API_ANAHTARI=gemini_api_anahtariniz
REDIS_URL=redis://127.0.0.1:6379 # (Opsiyonel, yoksa bellek içi önbelleğe geçilir)
```

#### 4. Çalıştırma

Gerekli tüm yapılandırmalar yapıldıktan sonra iki terminal kullanarak servisleri başlatın:

**Sunucuyu Başlatın (Backend):**
```bash
cd sunucu
npm run dev
```
> [!NOTE]
> Sunucu çalıştırıldığında veritabanı göçleri (migrations) otomatik olarak çalışır ve tabloları hazırlar. Ayrıca ilk kullanım için örnek hesaplar otomatik olarak oluşturulur.
> Sunucu adresi: `http://localhost:5000`

**İstemciyi Başlatın (Frontend):**
```bash
cd istemci
npm run dev
```
> İstemci adresi: `http://localhost:5173` (veya `http://localhost:5174`)

---

### 🔑 Hızlı Erişim için Örnek Hesaplar

Veritabanı otomatik olarak oluşturulduğunda sistemde aşağıdaki test ve yönetim hesapları hazır hale getirilir:

| Hesap Türü | E-Posta | Şifre | Rol |
| :--- | :--- | :--- | :--- |
| **Sistem Yöneticisi** | `admin@salus.ai` | `Salus#AdminSecured*2026` | `admin` |
| **Test Kullanıcısı** | `deneme@salus.ai` | `salus123` | `kullanici` |

---

<br/>
<br/>

---

<a name="en"></a>
## 🇺🇸 English Project Description

**Salus AI** is an enterprise-grade cybersecurity platform developed to simplify modern security operations and accelerate threat analysis workflows through AI integration. Integrated with the powerful models of Google Gemini API, this system unifies network scanning, IP/Domain threat hunting, vulnerability scanning, and cybersecurity audit log parsing into a single dashboard.

The platform was designed and developed by **Eren Söğütlü**.

---

### 🌟 Key Features

- **🤖 AI-Powered Threat Analysis**: Performs deep analysis of suspicious URLs, IPs, and domains utilizing Google Gemini models to generate dynamic threat scores.
- **📄 Smart Log Parser**: Accepts raw system logs, web logs, or audit logs, and detects anomalies and threat patterns, providing AI-driven recommendations.
- **🌐 Network Security Scanner**: An integrated port scanner checking open ports, network service versions, and known vulnerabilities on target hosts.
- **🛠️ Rich Security Utilities Box**:
  - **Password Strength Analyzer & Generator**: High-security password generation and password strength auditing.
  - **Cryptographic Tools**: Easy hashing (MD5, SHA-1, SHA-256) and Base64 encoder/decoder.
  - **IP Geolocation & ISP Lookup**: Detailed geolocation data, ISP verification, and WHOIS query.
  - **Subdomain Enumeration**: Maps subdomains for target domains.
  - **HTTP Header Analyzer**: Audits security headers (Helmet, CSP, HSTS, etc.) of target websites.
- **💬 Cyber Advisor Chatbot**: 24/7 active AI assistant powered by Gemini to answer cybersecurity questions and offer mitigation advice.
- **🔒 Ultra-Level System Security (Shielded Architecture)**:
  - **Circuit Breaker**: Prevents full system downtime by locking sensitive endpoints automatically if the backend records 5 consecutive internal server errors (HTTP 500).
  - **Dynamic Rate Limiting**: Global rate limiter (100 reqs/15m) and hardened authentication rate limiter (20 reqs/15m).
  - **Slowloris & Connection Protections**: Mitigates slow-client attacks using connection thresholds (`keepAliveTimeout`, `headersTimeout`).
  - **SQLi & XSS Defense**: Strict request body/parameter sanitization and input cleaners.
  - **Strong Passwords**: User passwords salted and hashed with BcryptJS (12 rounds).
  - **Audit Logging**: Logs all critical authentications, privilege escalations, and scans to a secure database log table.
- **📊 Administration Command Center**:
  - Live system resource monitors (CPU load, RAM usage, OS platform, Server Uptime).
  - Database (PostgreSQL) and caching (Redis / fallback Local Cache) connection checkers.
  - Interactive cyber security logs visualizer.
  - Live Circuit Breaker status monitor.
  - Role management (Admin/User) to update or delete registered profiles.

---

### 🏗️ System Architecture

The following diagram illustrates the data flow and communication layout of the Salus AI platform:

```mermaid
graph TD
    A[Client - React/Vite] -- HTTPS Requests --> B[Server - Node.js/Express]
    B --> C{Circuit Breaker & Rate Limit}
    C -- If Not Blocked --> D[Security Filters / XSS / SQLi]
    D --> E[Routers]
    E --> F[(PostgreSQL Database)]
    E --> G[Gemini AI API]
    E --> H[Python Security Modules]
    E --> I[Redis / Local Cache]
```

---

### 🛠️ Technologies Used

#### **Frontend**
* **React.js & Vite**: Fast and scalable web UI wrapper.
* **Vanilla CSS**: Premium dark-themed, glassmorphic UI styled from scratch.
* **Lucide React**: Vector cybersecurity and system icons.
* **React Router DOM**: Client-side routing and role-based route guard shields.
* **React Query (TanStack)**: Async query fetching, caching, and client state syncer.

#### **Backend**
* **Node.js & Express**: High-speed, non-blocking asynchronous REST API.
* **Python 3.10+**: Script engines executing deep-level security analysis.
* **PostgreSQL (Knex.js)**: Database engine, schema manager, and automatic Knex migrations.
* **Helmet & Express Rate Limit**: Fundamental OWASP Top 10 security shields.
* **BcryptJS & JWT**: Secure password hashing and token-based state authorization.
* **BullMQ & Redis**: Performance queues and memory caching (automatically falls back to memory cache if Redis is offline).

---

### 🚀 Setup and Operation

Follow these installation instructions to run Salus AI locally:

#### 1. Prerequisites
* **Node.js (v18+)** and **Python (3.10+)** must be installed.
* An active **PostgreSQL** database instance (local or hosted like NeonDB).
* A valid **Gemini API Key** from Google AI Studio.

#### 2. Repository Setup & Dependencies

Install packages in both the frontend and backend directories:

**Frontend Setup:**
```bash
cd istemci
npm install
```

**Backend Setup:**
```bash
cd ../sunucu
npm install
```

#### 3. Environmental Variables Setup (`.env`)

Create a `.env` file inside the `sunucu` directory and enter your values:

```env
PORT=5000
VERITABANI_URL=postgresql://user:password@host:5432/db_name?sslmode=require
JWT_GIZLI_ANAHTAR=your_random_secure_jwt_secret
GEMINI_API_ANAHTARI=your_gemini_api_key
REDIS_URL=redis://127.0.0.1:6379 # (Optional, falls back to memory if empty)
```

#### 4. Running the Applications

Start both services in separate terminals:

**Start Sunucu (Backend):**
```bash
cd sunucu
npm run dev
```
> [!NOTE]
> Database schemas migrate and auto-initialize tables upon backend startup. Seeded admin and user credentials are automatically created if they do not exist.
> Backend URL: `http://localhost:5000`

**Start İstemci (Frontend):**
```bash
cd istemci
npm run dev
```
> Frontend URL: `http://localhost:5173` (or `http://localhost:5174`)

---

### 🔑 Demo Accounts for Quick Access

The following credentials are seeded by default when the database schema initializes:

| Role | Email | Password | Role Key |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@salus.ai` | `Salus#AdminSecured*2026` | `admin` |
| **Test User** | `deneme@salus.ai` | `salus123` | `kullanici` |

---

Developed with ❤️ by **Eren Söğütlü** (2026).
