const hataYonetici = (hata, istek, yanit, sonraki) => {
  // hatayı konsola yazdır
  console.error('sunucu hatası:', {
    mesaj: hata.message,
    yigin: hata.stack,
    yol: istek.path,
    metod: istek.method,
    zaman: new Date().toISOString()
  });

  // durum kodunu belirle
  const durumKodu = hata.durumKodu || hata.statusCode || 500;

  // doğrulama hatası
  if (hata.name === 'ValidationError') {
    return yanit.status(400).json({
      basarili: false,
      mesaj: 'doğrulama hatası',
      detaylar: hata.message
    });
  }

  // veritabanı benzersizlik hatası
  if (hata.code === '23505') {
    return yanit.status(409).json({
      basarili: false,
      mesaj: 'bu kayıt zaten mevcut'
    });
  }

  // veritabanı yabancı anahtar hatası
  if (hata.code === '23503') {
    return yanit.status(400).json({
      basarili: false,
      mesaj: 'ilişkili kayıt bulunamadı'
    });
  }

  // json ayrıştırma hatası
  if (hata.type === 'entity.parse.failed') {
    return yanit.status(400).json({
      basarili: false,
      mesaj: 'geçersiz json formatı'
    });
  }

  // genel hata yanıtı
  yanit.status(durumKodu).json({
    basarili: false,
    mesaj: durumKodu === 500 ? 'sunucu içi hata oluştu' : hata.message
  });
};

module.exports = hataYonetici;
