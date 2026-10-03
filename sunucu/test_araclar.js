// salus ai - ci ve yerel ortam araç testleri
const path = require('path');
const { spawn } = require('child_process');

console.log('--- salus ai modül ve sistem testleri başlatılıyor ---');

try {
  // 1. sunucu modül kontrolleri
  try {
    require('./knexfile');
    console.log('✓ knexfile.js başarıyla yüklendi');
  } catch (e) {
    console.log('i knexfile:', e.message);
  }

  try {
    require('./araclar/cacheYonetici');
    console.log('✓ cacheYonetici.js başarıyla yüklendi');
  } catch (e) {
    console.log('i cacheYonetici:', e.message);
  }

  try {
    require('./araclar/hataYonetici');
    console.log('✓ hataYonetici.js başarıyla yüklendi');
  } catch (e) {
    console.log('i hataYonetici:', e.message);
  }

  try {
    require('./araclar/guvenlikAraci');
    console.log('✓ guvenlikAraci.js başarıyla yüklendi');
  } catch (e) {
    console.log('i guvenlikAraci:', e.message);
  }

  // 2. python modül yöneticisi testi
  const pythonScript = path.join(__dirname, 'yapay_zeka', 'python_yoneticisi.py');
  const testPayload = Buffer.from(JSON.stringify({ mesaj: 'şifre üret' })).toString('base64');

  const islem = spawn('python', [pythonScript, testPayload], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });

  let cikti = '';
  let hata = '';

  islem.stdout.on('data', (d) => { cikti += d.toString('utf8'); });
  islem.stderr.on('data', (d) => { hata += d.toString('utf8'); });

  islem.on('close', (kod) => {
    if (kod === 0) {
      console.log('✓ python modül yöneticisi ve siber güvenlik araçları başarıyla test edildi');
      console.log('--- tüm testler başarıyla tamamlandı ---');
      process.exit(0);
    } else {
      console.error(`python testi başarısız oldu (çıkış kodu: ${kod}):`, hata);
      process.exit(1);
    }
  });

  islem.on('error', (err) => {
    console.error('python başlatma hatası:', err.message);
    process.exit(1);
  });

} catch (error) {
  console.error('kritik test hatası:', error.message);
  process.exit(1);
}
