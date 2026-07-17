const express = require('express');
const yonlendirici = express.Router();
const { mesajGonder, gecmisGetir, sohbetSil } = require('../denetleyiciler/aiDenetleyici');
const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci');

// tüm rotalar korumalıdır
yonlendirici.use(yetkilendirmeAraci);

// mesaj gönder - post /api/ai/mesaj
yonlendirici.post('/mesaj', mesajGonder);

// sohbet geçmişini getir - get /api/ai/gecmis
yonlendirici.get('/gecmis', gecmisGetir);

// sohbet mesajını sil - delete /api/ai/sohbet/:id
yonlendirici.delete('/sohbet/:id', sohbetSil);

module.exports = yonlendirici;
