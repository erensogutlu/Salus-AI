const jwt = require('jsonwebtoken');

// yetkilendirme ara katmanı - zorunlu bearer token doğrulama
const yetkilendirmeAraci = (istek, yanit, sonraki) => {
  try {
    const yetkilendirmeBasligi = istek.headers.authorization;

    if (!yetkilendirmeBasligi) {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'erişim reddedildi, jeton bulunamadı'
      });
    }

    if (!yetkilendirmeBasligi.startsWith('Bearer ')) {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'geçersiz jeton formatı'
      });
    }

    const jeton = yetkilendirmeBasligi.split(' ')[1];
    const cozumlenmisVeri = jwt.verify(jeton, process.env.JWT_GIZLI_ANAHTAR);

    istek.kullanici = {
      kullanici_id: cozumlenmisVeri.kullanici_id,
      kullanici_adi: cozumlenmisVeri.kullanici_adi,
      eposta: cozumlenmisVeri.eposta,
      rol: cozumlenmisVeri.rol
    };

    sonraki();
  } catch (hata) {
    if (hata.name === 'TokenExpiredError') {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'jeton süresi dolmuş, lütfen tekrar giriş yapın'
      });
    }

    return yanit.status(401).json({
      basarili: false,
      mesaj: 'geçersiz jeton'
    });
  }
};

// isteğe bağlı yetkilendirme ara katmanı - token varsa kullanıcıyı ekler, yoksa misafir olarak devam ettirir
const istegeBagliYetkilendirme = (istek, yanit, sonraki) => {
  try {
    const yetkilendirmeBasligi = istek.headers.authorization;

    if (!yetkilendirmeBasligi || !yetkilendirmeBasligi.startsWith('Bearer ')) {
      istek.kullanici = null;
      return sonraki();
    }

    const jeton = yetkilendirmeBasligi.split(' ')[1];
    if (!jeton) {
      istek.kullanici = null;
      return sonraki();
    }

    const cozumlenmisVeri = jwt.verify(jeton, process.env.JWT_GIZLI_ANAHTAR);
    istek.kullanici = {
      kullanici_id: cozumlenmisVeri.kullanici_id,
      kullanici_adi: cozumlenmisVeri.kullanici_adi,
      eposta: cozumlenmisVeri.eposta,
      rol: cozumlenmisVeri.rol
    };
  } catch (hata) {
    istek.kullanici = null;
  }
  sonraki();
};

module.exports = yetkilendirmeAraci;
module.exports.yetkilendirmeAraci = yetkilendirmeAraci;
module.exports.istegeBagliYetkilendirme = istegeBagliYetkilendirme;

