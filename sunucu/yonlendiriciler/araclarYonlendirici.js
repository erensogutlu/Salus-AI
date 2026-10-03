const express = require('express');
const { araciCalistir } = require('../denetleyiciler/araclarDenetleyici');
const { istegeBagliYetkilendirme } = require('../araclar/yetkilendirmeAraci');

const yonlendirici = express.Router();

// araçlar kayıt/giriş olmadan herkese açıktır
yonlendirici.use(istegeBagliYetkilendirme);

yonlendirici.post('/calistir', araciCalistir);

module.exports = yonlendirici;

