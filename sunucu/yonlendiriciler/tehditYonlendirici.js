const express = require('express');
const yonlendirici = express.Router();
const { hedefAnaliz, kayitlariGetir, istatistikGetir, taramalariGetir, kayitSil, logAnaliz } = require('../denetleyiciler/tehditDenetleyici');
const { yetkilendirmeAraci, istegeBagliYetkilendirme } = require('../araclar/yetkilendirmeAraci');

// hedef analiz et - post /api/tehdit/analiz (misafirler de analiz yapabilir, sadece oturum açanların raporu kaydedilir)
yonlendirici.post('/analiz', istegeBagliYetkilendirme, hedefAnaliz);

// log analiz et - post /api/tehdit/log-analiz (misafirler de analiz yapabilir)
yonlendirici.post('/log-analiz', istegeBagliYetkilendirme, logAnaliz);

// tehdit istatistiklerini getir - get /api/tehdit/istatistik
yonlendirici.get('/istatistik', istegeBagliYetkilendirme, istatistikGetir);

// tehdit kayıtlarını (raporları) getir - get /api/tehdit/kayitlar (korumalı)
yonlendirici.get('/kayitlar', yetkilendirmeAraci, kayitlariGetir);

// tarama kayıtlarını getir - get /api/tehdit/taramalar (korumalı)
yonlendirici.get('/taramalar', yetkilendirmeAraci, taramalariGetir);

// tehdit kaydını sil - delete /api/tehdit/kayitlar/:id (korumalı)
yonlendirici.delete('/kayitlar/:id', yetkilendirmeAraci, kayitSil);

module.exports = yonlendirici;

