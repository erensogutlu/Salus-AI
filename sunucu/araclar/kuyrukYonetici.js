const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let taramaKuyrugu = null;
let redisBaglantisi = null;
let fallbackModu = false;

try {
  // redis bağlantısını başlat
  redisBaglantisi = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true // bağlantıyı hemen zorlama, hata durumunu yakalayalım
  });

  redisBaglantisi.on('error', (hata) => {
    if (!fallbackModu) {
      console.warn('Redis bağlantı hatası. Sistem doğrudan (in-process) görev çalıştırma moduna (fallback) geçiyor:', hata.message);
      fallbackModu = true;
    }
  });

  // bağlantıyı kurmayı dene
  redisBaglantisi.connect().then(() => {
    console.log('Redis bağlantısı başarıyla kuruldu.');
    // kuyruk tanımla
    taramaKuyrugu = new Queue('salus_taramalar', { connection: redisBaglantisi });
  }).catch((hata) => {
    console.warn('Redis sunucusuna erişilemedi. Fallback modunda devam ediliyor.');
    fallbackModu = true;
  });

} catch (hata) {
  console.warn('Redis / BullMQ yapılandırılamadı, fallback modu aktif:', hata.message);
  fallbackModu = true;
}

// socket.io referansı (anlık bildirimler için)
let ioInstance = null;

const socketIoAyarla = (io) => {
  ioInstance = io;
};

// görev ekle (kuyruğa veya doğrudan yürütmeye)
const gorevEkle = async (gorevTipi, veri, isleyiciFonksiyon) => {
  if (fallbackModu || !taramaKuyrugu) {
    console.log(`[FALLBACK] Görev kuyruğa alınmadan doğrudan çalıştırılıyor: ${gorevTipi}`);
    // doğrudan asenkron çalıştır (express thread bloklanmasın)
    setImmediate(async () => {
      try {
        const sonuc = await isleyiciFonksiyon(veri);
        if (ioInstance && veri.soketId) {
          ioInstance.to(veri.soketId).emit('tarama_tamamlandi', { veri: sonuc });
        }
      } catch (hata) {
        console.error(`[FALLBACK] Görev hatası (${gorevTipi}):`, hata.message);
        if (ioInstance && veri.soketId) {
          ioInstance.to(veri.soketId).emit('tarama_hatasi', { hata: hata.message });
        }
      }
    });
    return { id: `local_${Date.now()}`, durum: 'isleniyor' };
  }

  // redis aktifse bullmq kuyruğuna ekle
  const job = await taramaKuyrugu.add(gorevTipi, veri, {
    attempts: 3,
    backoff: 5000
  });

  return { id: job.id, durum: 'kuyrukta' };
};

// worker yapılandırması (sadece redis aktifse çalışır)
if (redisBaglantisi && !fallbackModu) {
  const worker = new Worker('salus_taramalar', async (job) => {
    console.log(`[WORKER] Görev başladı: ${job.name} (ID: ${job.id})`);
    
    // taramayı çalıştır (bu kısım denetleyiciden gelen işleyici fonksiyonları bağlar)
    // gerçek prodüksiyon kodunda worker ayrı bir süreçte çalıştırılmalıdır
    
    if (ioInstance && job.data.soketId) {
      ioInstance.to(job.data.soketId).emit('tarama_durumu', { adim: 'Taramalar yapılıyor...' });
    }
  }, { connection: redisBaglantisi });

  worker.on('completed', (job) => {
    console.log(`[WORKER] Görev tamamlandı: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WORKER] Görev başarısız oldu: ${job?.id}, Hata:`, err.message);
  });
}

module.exports = { socketIoAyarla, gorevEkle, fallbackModu };
