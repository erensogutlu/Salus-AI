const kullaniciServis = require('../servisler/kullaniciServis');

// profil güncelle
const profilGuncelle = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;
    const { tam_ad, profil_resmi } = istek.body;

    if (!tam_ad && !profil_resmi) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'güncellenecek en az bir alan gereklidir (tam_ad veya profil_resmi)'
      });
    }

    const guncellenenKullanici = await kullaniciServis.profilGuncelle(kullaniciId, {
      tam_ad,
      profil_resmi
    });

    yanit.status(200).json({
      basarili: true,
      mesaj: 'profil başarıyla güncellendi',
      kullanici: guncellenenKullanici
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// şifre değiştir
const sifreDegistir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;
    const { mevcutSifre, yeniSifre } = istek.body;
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

    await kullaniciServis.sifreDegistir(kullaniciId, mevcutSifre, yeniSifre, ip);

    yanit.status(200).json({
      basarili: true,
      mesaj: 'şifre başarıyla değiştirildi'
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// hesabı sil
const hesapSil = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

    await kullaniciServis.hesapSil(kullaniciId, ip);

    yanit.status(200).json({
      basarili: true,
      mesaj: 'hesap başarıyla silindi'
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// panel (dashboard) verisi getir (knex ve optimize edilmiş sorgular ile)
const panelVerisi = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;
    const veri = await kullaniciServis.panelVerisiGetir(kullaniciId);
    yanit.status(200).json({
      basarili: true,
      veri
    });
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = { profilGuncelle, sifreDegistir, panelVerisi, hesapSil };
