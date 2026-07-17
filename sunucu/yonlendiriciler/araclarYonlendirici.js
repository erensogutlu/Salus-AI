const express = require('express');
const { araciCalistir } = require('../denetleyiciler/araclarDenetleyici');
const yetkilendirmeAraci = require('../araclar/yetkilendirmeAraci'); // auth middleware

const yonlendirici = express.Router();

// tüm araç rotaları yetki gerektirmelidir
yonlendirici.use(yetkilendirmeAraci);

yonlendirici.post('/calistir', araciCalistir);

module.exports = yonlendirici;
