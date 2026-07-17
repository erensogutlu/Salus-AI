const { havuz } = require('../yapilandirma/veritabani');
const path = require('path');
const { spawn } = require('child_process');
const { siberGuvenlikYanitlari, varsayilanYanit } = require('../yapilandirma/siberGuvenlikSablonlari');

// güvenli python çalıştırıcı
const pythonCalistir = (scriptYolu, arglar = []) => {
  return new Promise((resolve, reject) => {
    const islem = spawn('python', [scriptYolu, ...arglar], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      timeout: 15000 // sohbet için 15 saniye maksimum
    });

    let stdout = '';
    let stderr = '';

    islem.stdout.on('data', (veri) => { stdout += veri.toString('utf8'); });
    islem.stderr.on('data', (veri) => { stderr += veri.toString('utf8'); });

    islem.on('close', (kod) => {
      if (kod === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python çıkış kodu: ${kod}, hata: ${stderr}`));
      }
    });

    islem.on('error', (hata) => {
      reject(hata);
    });
  });
};

// mesaj içeriğine göre uygun yanıtı bul
const yanitBul = (mesaj) => {
  const kucukHarfMesaj = mesaj.toLowerCase();

  // selamlama kontrolü
  const selamlamaKelimeleri = ['merhaba', 'selam', 'hey', 'günaydın', 'iyi günler', 'nasılsın', 'hello', 'hi'];
  const selamlamaMi = selamlamaKelimeleri.some(kelime => kucukHarfMesaj.includes(kelime));

  if (selamlamaMi && kucukHarfMesaj.length < 30) {
    return varsayilanYanit;
  }

  // anahtar kelime eşleştirmesi ile en uygun kategoriyi bul
  let enYuksekEslesmeSayisi = 0;
  let enUygunKategori = null;

  for (const [kategoriAdi, kategoriVerisi] of Object.entries(siberGuvenlikYanitlari)) {
    const eslesmeSayisi = kategoriVerisi.anahtarKelimeler.filter(
      kelime => kucukHarfMesaj.includes(kelime.toLowerCase())
    ).length;

    if (eslesmeSayisi > enYuksekEslesmeSayisi) {
      enYuksekEslesmeSayisi = eslesmeSayisi;
      enUygunKategori = kategoriVerisi;
    }
  }

  // eşleşme bulunduysa yanıt döndür
  if (enUygunKategori && enYuksekEslesmeSayisi > 0) {
    const rastgeleIndeks = Math.floor(Math.random() * enUygunKategori.yanitlar.length);
    return enUygunKategori.yanitlar[rastgeleIndeks];
  }

  // eşleşme bulunamadıysa varsayılan yanıt
  return varsayilanYanit;
};

// mesaj gönder ve ai yanıtı al
const mesajGonder = async (istek, yanit, sonraki) => {
  try {
    const { mesaj, oturumId } = istek.body;
    const kullaniciId = istek.kullanici.kullanici_id;
    const guncelOturumId = oturumId || Date.now().toString();

    // mesaj kontrolü
    if (!mesaj || mesaj.trim().length === 0) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'mesaj içeriği boş olamaz'
      });
    }

    if (mesaj.length > 4000) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'mesaj en fazla 4000 karakter olabilir'
      });
    }

    // ai yanıtını oluştur
    let aiYaniti = '';

    // 1. önce python modüllerine sor (siber araçlar ve lokal uzman sistem)
    try {
      const pythonScriptYolu = path.join(__dirname, '../yapay_zeka/python_yoneticisi.py');
      const argData = { mesaj: mesaj };
      const base64Data = Buffer.from(JSON.stringify(argData)).toString('base64');
      
      const stdout = await pythonCalistir(pythonScriptYolu, [base64Data]);
      const pythonSonuc = JSON.parse(stdout.trim());
      
      if (pythonSonuc && pythonSonuc.handled) {
        aiYaniti = pythonSonuc.response;
        console.log(`[AI SOHBET] İstek Python modülü tarafından işlendi: ${pythonSonuc.modul}`);
      }
    } catch (e) {
      console.warn('Python modül yöneticisi sohbet araması başarısız oldu (LLM API denenecek):', e.message);
    }

    // 2. python modülü işlemediyse, gemini apı'ye sor (fallback)
    if (!aiYaniti) {
      try {
        const geminiApiAnahtari = process.env.GEMINI_API_ANAHTARI;
        if (geminiApiAnahtari) {
          const apiAdresi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiAnahtari}`;
          
          // çok turlu konuşma bağlamı: son 5 mesajı gemini'ye gönder
          let konusmaBaglami = [];
          try {
            const gecmisSorgusu = await havuz.query(
              `SELECT mesaj, yanit FROM sohbet_gecmisi
               WHERE kullanici_id = $1 AND oturum_id = $2
               ORDER BY olusturulma_tarihi DESC LIMIT 5`,
              [kullaniciId, guncelOturumId]
            );
            // eski mesajları kronolojik sıraya çevir
            const gecmisMesajlar = gecmisSorgusu.rows.reverse();
            gecmisMesajlar.forEach(m => {
              konusmaBaglami.push({ role: 'user', parts: [{ text: m.mesaj }] });
              konusmaBaglami.push({ role: 'model', parts: [{ text: m.yanit }] });
            });
          } catch (baglamHatasi) {
            console.warn('Konuşma bağlamı alınamadı:', baglamHatasi.message);
          }

          // mevcut mesajı ekle
          konusmaBaglami.push({ role: 'user', parts: [{ text: mesaj }] });

          const istekGovdesi = {
            systemInstruction: {
              parts: [{
                text: "Sen Salus AI siber güvenlik asistanısın. Siber güvenlik konularında uzmansın. Kullanıcının sorduğu siber güvenlik sorularına profesyonel, detaylı ve Türkçe yanıtlar vermelisin. Yanıtlarında gerekiyorsa markdown formatı kullanabilirsin. Eğer siber güvenlik dışı bir soru sorulursa nazikçe sadece siber güvenlik konularında yardımcı olabileceğini belirt. Yanıtlarında Salus AI platformunun yeteneklerinden bahsedebilirsin."
              }]
            },
            contents: konusmaBaglami,
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 2048
            }
          };

          const apiYanit = await fetch(apiAdresi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(istekGovdesi)
          });

          if (apiYanit.ok) {
            const veri = await apiYanit.json();
            if (veri.candidates?.[0]?.content?.parts?.[0]?.text) {
              aiYaniti = veri.candidates[0].content.parts[0].text;
            }
          } else {
            console.warn('gemini api yanıt hatası:', apiYanit.status, apiYanit.statusText);
          }
        }
      } catch (apiHatasi) {
        console.error('gemini api hatası:', apiHatasi.message);
      }
    } // if (!aiyaniti) sonu

    // api başarısız olduysa veya anahtar yoksa simülasyona dön
    if (!aiYaniti) {
      aiYaniti = yanitBul(mesaj);
    }

    // 24 saatten eski mesajları sil
    await havuz.query(`DELETE FROM sohbet_gecmisi WHERE olusturulma_tarihi < NOW() - INTERVAL '24 hours'`);

    // sohbet geçmişine kaydet
    const kaydedilmisVeri = await havuz.query(
      `INSERT INTO sohbet_gecmisi (kullanici_id, oturum_id, mesaj, yanit)
       VALUES ($1, $2, $3, $4)
       RETURNING id, oturum_id, mesaj, yanit, olusturulma_tarihi`,
      [kullaniciId, guncelOturumId, mesaj.trim(), aiYaniti]
    );

    yanit.status(200).json({
      basarili: true,
      veri: kaydedilmisVeri.rows[0]
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// sohbet geçmişini getir
const gecmisGetir = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.kullanici_id;

    // 24 saatten eski mesajları sil
    await havuz.query(`DELETE FROM sohbet_gecmisi WHERE olusturulma_tarihi < NOW() - INTERVAL '24 hours'`);

    const gecmisSorgusu = await havuz.query(
      `SELECT id, oturum_id, mesaj, yanit, olusturulma_tarihi
       FROM sohbet_gecmisi
       WHERE kullanici_id = $1
       ORDER BY olusturulma_tarihi DESC`,
      [kullaniciId]
    );

    yanit.status(200).json({
      basarili: true,
      toplam: gecmisSorgusu.rows.length,
      veri: gecmisSorgusu.rows
    });
  } catch (hata) {
    sonraki(hata);
  }
};

// sohbet mesajını sil
const sohbetSil = async (istek, yanit, sonraki) => {
  try {
    const { id } = istek.params;
    const kullaniciId = istek.kullanici.kullanici_id;

    // mesajın kullanıcıya ait olduğunu doğrula ve oturumdaki tüm mesajları sil
    let silmeSorgusu;
    if (id === 'null' || id == null) {
      silmeSorgusu = await havuz.query(
        'DELETE FROM sohbet_gecmisi WHERE oturum_id IS NULL AND kullanici_id = $1 RETURNING id',
        [kullaniciId]
      );
    } else {
      silmeSorgusu = await havuz.query(
        'DELETE FROM sohbet_gecmisi WHERE oturum_id = $1 AND kullanici_id = $2 RETURNING id',
        [id, kullaniciId]
      );
    }

    if (silmeSorgusu.rows.length === 0) {
      return yanit.status(404).json({
        basarili: false,
        mesaj: 'sohbet mesajı bulunamadı veya size ait değil'
      });
    }

    yanit.status(200).json({
      basarili: true,
      mesaj: 'sohbet mesajı başarıyla silindi'
    });
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = { mesajGonder, gecmisGetir, sohbetSil };
