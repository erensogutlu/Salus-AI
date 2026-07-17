const { havuz } = require('../yapilandirma/veritabani');
const { spawn } = require('child_process');
const path = require('path');
const { hedefDogrula } = require('../araclar/guvenlikAraci');

// güvenli python çalıştırıcı (spawn ile - command injection koruması)
const pythonCalistir = (scriptYolu, arglar = [], maxSure = 60000) => {
  return new Promise((resolve, reject) => {
    const islem = spawn('python', [scriptYolu, ...arglar], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      timeout: maxSure
    });

    let stdout = '';
    let stderr = '';

    islem.stdout.on('data', (veri) => { stdout += veri.toString('utf8'); });
    islem.stderr.on('data', (veri) => { stderr += veri.toString('utf8'); });

    islem.on('close', (kod) => {
      if (kod === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python çıkış kodu: ${kod}, hata: ${stderr}`));
      }
    });

    islem.on('error', (hata) => {
      reject(hata);
    });
  });
};

// python ciktisindan tehdit detaylarini olustur
const detaylarOlustur = (cikti) => ({
  hedef: cikti.hedef,
  analizTarihi: new Date().toISOString(),
  riskPuani: cikti.riskPuani,
  tehditSeviyesi: cikti.tehditSeviyesi,
  tehditTipi: cikti.tehditTipi,
  tespitEdilen: cikti.tespitEdilen,
  oneriler: cikti.oneriler,
  acikPortlar: cikti.acikPortlar,
  tesbitEdilenZafiyetler: cikti.tesbitEdilenZafiyetler,
  sslDurumu: cikti.sslDurumu,
  sunucuBilgisi: cikti.sunucuBilgisi
});

// hedef url veya ip analiz et
const hedefAnaliz = async (istek, yanit, sonraki) => {
  try {
    const { hedef } = istek.body;
    const kullaniciId = istek.kullanici.kullanici_id;

    // 24 saatten eski kayıtları sil
    await havuz.query(`DELETE FROM tehdit_kayitlari WHERE olusturulma_tarihi < NOW() - INTERVAL '24 hours'`);
    await havuz.query(`DELETE FROM tarama_sonuclari WHERE tarama_tarihi < NOW() - INTERVAL '24 hours'`);

    // hedef kontrolü ve ssrf koruması
    const dogrulama = await hedefDogrula(hedef);
    if (!dogrulama.gecerli) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: dogrulama.hata
      });
    }

    const temizHedef = dogrulama.temizHedef;

    // gerçek taramayı başlat (spawn ile güvenli çalıştırma)
    let pythonCiktisi;
    try {
      const pythonScriptYolu = path.join(__dirname, '../yapay_zeka/moduller/salus_scanner.py');
      const stdout = await pythonCalistir(pythonScriptYolu, [temizHedef], 60000);
      pythonCiktisi = JSON.parse(stdout.trim());
    } catch (e) {
      console.error('Python tarama hatası:', e);
      return yanit.status(500).json({
        basarili: false,
        mesaj: 'Gerçek tarama başlatılırken bir hata oluştu. Hedefe ulaşılamıyor olabilir.'
      });
    }

    if (!pythonCiktisi.basarili) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: pythonCiktisi.hata || 'Tarama başarısız oldu'
      });
    }

    // detayları python'dan gelen gerçek verilerle doldur
    const detaylar = detaylarOlustur(pythonCiktisi);

    // tehdit kaydını veritabanına kaydet
    await havuz.query(
      `INSERT INTO tehdit_kayitlari (kullanici_id, hedef, tehdit_tipi, tehdit_seviyesi, detaylar)
       VALUES ($1, $2, $3, $4, $5)`,
      [kullaniciId, pythonCiktisi.hedef, pythonCiktisi.tehditTipi, pythonCiktisi.tehditSeviyesi, JSON.stringify(detaylar)]
    );

    // tarama sonuçlarını da kaydet
    await havuz.query(
      `INSERT INTO tarama_sonuclari (kullanici_id, hedef_ip, acik_portlar, zafiyetler)
       VALUES ($1, $2, $3, $4)`,
      [kullaniciId, pythonCiktisi.gercek_ip, JSON.stringify(pythonCiktisi.acikPortlar), JSON.stringify(pythonCiktisi.tesbitEdilenZafiyetler)]
    );

    yanit.status(200).json({
      basarili: true,
      mesaj: 'analiz tamamlandı',
      veri: detaylar
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// tehdit kayıtlarını getir
const kayitlariGetir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;

    // 24 saatten eski tehdit kayıtlarını sil
    await havuz.query(`DELETE FROM tehdit_kayitlari WHERE olusturulma_tarihi < NOW() - INTERVAL '24 hours'`);

    const kayitlarSorgusu = await havuz.query(
      `SELECT id, hedef, tehdit_tipi, tehdit_seviyesi, detaylar, olusturulma_tarihi
       FROM tehdit_kayitlari
       WHERE kullanici_id = $1
       ORDER BY olusturulma_tarihi DESC`,
      [kullaniciId]
    );

    yanit.status(200).json({
      basarili: true,
      toplam: kayitlarSorgusu.rows.length,
      veri: kayitlarSorgusu.rows
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// tehdit istatistiklerini getir (son 30 gün)
const istatistikGetir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;

    // 24 saatten eski tehdit kayıtlarını sil
    await havuz.query(`DELETE FROM tehdit_kayitlari WHERE olusturulma_tarihi < NOW() - INTERVAL '24 hours'`);

    // seviyeye göre sayılar
    const seviyeSorgusu = await havuz.query(
      `SELECT tehdit_seviyesi, COUNT(*) as sayi
       FROM tehdit_kayitlari
       WHERE kullanici_id = $1 AND olusturulma_tarihi >= NOW() - INTERVAL '30 days'
       GROUP BY tehdit_seviyesi`,
      [kullaniciId]
    );

    // toplam tarama sayısı
    const toplamSorgu = await havuz.query(
      `SELECT COUNT(*) as toplam
       FROM tehdit_kayitlari
       WHERE kullanici_id = $1 AND olusturulma_tarihi >= NOW() - INTERVAL '30 days'`,
      [kullaniciId]
    );

    // son 7 günlük günlük tarama sayısı
    const gunlukSorgu = await havuz.query(
      `SELECT DATE(olusturulma_tarihi) as tarih, COUNT(*) as sayi
       FROM tehdit_kayitlari
       WHERE kullanici_id = $1 AND olusturulma_tarihi >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(olusturulma_tarihi)
       ORDER BY tarih DESC`,
      [kullaniciId]
    );

    // istatistikleri düzenle
    const seviyeDagilimi = {};
    seviyeSorgusu.rows.forEach(satir => {
      seviyeDagilimi[satir.tehdit_seviyesi] = parseInt(satir.sayi);
    });

    yanit.status(200).json({
      basarili: true,
      veri: {
        seviyeDagilimi,
        toplamTarama: parseInt(toplamSorgu.rows[0]?.toplam || 0),
        gunlukTarama: gunlukSorgu.rows
      }
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// tarama sonuçlarını getir
const taramalariGetir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;

    // 24 saatten eski tarama sonuçlarını sil
    await havuz.query(`DELETE FROM tarama_sonuclari WHERE tarama_tarihi < NOW() - INTERVAL '24 hours'`);

    const taramalarSorgusu = await havuz.query(
      `SELECT id, hedef_ip, acik_portlar, zafiyetler, tarama_tarihi
       FROM tarama_sonuclari
       WHERE kullanici_id = $1
       ORDER BY tarama_tarihi DESC`,
      [kullaniciId]
    );

    yanit.status(200).json({
      basarili: true,
      toplam: taramalarSorgusu.rows.length,
      veri: taramalarSorgusu.rows
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// tehdit kaydını sil
const kayitSil = async (istek, yanit, sonraki) => {
  try {
    const { id } = istek.params;
    const kullaniciId = istek.kullanici.kullanici_id;

    const silmeSorgusu = await havuz.query(
      'DELETE FROM tehdit_kayitlari WHERE id = $1 AND kullanici_id = $2 RETURNING id',
      [id, kullaniciId]
    );

    if (silmeSorgusu.rows.length === 0) {
      return yanit.status(404).json({
        basarili: false,
        mesaj: 'Kayıt bulunamadı veya silme yetkiniz yok'
      });
    }

    yanit.status(200).json({
      basarili: true,
      mesaj: 'Rapor başarıyla silindi'
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// nmap veya diğer logları analiz et
const logAnaliz = async (istek, yanit, sonraki) => {
  try {
    const { logMetni } = istek.body;
    const kullaniciId = istek.kullanici.kullanici_id;

    if (!logMetni || logMetni.trim().length === 0) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'Analiz edilecek log metni gereklidir'
      });
    }

    let pythonCiktisi;
    try {
      const pythonScriptYolu = path.join(__dirname, '../yapay_zeka/moduller/gelismis_log_analiz.py');
      // base64 encoding for safe passage
      const base64Log = Buffer.from(logMetni).toString('base64');
      const stdout = await pythonCalistir(pythonScriptYolu, [base64Log], 60000);
      pythonCiktisi = JSON.parse(stdout.trim());
    } catch (e) {
      console.error('Python log analiz hatası:', e);
      return yanit.status(500).json({
        basarili: false,
        mesaj: 'Log analiz modülü çalıştırılamadı.'
      });
    }

    if (!pythonCiktisi.basarili) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: pythonCiktisi.hata || 'Analiz başarısız oldu'
      });
    }

    const detaylar = detaylarOlustur(pythonCiktisi);

    // raporlara kaydet
    const kayitSorgusu = await havuz.query(
      `INSERT INTO tehdit_kayitlari (kullanici_id, hedef, tehdit_tipi, tehdit_seviyesi, detaylar)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [kullaniciId, pythonCiktisi.hedef, pythonCiktisi.tehditTipi, pythonCiktisi.tehditSeviyesi, JSON.stringify(detaylar)]
    );

    detaylar.id = kayitSorgusu.rows[0].id;

    yanit.status(200).json({
      basarili: true,
      mesaj: 'Log analizi başarıyla tamamlandı ve raporlara eklendi',
      veri: detaylar
    });
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = { hedefAnaliz, kayitlariGetir, istatistikGetir, taramalariGetir, kayitSil, logAnaliz };
