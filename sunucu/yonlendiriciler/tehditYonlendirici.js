const express = require('express');
const yonlendirici = express.Router();
const { hedefAnaliz, kayitlariGetir, istatistikGetir, taramalariGetir, kayitSil, logAnaliz } = require('../denetleyiciler/tehditDenetleyici');
const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci');

// tüm rotalar korumalıdır
yonlendirici.use(yetkilendirmeAraci);

// hedef analiz et - post /api/tehdit/analiz
yonlendirici.post('/analiz', hedefAnaliz);

// log analiz et - post /api/tehdit/log-analiz
yonlendirici.post('/log-analiz', logAnaliz);

// tehdit kayıtlarını getir - get /api/tehdit/kayitlar
yonlendirici.get('/kayitlar', kayitlariGetir);

// tehdit istatistiklerini getir - get /api/tehdit/istatistik
yonlendirici.get('/istatistik', istatistikGetir);

// tarama kayıtlarını getir - get /api/tehdit/taramalar
yonlendirici.get('/taramalar', taramalariGetir);

// tehdit kaydını sil - delete /api/tehdit/kayitlar/:id
yonlendirici.delete('/kayitlar/:id', kayitSil);

module.exports = yonlendirici;
