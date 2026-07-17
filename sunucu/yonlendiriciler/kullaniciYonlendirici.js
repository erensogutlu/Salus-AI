const express = require('express');
const yonlendirici = express.Router();
const { profilGuncelle, sifreDegistir, panelVerisi , hesapSil } = require('../denetleyiciler/kullaniciDenetleyici');
const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci');

// tüm rotalar korumalıdır
yonlendirici.use(yetkilendirmeAraci);

// profil güncelle - put /api/kullanici/profil
yonlendirici.put('/profil', profilGuncelle);

// şifre değiştir - put /api/kullanici/sifre
yonlendirici.put('/sifre', sifreDegistir);

// hesabı sil - delete /api/kullanici/sil
yonlendirici.delete('/sil', hesapSil);

// panel verisi getir - get /api/kullanici/panel
yonlendirici.get('/panel', panelVerisi);

module.exports = yonlendirici;
