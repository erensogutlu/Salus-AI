const { knex } = require('../yapilandirma/veritabani');
const { guvenlikKaydet } = require('../araclar/guvenlikAraci');
const yonetimServis = require('../servisler/yonetimServis');

// kullanicilari listele
const kullanicilariListele = async (istek, yanit, sonraki) => {
  try {
    const kullanicilar = await knex('kullanicilar')
      .whereNot({ kullanici_adi: 'admin' })
      .select('id', 'kullanici_adi', 'eposta', 'tam_ad', 'profil_resmi', 'olusturulma_tarihi', 'son_giris', 'rol')
      .orderBy('id', 'asc');

    yanit.status(200).json({
      basarili: true,
      kullanicilar
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// kullanici guncelle
const kullaniciGuncelle = async (istek, yanit, sonraki) => {
  try {
    const { id } = istek.params;
    const { kullanici_adi, eposta, tam_ad, rol } = istek.body;

    if (!kullanici_adi || !eposta) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'kullanıcı adı ve e-posta zorunludur'
      });
    }

    // ana yoneticiyi koru
    const hedefKullanici = await knex('kullanicilar').where({ id }).first();
    if (hedefKullanici && hedefKullanici.kullanici_adi === 'admin') {
      return yanit.status(403).json({
        basarili: false,
        mesaj: 'ana yönetici hesabı değiştirilemez'
      });
    }

    // eposta ve kullanici adi kontrolu
    const varMi = await knex('kullanicilar')
      .where((builder) => builder.where({ kullanici_adi }).orWhere({ eposta }))
      .andWhereNot({ id })
      .first();

    if (varMi) {
      return yanit.status(409).json({
        basarili: false,
        mesaj: 'bu kullanıcı adı veya e-posta zaten başka bir kullanıcı tarafından kullanılıyor'
      });
    }

    // guncelle
    const guncellenenSayisi = await knex('kullanicilar')
      .where({ id })
      .update({
        kullanici_adi,
        eposta,
        tam_ad,
        rol,
      });

    if (guncellenenSayisi === 0) {
      return yanit.status(404).json({
        basarili: false,
        mesaj: 'kullanıcı bulunamadı'
      });
    }

    // guvenlik logu
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;
    await guvenlikKaydet(istek.kullanici.kullanici_id, 'admin_user_update', kullanici_adi, `kullanıcı bilgileri admin tarafından güncellendi (rol: ${rol})`, ip);

    const guncellenenKullanici = await knex('kullanicilar')
      .where({ id })
      .select('id', 'kullanici_adi', 'eposta', 'tam_ad', 'rol')
      .first();

    yanit.status(200).json({
      basarili: true,
      mesaj: 'kullanıcı başarıyla güncellendi',
      kullanici: guncellenenKullanici
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// kullanici sil
const kullaniciSil = async (istek, yanit, sonraki) => {
  try {
    const { id } = istek.params;

    // kendini silmeyi engelle
    if (parseInt(id) === istek.kullanici.kullanici_id) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'kendi hesabınızı silemezsiniz'
      });
    }

    // ana yoneticiyi koru
    const hedefKullanici = await knex('kullanicilar').where({ id }).first();
    if (hedefKullanici && hedefKullanici.kullanici_adi === 'admin') {
      return yanit.status(403).json({
        basarili: false,
        mesaj: 'ana yönetici hesabı silinemez'
      });
    }

    const silinenSayisi = await knex('kullanicilar').where({ id }).delete();

    if (silinenSayisi === 0) {
      return yanit.status(404).json({
        basarili: false,
        mesaj: 'kullanıcı bulunamadı'
      });
    }

    // guvenlik logu
    const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;
    await guvenlikKaydet(istek.kullanici.kullanici_id, 'admin_user_delete', hedefKullanici.kullanici_adi, 'kullanıcı admin tarafından silindi', ip);

    yanit.status(200).json({
      basarili: true,
      mesaj: 'kullanıcı başarıyla silindi'
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// sistem sagligi
const sistemSagligi = async (istek, yanit, sonraki) => {
  try {
    const saglikVerisi = await yonetimServis.sistemSagligiGetir();
    yanit.status(200).json({
      basarili: true,
      saglik: saglikVerisi
    });
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = {
  kullanicilariListele,
  kullaniciGuncelle,
  kullaniciSil,
  sistemSagligi
};
