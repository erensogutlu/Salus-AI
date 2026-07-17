const { knex } = require('../yapilandirma/veritabani');

class KullaniciDepo {
  async idIleBul(id) {
    return knex('kullanicilar').where({ id }).first();
  }

  async epostaIleBul(eposta) {
    return knex('kullanicilar').where({ eposta }).first();
  }

  async kullaniciAdiIleBul(kullaniciAdi) {
    return knex('kullanicilar').where({ kullanici_adi: kullaniciAdi }).first();
  }

  async epostaVeyaKullaniciAdiVarMi(kullaniciAdi, eposta) {
    const kayit = await knex('kullanicilar')
      .where({ kullanici_adi: kullaniciAdi })
      .orWhere({ eposta })
      .select('id')
      .first();
    return !!kayit;
  }

  async ekle(kullaniciVerisi) {
    const [yeniKullanici] = await knex('kullanicilar')
      .insert({
        kullanici_adi: kullaniciVerisi.kullanici_adi,
        eposta: kullaniciVerisi.eposta,
        sifre_hash: kullaniciVerisi.sifre_hash,
        tam_ad: kullaniciVerisi.tam_ad
      })
      .returning(['id', 'kullanici_adi', 'eposta', 'tam_ad', 'olusturulma_tarihi']);
    return yeniKullanici;
  }

  async sonGirisGuncelle(id) {
    return knex('kullanicilar')
      .where({ id })
      .update({ son_giris: knex.fn.now() });
  }

  async profilGuncelle(id, profilVerisi) {
    const [guncellenen] = await knex('kullanicilar')
      .where({ id })
      .update({
        tam_ad: profilVerisi.tam_ad,
        profil_resmi: profilVerisi.profil_resmi
      })
      .returning(['id', 'kullanici_adi', 'eposta', 'tam_ad', 'profil_resmi']);
    return guncellenen;
  }

  async sifreGuncelle(id, yeniSifreHash) {
    return knex('kullanicilar')
      .where({ id })
      .update({ sifre_hash: yeniSifreHash });
  }

  async sil(id) {
    return knex('kullanicilar').where({ id }).delete();
  }
}

module.exports = new KullaniciDepo();
