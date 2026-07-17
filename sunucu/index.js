require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hizSinirlandirici = require('express-rate-limit');

// yerel modüller
const { tablolariOlustur } = require('./yapilandirma/veritabani');
const hataYonetici = require('./araclar/hataYonetici');
const { parametreTemizleyici, girdiTemizleyici, zamanAsimiAraci, devreKesiciMiddleware } = require('./araclar/guvenlikAraci');

// yönlendiriciler
const yetkilendirmeYonlendirici = require('./yonlendiriciler/yetkilendirmeYonlendirici');
const aiYonlendirici = require('./yonlendiriciler/aiYonlendirici');
const tehditYonlendirici = require('./yonlendiriciler/tehditYonlendirici');
const kullaniciYonlendirici = require('./yonlendiriciler/kullaniciYonlendirici');
const araclarYonlendirici = require('./yonlendiriciler/araclarYonlendirici');
const yonetimYonlendirici = require('./yonlendiriciler/yonetimYonlendirici');

// express uygulamasını oluştur
const uygulama = express();
const port = process.env.PORT || 5000;

// guvenlik basliklari (helmet)
uygulama.use(helmet());

// cors kisitlamasi
const istemciUrl = process.env.CLIENT_URL || 'http://localhost:5173';
uygulama.use(cors({
  origin: (origin, callback) => {
    const izinVerilenler = [istemciUrl, 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
    const vercelMensei = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
    if (!origin || izinVerilenler.indexOf(origin) !== -1 || vercelMensei || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS politikası engeli: bu adrese erişim izni verilmemiştir'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// parametre kirliligini engelle
uygulama.use(parametreTemizleyici);

// girdileri xss ve script enjeksiyonuna karsi temizle
uygulama.use(girdiTemizleyici);

// cok fazla hata durumunda devre kes
uygulama.use(devreKesiciMiddleware);

// istek hız sınırlama
const genelHizSiniri = hizSinirlandirici({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // her ip için 15 dakikada maksimum 100 istek
  message: {
    basarili: false,
    mesaj: 'çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// yetkilendirme için ayrı hız sınırı
const yetkilendirmeHizSiniri = hizSinirlandirici({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20, // her ip için 15 dakikada maksimum 20 giriş denemesi
  message: {
    basarili: false,
    mesaj: 'çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin'
  },
  standardHeaders: true,
  legacyHeaders: false
});

uygulama.use(genelHizSiniri);

// yavas istekleri engellemek icin zaman asimi korumasi
uygulama.use(zamanAsimiAraci(15000));

// istek gövdesi ayrıştırma
uygulama.use(express.json({ limit: '500kb' }));
uygulama.use(express.urlencoded({ limit: '500kb', extended: true }));

// istek günlüğü
uygulama.use(morgan('dev'));

// api rotaları
uygulama.use('/api/yetkilendirme', yetkilendirmeHizSiniri, yetkilendirmeYonlendirici);
uygulama.use('/api/ai', aiYonlendirici);
uygulama.use('/api/tehdit', tehditYonlendirici);
uygulama.use('/api/kullanici', kullaniciYonlendirici);
uygulama.use('/api/araclar', araclarYonlendirici);
uygulama.use('/api/yonetim', yonetimYonlendirici);

// kök rota - sağlık kontrolü
uygulama.get('/', (istek, yanit) => {
  yanit.status(200).json({
    basarili: true,
    mesaj: 'salus ai siber güvenlik platformu sunucusu çalışıyor',
    surum: '1.0.0',
    zamanDamgasi: new Date().toISOString()
  });
});

// api sağlık kontrolü
uygulama.get('/api/saglik', (istek, yanit) => {
  yanit.status(200).json({
    basarili: true,
    durum: 'aktif',
    sunucuZamani: new Date().toISOString()
  });
});

// devre kesici testi icin hata rotasi
uygulama.get('/api/test-hata', (istek, yanit) => {
  throw new Error('test amacli sistem hatasi');
});

// tanımlanmamış rotalar için 404
uygulama.use('*', (istek, yanit) => {
  yanit.status(404).json({
    basarili: false,
    mesaj: 'istenen kaynak bulunamadı'
  });
});

// genel hata yöneticisi
uygulama.use(hataYonetici);

// sunucuyu başlat ve tabloları oluştur
const sunucuyuBaslat = async () => {
  try {
    // veritabanı tablolarını oluştur
    await tablolariOlustur();
    console.log('veritabanı tabloları hazır');

    // sunucuyu dinlemeye başla
    const sunucu = uygulama.listen(port, () => {
      console.log(`\n========================================`);
      console.log(`  salus ai sunucusu çalışıyor`);
      console.log(`  port: ${port}`);
      console.log(`  ortam: ${process.env.NODE_ENV || 'geliştirme'}`);
      console.log(`  zaman: ${new Date().toLocaleString('tr-TR')}`);
      console.log(`========================================\n`);
    });

    // slowloris ve bos baglanti zaman asimi korumasi
    sunucu.keepAliveTimeout = 65000;
    sunucu.headersTimeout = 66000;
    sunucu.requestTimeout = 60000;
  } catch (hata) {
    console.error('sunucu başlatma hatası:', hata.message);
    process.exit(1);
  }
};

sunucuyuBaslat();

module.exports = uygulama;
