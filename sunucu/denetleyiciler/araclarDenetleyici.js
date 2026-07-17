const { spawn } = require('child_process');
const path = require('path');
const cacheYonetici = require('../araclar/cacheYonetici');
const { hedefDogrula } = require('../araclar/guvenlikAraci');

// güvenli python çalıştırıcı (spawn ile - command injection koruması)
const pythonCalistir = (scriptYolu, arglar = []) => {
  return new Promise((resolve, reject) => {
    const islem = spawn('python', [scriptYolu, ...arglar], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      timeout: 60000 // subdomain gibi uzun süreçler için 60 saniyeye çıkarıldı
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

const araciCalistir = async (istek, yanit, sonraki) => {
  try {
    const { aracTipi, veri } = istek.body;

    if (!aracTipi || !veri) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'Araç tipi veya veri eksik.'
      });
    }

    // girdi uzunlugu kontrolu (dos korumasi)
    if (veri.length > 2000) {
      return yanit.status(400).json({
        basarili: false,
        mesaj: 'veri en fazla 2000 karakter olabilir'
      });
    }

    // ssrf korumasi gerektiren araclar
    let temizVeri = veri.trim().toLowerCase();
    const hostGerektirenAraclar = ['headerAnalizi', 'ipSorgu', 'subdomainBulucu', 'dnsSorgulayici', 'whoisAnalizi'];
    if (hostGerektirenAraclar.includes(aracTipi)) {
      const dogrulama = await hedefDogrula(veri);
      if (!dogrulama.gecerli) {
        return yanit.status(400).json({
          basarili: false,
          mesaj: dogrulama.hata
        });
      }
      temizVeri = dogrulama.temizHedef;
    }

    // önbellek (cache) kontrolü (ağ tarama ve ıp sorgulamada performansı uçurur)
    const cacheAnahtari = `arac:${aracTipi}:${temizVeri}`;
    
    const cachedData = await cacheYonetici.get(cacheAnahtari);
    if (cachedData) {
      console.log(`[CACHE HIT] Yanıt önbellekten getirildi: ${cacheAnahtari}`);
      return yanit.status(200).json(cachedData);
    }

    // ilgili aracın python modülünü tetikleyecek komut metni
    let pythonKomutMetni = '';
    
    switch (aracTipi) {
      case 'sifreAnaliz':
        pythonKomutMetni = `şifre analiz ${veri}`;
        break;
      case 'sifreUretici':
        pythonKomutMetni = `şifre üret ${veri}`;
        break;
      case 'hashTanimlayici':
        pythonKomutMetni = `hash tanımla ${veri}`;
        break;
      case 'headerAnalizi':
        pythonKomutMetni = `site analiz ${temizVeri}`;
        break;
      case 'ipSorgu':
        pythonKomutMetni = `ip sorgula ${temizVeri}`;
        break;
      case 'base64Araci':
        pythonKomutMetni = `${veri}`;
        break;
      case 'subdomainBulucu':
        pythonKomutMetni = `subdomain ${temizVeri}`;
        break;
      case 'dnsSorgulayici':
        pythonKomutMetni = `dns sorgula ${temizVeri}`;
        break;
      case 'whoisAnalizi':
        pythonKomutMetni = `whois ${temizVeri}`;
        break;
      case 'cveAraci':
        pythonKomutMetni = `cve ${veri}`;
        break;
      default:
        return yanit.status(400).json({
          basarili: false,
          mesaj: 'Geçersiz araç tipi.'
        });
    }

    const pythonScriptYolu = path.join(__dirname, '../yapay_zeka/python_yoneticisi.py');
    const argData = {
      mesaj: pythonKomutMetni
    };
    
    const base64Data = Buffer.from(JSON.stringify(argData)).toString('base64');
    const stdout = await pythonCalistir(pythonScriptYolu, [base64Data]);
    
    let islendi = false;
    let sonucMarkdown = '';
    
    try {
      const sonuc = JSON.parse(stdout.trim());
      if (sonuc && sonuc.handled) {
        islendi = true;
        sonucMarkdown = sonuc.response;
      } else {
        sonucMarkdown = 'Araç veriyi işleyemedi.';
      }
    } catch (e) {
      console.error('Python çıktısı ayrıştırılamadı:', stdout);
      throw new Error('Python modül çıktısı geçersiz.');
    }

    const responseData = {
      basarili: true,
      islendi: islendi,
      sonuc: sonucMarkdown
    };

    // işlem başarılıysa sonucu 12 saat (43200 saniye) boyunca önbelleğe al
    if (islendi) {
      await cacheYonetici.set(cacheAnahtari, responseData, 43200);
    }

    yanit.status(200).json(responseData);

  } catch (hata) {
    console.error('Araç çalıştırma hatası:', hata.message);
    yanit.status(500).json({
      basarili: false,
      mesaj: 'Araç çalıştırılırken bir sunucu hatası oluştu.'
    });
  }
};

module.exports = { araciCalistir };
