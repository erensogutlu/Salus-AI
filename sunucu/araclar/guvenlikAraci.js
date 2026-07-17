const dns = require('dns').promises;
const { knex } = require('../yapilandirma/veritabani');

// siber guvenlik olay gunlugu kaydet
const guvenlikKaydet = async (kullaniciId, olayTipi, hedef, detay, ip) => {
  try {
    await knex('guvenlik_gunlukleri').insert({
      kullanici_id: kullaniciId || null,
      olay_tipi: olayTipi,
      hedef: hedef || null,
      detay: detay || null,
      ip_adresi: ip || null
    });
  } catch (hata) {
    // loglama hatasi uygulamayi bloklamasin
    console.error('guvenlik log kayit hatasi:', hata.message);
  }
};

// hpp (http parameter pollution) temizleyici middleware
const parametreTemizleyici = (istek, yanit, sonraki) => {
  if (istek.query) {
    for (const anahtar in istek.query) {
      if (Array.isArray(istek.query[anahtar])) {
        // dizi geldiyse son elemani sec
        istek.query[anahtar] = istek.query[anahtar][istek.query[anahtar].length - 1];
      }
    }
  }
  sonraki();
};

// ozel veya yerel ag ip adresi mi kontrol et
const ipKorumaliMi = (ip) => {
  if (!ip) return true;
  
  // ipv4 kontrol
  if (ip.includes('.')) {
    const oktetler = ip.split('.').map(Number);
    if (oktetler.length !== 4 || oktetler.some(isNaN)) return true;
    
    // 127.0.0.0/8 (loopback)
    if (oktetler[0] === 127) return true;
    // 10.0.0.0/8 (ozel)
    if (oktetler[0] === 10) return true;
    // 172.16.0.0/12 (ozel)
    if (oktetler[0] === 172 && oktetler[1] >= 16 && oktetler[1] <= 31) return true;
    // 192.168.0.0/16 (ozel)
    if (oktetler[0] === 192 && oktetler[1] === 168) return true;
    // 169.254.0.0/16 (baglanti yerel)
    if (oktetler[0] === 169 && oktetler[1] === 254) return true;
    // 0.0.0.0 (tanimsiz)
    if (oktetler[0] === 0) return true;
    // 224.0.0.0/4 (multicast) ve 240.0.0.0/4 (ayrilmis)
    if (oktetler[0] >= 224) return true;
  }
  
  // ipv6 kontrol
  if (ip.includes(':')) {
    const kucukIp = ip.toLowerCase().trim();
    // loopback (::1)
    if (kucukIp === '::1' || kucukIp === '0:0:0:0:0:0:0:1') return true;
    // yerel (fe80::)
    if (kucukIp.startsWith('fe80')) return true;
    // benzersiz yerel (fc00:: veya fd00::)
    if (kucukIp.startsWith('fc00') || kucukIp.startsWith('fd00')) return true;
    // unspecified (::)
    if (kucukIp === '::' || kucukIp === '0:0:0:0:0:0:0:0') return true;
  }
  
  return false;
};

// hedef domain veya ip adresini ssrf'e karsi dogrula
const hedefDogrula = async (hedef) => {
  if (!hedef || typeof hedef !== 'string') {
    return { gecerli: false, hata: 'gecersiz hedef formatı' };
  }
  
  const temizHedef = hedef.trim().toLowerCase();
  
  // temel regex kontrolleri
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,24}$/;
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  
  const isDomain = domainRegex.test(temizHedef);
  const isIpv4 = ipv4Regex.test(temizHedef);
  const isIpv6 = temizHedef.includes(':') && (temizHedef === '::1' || temizHedef.startsWith('fe80'));
  
  if (!isDomain && !isIpv4 && !isIpv6) {
    return { gecerli: false, hata: 'lutfen gecerli bir alan adi veya ip adresi girin (ozel karakter barindirmamalidir)' };
  }
  
  // ip ise dogrudan ozel ag kontrolu yap
  if (isIpv4 || isIpv6) {
    if (ipKorumaliMi(temizHedef)) {
      return { gecerli: false, hata: 'yerel veya ozel ag adresleri taranamaz' };
    }
    return { gecerli: true, temizHedef };
  }
  
  // domain ise dns coz ve ip'leri kontrol et (ssrf/dns rebinding onleme)
  try {
    const adresler = await dns.resolve(temizHedef).catch(async () => {
      const { address } = await dns.lookup(temizHedef);
      return [address];
    });
    
    for (const adres of adresler) {
      if (ipKorumaliMi(adres)) {
        return { gecerli: false, hata: 'yerel veya ozel aglara yonelen alan adlari taranamaz' };
      }
    }
  } catch (hata) {
    return { gecerli: false, hata: 'alan adi cozumlenemedi veya aktif degil' };
  }
  
  return { gecerli: true, temizHedef };
};

// html/script etiketlerini temizle (xss onleyici yardimci)
const etiketTemizle = (deger) => {
  if (typeof deger !== 'string') return deger;
  return deger
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

// istek icerigindeki verileri recursively temizle
const girdiTemizleNesnesi = (nesne) => {
  if (nesne === null || nesne === undefined) return nesne;
  
  if (typeof nesne === 'string') {
    return etiketTemizle(nesne);
  }
  
  if (Array.isArray(nesne)) {
    return nesne.map(girdiTemizleNesnesi);
  }
  
  if (typeof nesne === 'object') {
    const yeniNesne = {};
    for (const anahtar in nesne) {
      if (Object.prototype.hasOwnProperty.call(nesne, anahtar)) {
        yeniNesne[anahtar] = girdiTemizleNesnesi(nesne[anahtar]);
      }
    }
    return yeniNesne;
  }
  
  return nesne;
};

// global xss/enjeksiyon temizleyici middleware
const girdiTemizleyici = (istek, yanit, sonraki) => {
  if (istek.body) istek.body = girdiTemizleNesnesi(istek.body);
  if (istek.query) istek.query = girdiTemizleNesnesi(istek.query);
  if (istek.params) istek.params = girdiTemizleNesnesi(istek.params);
  sonraki();
};

// yavas istekleri engellemek icin zaman asimi middleware
const zamanAsimiAraci = (sure = 15000) => {
  return (istek, yanit, sonraki) => {
    let istekSuresi = sure;
    const yol = istek.originalUrl || istek.path || '';
    if (yol.includes('/api/tehdit/analiz') || yol.includes('/api/araclar/calistir') || yol.includes('/api/tehdit/log-analiz')) {
      istekSuresi = 65000; // tarama islemleri icin 65 saniye limit
    }
    yanit.setTimeout(istekSuresi, () => {
      if (!yanit.headersSent) {
        yanit.status(503).json({
          basarili: false,
          mesaj: 'istek zaman asimina ugradi'
        });
      }
    });
    sonraki();
  };
};

let cbState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
let cbConsecutiveErrors = 0;
const CB_THRESHOLD = 5; // 5 adet ardışık 500 hatası
const CB_COOLDOWN = 30000; // 30 saniye soğuma süresi
let cbLastTripTime = 0;

// ardı ardına çok fazla sistem hatası (500) alındığında devre kesen middleware
const devreKesiciMiddleware = (istek, yanit, sonraki) => {
  const yol = istek.path;
  if (yol === '/' || yol === '/api/saglik') {
    return sonraki();
  }

  if (cbState === 'OPEN') {
    const gecenSure = Date.now() - cbLastTripTime;
    if (gecenSure > CB_COOLDOWN) {
      cbState = 'HALF_OPEN';
      console.log('[DEVRE KESICI] yarım-açık konumuna geçildi, sistem test ediliyor.');
    } else {
      return yanit.status(503).json({
        basarili: false,
        mesaj: 'sistem geçici olarak servis dışı. lütfen daha sonra tekrar deneyin (devre kesici aktif).'
      });
    }
  }

  // istek bitimini ve durum kodunu dinle
  yanit.on('finish', () => {
    const durum = yanit.statusCode;
    if (durum >= 500) {
      cbConsecutiveErrors++;
      if (cbConsecutiveErrors >= CB_THRESHOLD && cbState !== 'OPEN') {
        cbState = 'OPEN';
        cbLastTripTime = Date.now();
        console.error(`[DEVRE KESICI] ${cbConsecutiveErrors} adet ardışık 500 hatası alındı! devre kesildi (OPEN).`);
      }
    } else if (durum < 500) {
      // başarılı istek durumunda sıfırla
      if (cbState === 'HALF_OPEN') {
        cbState = 'CLOSED';
        cbConsecutiveErrors = 0;
        console.log('[DEVRE KESICI] sistem başarıyla kurtarıldı. devre kapandı (CLOSED).');
      } else {
        cbConsecutiveErrors = 0;
      }
    }
  });

  sonraki();
};

module.exports = {
  guvenlikKaydet,
  parametreTemizleyici,
  hedefDogrula,
  girdiTemizleyici,
  zamanAsimiAraci,
  devreKesiciMiddleware
};
