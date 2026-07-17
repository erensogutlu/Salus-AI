exports.up = async function(knex) {
  const hasKullanicilar = await knex.schema.hasTable('kullanicilar');
  if (!hasKullanicilar) {
    await knex.schema.createTable('kullanicilar', table => {
      table.increments('id').primary();
      table.string('kullanici_adi', 50).unique().notNullable();
      table.string('eposta', 100).unique().notNullable();
      table.string('sifre_hash', 255).notNullable();
      table.string('tam_ad', 100);
      table.string('profil_resmi', 255);
      table.string('rol', 20).defaultTo('user');
      table.timestamp('son_giris');
      table.timestamp('olusturulma_tarihi').defaultTo(knex.fn.now());
    });
  }

  const hasTehditKayitlari = await knex.schema.hasTable('tehdit_kayitlari');
  if (!hasTehditKayitlari) {
    await knex.schema.createTable('tehdit_kayitlari', table => {
      table.increments('id').primary();
      table.integer('kullanici_id').unsigned().references('id').inTable('kullanicilar').onDelete('CASCADE');
      table.string('hedef', 255).notNullable();
      table.string('tehdit_tipi', 100).notNullable();
      table.string('tehdit_seviyesi', 50).notNullable();
      table.jsonb('detaylar').notNullable();
      table.timestamp('olusturulma_tarihi').defaultTo(knex.fn.now());
    });
  }

  const hasTaramaSonuclari = await knex.schema.hasTable('tarama_sonuclari');
  if (!hasTaramaSonuclari) {
    await knex.schema.createTable('tarama_sonuclari', table => {
      table.increments('id').primary();
      table.integer('kullanici_id').unsigned().references('id').inTable('kullanicilar').onDelete('CASCADE');
      table.string('hedef_ip', 50).notNullable();
      table.jsonb('acik_portlar').notNullable();
      table.jsonb('zafiyetler').notNullable();
      table.timestamp('tarama_tarihi').defaultTo(knex.fn.now());
    });
  }

  const hasSohbetGecmisi = await knex.schema.hasTable('sohbet_gecmisi');
  if (!hasSohbetGecmisi) {
    await knex.schema.createTable('sohbet_gecmisi', table => {
      table.increments('id').primary();
      table.integer('kullanici_id').unsigned().references('id').inTable('kullanicilar').onDelete('CASCADE');
      table.string('oturum_id', 100);
      table.text('mesaj').notNullable();
      table.text('yanit').notNullable();
      table.timestamp('olusturulma_tarihi').defaultTo(knex.fn.now());
    });
  }

  const hasGuvenlikGunlukleri = await knex.schema.hasTable('guvenlik_gunlukleri');
  if (!hasGuvenlikGunlukleri) {
    await knex.schema.createTable('guvenlik_gunlukleri', table => {
      table.increments('id').primary();
      table.integer('kullanici_id').unsigned().nullable().references('id').inTable('kullanicilar').onDelete('SET NULL');
      table.string('olay_tipi', 100).notNullable();
      table.string('hedef', 255);
      table.text('detay');
      table.string('ip_adresi', 50);
      table.timestamp('olusturulma_tarihi').defaultTo(knex.fn.now());
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('guvenlik_gunlukleri')
    .dropTableIfExists('sohbet_gecmisi')
    .dropTableIfExists('tarama_sonuclari')
    .dropTableIfExists('tehdit_kayitlari')
    .dropTableIfExists('kullanicilar');
};
