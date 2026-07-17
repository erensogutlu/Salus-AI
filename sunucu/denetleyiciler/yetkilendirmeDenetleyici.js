const kullaniciServis = require('../servisler/kullaniciServis');

// kayit ol
const kayitOl = async (istek, yanit, sonraki) => {
  try {
    const { kullanici_adi, eposta, sifre, tam_ad } = istek.body;
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

    const { kullanici, jeton } = await kullaniciServis.kayitOl({
      kullanici_adi,
      eposta,
      sifre,
      tam_ad
    }, ip);

    yanit.status(201).json({
      basarili: true,
      mesaj: 'kullanıcı başarıyla kaydedildi',
      jeton,
      kullanici
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// giris yap
const girisYap = async (istek, yanit, sonraki) => {
  try {
    const { eposta, sifre } = istek.body;
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;

    const { kullanici, jeton } = await kullaniciServis.girisYap(eposta, sifre, ip);

    yanit.status(200).json({
      basarili: true,
      mesaj: 'giriş başarılı',
      jeton,
      kullanici
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// profil getir
const profilGetir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;
    const kullanici = await kullaniciServis.profilGetir(kullaniciId);

    yanit.status(200).json({
      basarili: true,
      kullanici
    });
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = { kayitOl, girisYap, profilGetir };
