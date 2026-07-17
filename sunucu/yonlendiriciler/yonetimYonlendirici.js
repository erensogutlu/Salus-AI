const express = require('express');
const yonlendirici = express.Router();
const {
  kullanicilariListele,
  kullaniciGuncelle,
  kullaniciSil,
  sistemSagligi
} = require('../denetleyiciler/yonetimDenetleyici');

const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci');
const adminYetkisiAraci = require('../araclar/adminYetkisiAraci');

// korumali rotalar
yonlendirici.use(yetkilendirmeAraci);
yonlendirici.use(adminYetkisiAraci);

// kullanici islemleri
yonlendirici.get('/kullanicilar', kullanicilariListele);
yonlendirici.put('/kullanicilar/:id', kullaniciGuncelle);
yonlendirici.delete('/kullanicilar/:id', kullaniciSil);

// sistem sagligi
yonlendirici.get('/saglik', sistemSagligi);

module.exports = yonlendirici;
