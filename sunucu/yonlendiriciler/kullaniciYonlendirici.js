const express = require('express');
const yonlendirici = express.Router();
const { profilGuncelle, sifreDegistir, panelVerisi, hesapSil } = require('../denetleyiciler/kullaniciDenetleyici');
const { yetkilendirmeAraci, istegeBagliYetkilendirme } = require('../araclar/yetkilendirmeAraci');

// panel verisi getir - get /api/kullanici/panel (misafirler için de genel panel verisi sağlar)
yonlendirici.get('/panel', istegeBagliYetkilendirme, panelVerisi);

// profil güncelle - put /api/kullanici/profil (korumalı)
yonlendirici.put('/profil', yetkilendirmeAraci, profilGuncelle);

// şifre değiştir - put /api/kullanici/sifre (korumalı)
yonlendirici.put('/sifre', yetkilendirmeAraci, sifreDegistir);

// hesabı sil - delete /api/kullanici/sil (korumalı)
yonlendirici.delete('/sil', yetkilendirmeAraci, hesapSil);

module.exports = yonlendirici;

