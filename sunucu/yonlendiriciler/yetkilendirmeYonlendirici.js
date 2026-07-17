const express = require('express');
const yonlendirici = express.Router();
const { kayitOl, girisYap, profilGetir } = require('../denetleyiciler/yetkilendirmeDenetleyici');
const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci');

// kayıt ol - post /api/yetkilendirme/kayit
yonlendirici.post('/kayit', kayitOl);

// giriş yap - post /api/yetkilendirme/giris
yonlendirici.post('/giris', girisYap);

// profil getir - get /api/yetkilendirme/profil (korumalı)
yonlendirici.get('/profil', yetkilendirmeAraci, profilGetir);

module.exports = yonlendirici;
