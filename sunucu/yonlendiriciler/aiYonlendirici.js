const express = require('express');
const yonlendirici = express.Router();
const { mesajGonder, gecmisGetir, sohbetSil } = require('../denetleyiciler/aiDenetleyici');
const { yetkilendirmeAraci, istegeBagliYetkilendirme } = require('../araclar/yetkilendirmeAraci');

// mesaj gönder - post /api/ai/mesaj (misafirler de soru sorabilir)
yonlendirici.post('/mesaj', istegeBagliYetkilendirme, mesajGonder);

// sohbet geçmişini getir - get /api/ai/gecmis
yonlendirici.get('/gecmis', istegeBagliYetkilendirme, gecmisGetir);

// sohbet mesajını sil - delete /api/ai/sohbet/:id (korumalı)
yonlendirici.delete('/sohbet/:id', yetkilendirmeAraci, sohbetSil);

module.exports = yonlendirici;

