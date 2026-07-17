const { Pool } = require('pg');
const Knex = require('knex');
require('dotenv').config();

let dbUrl = process.env.VERITABANI_URL;
if (dbUrl && !dbUrl.includes('uselibpqcompat=')) {
  if (dbUrl.includes('sslmode=require')) {
    dbUrl = dbUrl.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');
  } else if (dbUrl.includes('sslmode=prefer')) {
    dbUrl = dbUrl.replace('sslmode=prefer', 'sslmode=prefer&uselibpqcompat=true');
  } else if (dbUrl.includes('sslmode=verify-ca')) {
    dbUrl = dbUrl.replace('sslmode=verify-ca', 'sslmode=verify-ca&uselibpqcompat=true');
  }
}

// postgresql ham bağlantı havuzu (geriye dönük uyumluluk için korunmuştur)
const havuz = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// knex query builder örneği (yeni veritabanı işlemleri için ihraç edilir)
const knex = Knex({
  client: 'pg',
  connection: {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10,
    propagateCreateError: false
  }
});

havuz.on('connect', () => {
  console.log('PostgreSQL veritabanı bağlantısı başarılı (Pool)');
});

havuz.on('error', (hata) => {
  console.error('Veritabanı bağlantı havuzu hatası:', hata.message);
});

// knex migrations ve veritabanı hazırlığı
const tablolariOlustur = async () => {
  try {
    console.log('Knex veritabanı göçleri (migrations) başlatılıyor...');
    
    // knex tabanlı şema güncellemelerini çalıştırır
    await knex.migrate.latest({
      directory: './yapilandirma/migrations'
    });
    
    console.log('Veritabanı tabloları ve indeksleri hazır');

    // örnek test hesaplarının kontrolü ve oluşturulması (seeding)
    const bcrypt = require('bcryptjs');
    const sifreHash = await bcrypt.hash('salus123', 12);
    const adminSifreHash = await bcrypt.hash('Salus#AdminSecured*2026', 12);

    await knex('kullanicilar')
      .insert([
        { 
          kullanici_adi: 'admin', 
          eposta: 'admin@salus.ai', 
          sifre_hash: adminSifreHash, 
          tam_ad: 'Sistem Yöneticisi', 
          profil_resmi: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          rol: 'admin'
        },
        { 
          kullanici_adi: 'deneme', 
          eposta: 'deneme@salus.ai', 
          sifre_hash: sifreHash, 
          tam_ad: 'Salus Test Kullanıcısı', 
          profil_resmi: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' 
        }
      ])
      .onConflict('kullanici_adi')
      .ignore();

    console.log('Örnek analist ve test hesapları hazırlandı');
  } catch (hata) {
    console.error('Veritabanı hazırlık aşamasında kritik hata:', hata.message);
    throw hata;
  }
};

module.exports = { havuz, knex, tablolariOlustur };
