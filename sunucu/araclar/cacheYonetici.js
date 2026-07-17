const IORedis = require('ioredis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisClient = null;
let fallbackCache = new Map(); // redis yoksa kullanılacak yerel in-memory önbellek
let useFallback = false;

try {
  redisClient = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    lazyConnect: true
  });

  redisClient.on('error', (hata) => {
    if (!useFallback) {
      console.warn('Redis Cache bağlantı hatası, bellek içi (in-memory) önbelleğe geçiliyor:', hata.message);
      useFallback = true;
    }
  });

  redisClient.connect().catch(() => {
    useFallback = true;
  });

} catch (hata) {
  useFallback = true;
}

class CacheYonetici {
  // önbellekten veri getir
  async get(anahtar) {
    if (useFallback || !redisClient) {
      const veri = fallbackCache.get(anahtar);
      if (veri && veri.expiresAt > Date.now()) {
        return JSON.parse(veri.deger);
      }
      if (veri) {
        fallbackCache.delete(anahtar); // süresi geçmiş veriyi temizle
      }
      return null;
    }

    try {
      const veri = await redisClient.get(anahtar);
      return veri ? JSON.parse(veri) : null;
    } catch (hata) {
      console.warn('Cache okuma hatası:', hata.message);
      return null;
    }
  }

  // önbelleğe veri yaz (süre saniye cinsindendir, varsayılan 24 saat)
  async set(anahtar, deger, sureSaniye = 86400) {
    const stringDeger = JSON.stringify(deger);

    if (useFallback || !redisClient) {
      fallbackCache.set(anahtar, {
        deger: stringDeger,
        expiresAt: Date.now() + (sureSaniye * 1000)
      });
      return true;
    }

    try {
      await redisClient.set(anahtar, stringDeger, 'EX', sureSaniye);
      return true;
    } catch (hata) {
      console.warn('Cache yazma hatası:', hata.message);
      return false;
    }
  }

  // önbellekten veri sil
  async del(anahtar) {
    if (useFallback || !redisClient) {
      return fallbackCache.delete(anahtar);
    }

    try {
      await redisClient.del(anahtar);
      return true;
    } catch (hata) {
      console.warn('Cache silme hatası:', hata.message);
      return false;
    }
  }

  // belirli bir desene uyan tüm önbellekleri temizle (örn: 'ip:*')
  async clearPattern(pattern) {
    if (useFallback || !redisClient) {
      const keyPattern = pattern.replace('*', '');
      for (const key of fallbackCache.keys()) {
        if (key.startsWith(keyPattern)) {
          fallbackCache.delete(key);
        }
      }
      return true;
    }

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (hata) {
      console.warn('Cache deseni silme hatası:', hata.message);
      return false;
    }
  }

  durumGetir() {
    return {
      aktif: !useFallback && redisClient && redisClient.status === 'ready',
      tip: useFallback ? 'bellek içi (in-memory)' : 'Redis Cache',
      detay: redisClient ? redisClient.status : 'Bağlanılamadı'
    };
  }
}

module.exports = new CacheYonetici();
