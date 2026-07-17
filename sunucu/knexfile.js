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

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './yapilandirma/migrations',
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './yapilandirma/migrations',
      tableName: 'knex_migrations'
    }
  }
};
