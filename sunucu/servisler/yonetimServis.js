const os = require('os');
const { knex } = require('../yapilandirma/veritabani');
const cacheYonetici = require('../araclar/cacheYonetici');

class YonetimServis {
  async sistemSagligiGetir() {
    // veritabani durumu
    let dbDurumu = 'aktif';
    let dbHata = null;
    try {
      await knex.raw('SELECT 1');
    } catch (err) {
      dbDurumu = 'pasif';
      dbHata = err.message;
    }

    // bellek durumu
    const toplamBellek = os.totalmem();
    const bosBellek = os.freemem();
    const kullanilanBellek = toplamBellek - bosBellek;
    const bellekYuzdesi = Math.round((kullanilanBellek / toplamBellek) * 100);

    // cpu durumu
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // veri istatistikleri
    const toplamKullanicilarRes = await knex('kullanicilar').count('id as toplam').first();
    const toplamTehditlerRes = await knex('tehdit_kayitlari').count('id as toplam').first();
    const toplamTaramalarRes = await knex('tarama_sonuclari').count('id as toplam').first();
    const toplamSohbetlerRes = await knex('sohbet_gecmisi').count('id as toplam').first();

    const istatistikler = {
      toplamKullanici: parseInt(toplamKullanicilarRes?.toplam || 0),
      toplamTehdit: parseInt(toplamTehditlerRes?.toplam || 0),
      toplamTarama: parseInt(toplamTaramalarRes?.toplam || 0),
      toplamSohbet: parseInt(toplamSohbetlerRes?.toplam || 0),
    };

    const onbellek = cacheYonetici.durumGetir();

    // siber guvenlik audit loglari
    const sonGuvenlikOlaylari = await knex('guvenlik_gunlukleri')
      .leftJoin('kullanicilar', 'guvenlik_gunlukleri.kullanici_id', 'kullanicilar.id')
      .select(
        'guvenlik_gunlukleri.id',
        'guvenlik_gunlukleri.olay_tipi',
        'guvenlik_gunlukleri.hedef',
        'guvenlik_gunlukleri.detay',
        'guvenlik_gunlukleri.ip_adresi',
        'guvenlik_gunlukleri.olusturulma_tarihi',
        'kullanicilar.kullanici_adi as yapan_kullanici'
      )
      .orderBy('guvenlik_gunlukleri.id', 'desc')
      .limit(10);

    return {
      isletimSistemi: `${os.type()} ${os.release()} (${os.arch()})`,
      uptime: os.uptime(),
      sunucuUptime: process.uptime(),
      nodeSurumu: process.version,
      cpuModel: cpus[0]?.model || 'Bilinmiyor',
      cpuCekirdekSayisi: cpus.length,
      cpuLoad1Min: loadAvg[0]?.toFixed(2) || '0.00',
      cpuLoad5Min: loadAvg[1]?.toFixed(2) || '0.00',
      cpuLoad15Min: loadAvg[2]?.toFixed(2) || '0.00',
      bellek: {
        toplam: (toplamBellek / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        kullanilan: (kullanilanBellek / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        bos: (bosBellek / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        yuzde: bellekYuzdesi
      },
      veritabani: {
        durum: dbDurumu,
        hata: dbHata
      },
      onbellek,
      istatistikler,
      sonGuvenlikOlaylari
    };
  }
}

module.exports = new YonetimServis();
