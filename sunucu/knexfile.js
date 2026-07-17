require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.VERITABANI_URL,
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
      connectionString: process.env.VERITABANI_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './yapilandirma/migrations',
      tableName: 'knex_migrations'
    }
  }
};
