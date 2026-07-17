const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const kullaniciDepo = require('../depolar/kullaniciDepo');
const { guvenlikKaydet } = require('../araclar/guvenlikAraci');
const { knex } = require('../yapilandirma/veritabani');

// en az 8 karakter, 1 buyuk harf, 1 kucuk harf, 1 rakam ve 1 ozel karakter
const SIFRE_KONTROL = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\*])[A-Za-z\d@$!%*?&._\-\*]{8,}$/;

class KullaniciServis {
  jetonOlustur(kullanici) {
    const yukler = {
      kullanici_id: kullanici.id,
      kullanici_adi: kullanici.kullanici_adi,
      eposta: kullanici.eposta
    };

    return jwt.sign(yukler, process.env.JWT_GIZLI_ANAHTAR, {
      expiresIn: '7d'
    });
  }

  async kayitOl(kullaniciVerisi, ip) {
    const { kullanici_adi, eposta, sifre, tam_ad } = kullaniciVerisi;

    if (!kullanici_adi || !eposta || !sifre) {
      const hata = new Error('kullanıcı adı, e-posta ve şifre zorunludur');
      hata.durumKodu = 400;
      throw hata;
    }

    if (!SIFRE_KONTROL.test(sifre)) {
      const hata = new Error('şifre en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir');
      hata.durumKodu = 400;
      throw hata;
    }

    // benzersizlik kontrolü
    const varMi = await kullaniciDepo.epostaVeyaKullaniciAdiVarMi(kullanici_adi, eposta);
    if (varMi) {
      const hata = new Error('bu kullanıcı adı veya e-posta zaten kayıtlı');
      hata.durumKodu = 409;
      throw hata;
    }

    const tuz = await bcrypt.genSalt(12);
    const sifreHash = await bcrypt.hash(sifre, tuz);

    const yeniKullanici = await kullaniciDepo.ekle({
      kullanici_adi,
      eposta,
      sifre_hash: sifreHash,
      tam_ad
    });

    // guvenlik gunlugu
    await guvenlikKaydet(yeniKullanici.id, 'user_register', yeniKullanici.kullanici_adi, 'yeni kullanici kaydi yapildi', ip);

    const jeton = this.jetonOlustur(yeniKullanici);
    return { kullanici: yeniKullanici, jeton };
  }

  async girisYap(eposta, sifre, ip) {
    if (!eposta || !sifre) {
      const hata = new Error('e-posta ve şifre zorunludur');
      hata.durumKodu = 400;
      throw hata;
    }

    const kullanici = await kullaniciDepo.epostaIleBul(eposta);

    // hesap kilitleme kontrolu (son 15 dakikada 5 veya ustu basarisiz giris)
    const { knex } = require('../yapilandirma/veritabani');
    const sonOnBesDakika = new Date(Date.now() - 15 * 60 * 1000);
    const basarisizGirisSorgu = await knex('guvenlik_gunlukleri')
      .where({ olay_tipi: 'failed_login' })
      .andWhere((builder) => {
        builder.where({ hedef: eposta });
        if (kullanici) {
          builder.orWhere({ hedef: kullanici.kullanici_adi });
        }
      })
      .andWhere('olusturulma_tarihi', '>=', sonOnBesDakika)
      .count('id as toplam')
      .first();

    if (parseInt(basarisizGirisSorgu?.toplam || 0, 10) >= 5) {
      const hata = new Error('çok fazla başarısız giriş denemesi. hesabınız geçici olarak kilitlendi, lütfen 15 dakika sonra tekrar deneyin.');
      hata.durumKodu = 429;
      throw hata;
    }

    if (!kullanici) {
      // basarisiz giris denemesi
      await guvenlikKaydet(null, 'failed_login', eposta, 'gecersiz eposta ile giris denemesi', ip);
      
      const hata = new Error('geçersiz e-posta veya şifre');
      hata.durumKodu = 401;
      throw hata;
    }

    const gecerliSifre = await bcrypt.compare(sifre, kullanici.sifre_hash);
    if (!gecerliSifre) {
      // basarisiz giris denemesi (sifre hatali)
      await guvenlikKaydet(kullanici.id, 'failed_login', kullanici.kullanici_adi, 'hatali sifre ile giris denemesi', ip);

      const hata = new Error('geçersiz e-posta veya şifre');
      hata.durumKodu = 401;
      throw hata;
    }

    await kullaniciDepo.sonGirisGuncelle(kullanici.id);

    // guvenlik gunlugu (basarili giris)
    await guvenlikKaydet(kullanici.id, 'successful_login', kullanici.kullanici_adi, 'kullanici giris yapti', ip);

    const jeton = this.jetonOlustur(kullanici);
    
    // hassas veriyi çıkar
    delete kullanici.sifre_hash;
    
    return { kullanici, jeton };
  }

  async profilGetir(id) {
    const kullanici = await kullaniciDepo.idIleBul(id);
    if (!kullanici) {
      const hata = new Error('kullanıcı bulunamadı');
      hata.durumKodu = 404;
      throw hata;
    }
    delete kullanici.sifre_hash;
    return kullanici;
  }

  async profilGuncelle(id, profilVerisi) {
    const guncellenen = await kullaniciDepo.profilGuncelle(id, profilVerisi);
    if (!guncellenen) {
      const hata = new Error('kullanıcı bulunamadı');
      hata.durumKodu = 404;
      throw hata;
    }
    return guncellenen;
  }

  async sifreDegistir(id, mevcutSifre, yeniSifre, ip) {
    if (!mevcutSifre || !yeniSifre) {
      const hata = new Error('mevcut şifre ve yeni şifre gereklidir');
      hata.durumKodu = 400;
      throw hata;
    }

    if (!SIFRE_KONTROL.test(yeniSifre)) {
      const hata = new Error('yeni şifre en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir');
      hata.durumKodu = 400;
      throw hata;
    }

    const kullanici = await kullaniciDepo.idIleBul(id);
    if (!kullanici) {
      const hata = new Error('kullanıcı bulunamadı');
      hata.durumKodu = 404;
      throw hata;
    }

    const gecerliSifre = await bcrypt.compare(mevcutSifre, kullanici.sifre_hash);
    if (!gecerliSifre) {
      const hata = new Error('mevcut şifreniz hatalı');
      hata.durumKodu = 401;
      throw hata;
    }

    const tuz = await bcrypt.genSalt(12);
    const yeniSifreHash = await bcrypt.hash(yeniSifre, tuz);

    await kullaniciDepo.sifreGuncelle(id, yeniSifreHash);

    // guvenlik gunlugu
    await guvenlikKaydet(id, 'password_change', kullanici.kullanici_adi, 'kullanici sifresini degistirdi', ip);

    return { basarili: true };
  }

  async hesapSil(id, ip) {
    const kullanici = await kullaniciDepo.idIleBul(id);
    const kullaniciAdi = kullanici ? kullanici.kullanici_adi : 'bilinmeyen';
    
    const sonuc = await kullaniciDepo.sil(id);

    // guvenlik gunlugu
    await guvenlikKaydet(null, 'user_delete', kullaniciAdi, 'kullanici hesabi silindi', ip);

    return sonuc;
  }

  // panel istatistikleri ve grafik verilerini getir
  async panelVerisiGetir(kullaniciId) {
    // toplam tarama sayisi
    const toplamTaramaRes = await knex('tarama_sonuclari')
      .where({ kullanici_id: kullaniciId })
      .count('id as toplam')
      .first();

    // toplam tehdit sayisi
    const toplamTehditRes = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .andWhere('tehdit_seviyesi', '!=', 'güvenli')
      .count('id as toplam')
      .first();

    // kritik tehditler
    const kritikTehditRes = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .whereIn('tehdit_seviyesi', ['yüksek', 'kritik'])
      .count('id as toplam')
      .first();

    // toplam sohbet sayisi
    const toplamSohbetRes = await knex('sohbet_gecmisi')
      .where({ kullanici_id: kullaniciId })
      .count('id as toplam')
      .first();

    const toplamTarama = parseInt(toplamTaramaRes?.toplam || 0);
    const toplamTehdit = parseInt(toplamTehditRes?.toplam || 0);
    const kritikTehdit = parseInt(kritikTehditRes?.toplam || 0);
    const toplamSohbet = parseInt(toplamSohbetRes?.toplam || 0);

    const simdi = new Date();
    const yediGunOnce = new Date(simdi.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ondortGunOnce = new Date(simdi.getTime() - 14 * 24 * 60 * 60 * 1000);

    // son 7 gun tarama
    const sonYediGunTaramaRes = await knex('tarama_sonuclari')
      .where({ kullanici_id: kullaniciId })
      .andWhere('tarama_tarihi', '>=', yediGunOnce)
      .count('id as toplam')
      .first();

    // onceki 7 gun tarama
    const oncekiYediGunTaramaRes = await knex('tarama_sonuclari')
      .where({ kullanici_id: kullaniciId })
      .andWhere('tarama_tarihi', '>=', ondortGunOnce)
      .andWhere('tarama_tarihi', '<', yediGunOnce)
      .count('id as toplam')
      .first();

    const sonYediGunTarama = parseInt(sonYediGunTaramaRes?.toplam || 0);
    const oncekiYediGunTarama = parseInt(oncekiYediGunTaramaRes?.toplam || 0);

    let taramaDegisim = 0;
    if (oncekiYediGunTarama > 0) {
      taramaDegisim = Math.round(((sonYediGunTarama - oncekiYediGunTarama) / oncekiYediGunTarama) * 100);
    } else if (sonYediGunTarama > 0) {
      taramaDegisim = 100;
    }

    // son 7 gun tehdit
    const sonYediGunTehditRes = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .andWhere('tehdit_seviyesi', '!=', 'güvenli')
      .andWhere('olusturulma_tarihi', '>=', yediGunOnce)
      .count('id as toplam')
      .first();

    // onceki 7 gun tehdit
    const oncekiYediGunTehditRes = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .andWhere('tehdit_seviyesi', '!=', 'güvenli')
      .andWhere('olusturulma_tarihi', '>=', ondortGunOnce)
      .andWhere('olusturulma_tarihi', '<', yediGunOnce)
      .count('id as toplam')
      .first();

    const sonYediGunTehdit = parseInt(sonYediGunTehditRes?.toplam || 0);
    const oncekiYediGunTehdit = parseInt(oncekiYediGunTehditRes?.toplam || 0);

    let tehditDegisim = 0;
    if (oncekiYediGunTehdit > 0) {
      tehditDegisim = Math.round(((sonYediGunTehdit - oncekiYediGunTehdit) / oncekiYediGunTehdit) * 100);
    } else if (sonYediGunTehdit > 0) {
      tehditDegisim = 100;
    }

    // guvenlik puani hesabi
    let guvenlikPuani = 100;
    if (toplamTarama > 0) {
      const tehditOrani = toplamTehdit / toplamTarama;
      guvenlikPuani = Math.max(0, Math.round(100 - (tehditOrani * 50) - (kritikTehdit * 10)));
    }

    // en yeni 5 tehdit
    const sonTehditlerRows = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .orderBy('olusturulma_tarihi', 'desc')
      .limit(5);

    const sonTehditler = sonTehditlerRows.map(satir => {
      let seviye = 'dusuk';
      if (satir.tehdit_seviyesi === 'kritik' || satir.tehdit_seviyesi === 'yüksek') {
        seviye = 'yuksek';
      } else if (satir.tehdit_seviyesi === 'orta') {
        seviye = 'orta';
      }

      const tarih = new Date(satir.olusturulma_tarihi);
      const farkSaniye = Math.floor((new Date() - tarih) / 1000);
      let zaman = '';
      if (farkSaniye < 60) {
        zaman = 'şimdi';
      } else if (farkSaniye < 3600) {
        zaman = `${Math.floor(farkSaniye / 60)} dakika önce`;
      } else if (farkSaniye < 86400) {
        zaman = `${Math.floor(farkSaniye / 3600)} saat önce`;
      } else {
        zaman = `${Math.floor(farkSaniye / 86400)} gün önce`;
      }

      return {
        id: satir.id,
        ad: `${satir.hedef} (${satir.tehdit_tipi})`,
        seviye,
        zaman
      };
    });

    // tehdit seviye dagilimi
    const dagilimRows = await knex('tehdit_kayitlari')
      .where({ kullanici_id: kullaniciId })
      .groupBy('tehdit_seviyesi')
      .select('tehdit_seviyesi')
      .count('id as sayi');

    const tehditDagilim = { kritik: 0, yuksek: 0, orta: 0, dusuk: 0 };
    let toplamDagitim = 0;

    dagilimRows.forEach(satir => {
      const seviye = satir.tehdit_seviyesi;
      const sayi = parseInt(satir.sayi || 0);
      if (seviye === 'kritik') {
        tehditDagilim.kritik += sayi;
        toplamDagitim += sayi;
      } else if (seviye === 'yüksek') {
        tehditDagilim.yuksek += sayi;
        toplamDagitim += sayi;
      } else if (seviye === 'orta') {
        tehditDagilim.orta += sayi;
        toplamDagitim += sayi;
      } else if (seviye === 'düşük' || seviye === 'güvenli') {
        tehditDagilim.dusuk += sayi;
        toplamDagitim += sayi;
      }
    });

    if (toplamDagitim > 0) {
      tehditDagilim.kritik = Math.round((tehditDagilim.kritik / toplamDagitim) * 100);
      tehditDagilim.yuksek = Math.round((tehditDagilim.yuksek / toplamDagitim) * 100);
      tehditDagilim.orta = Math.round((tehditDagilim.orta / toplamDagitim) * 100);
      tehditDagilim.dusuk = Math.round((tehditDagilim.dusuk / toplamDagitim) * 100);
    }

    // aktif arac sayisi
    let aktifAraclar = 0;
    try {
      const modulesDir = path.join(__dirname, '../yapay_zeka/moduller');
      const files = fs.readdirSync(modulesDir);
      aktifAraclar = files.filter(f => f.endsWith('.py') && f !== 'ornek_modul.py' && f !== '__init__.py').length;
    } catch (err) {
      aktifAraclar = 10;
    }

    return {
      toplamTarama,
      taramaDegisim,
      tespitEdilenTehdit: toplamTehdit,
      tehditDegisim,
      kritikTehdit,
      toplamSohbet,
      guvenlikPuani,
      guvenlikSeviyesi: guvenlikPuani >= 80 ? 'iyi' : guvenlikPuani >= 50 ? 'orta' : 'zayıf',
      sonTehditler,
      tehditDagilim,
      aktifAraclar
    };
  }
}

module.exports = new KullaniciServis();
