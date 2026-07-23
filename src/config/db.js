const { Pool } = require('pg');
const { postgresConnectionString } = require('./env');

const pool = new Pool({
  connectionString: postgresConnectionString
});

async function connectDb() {
  if (!postgresConnectionString) {
    throw new Error('PostgreSQL connection string is not defined');
  }

  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
  console.log('PostgreSQL connected');
}

module.exports = { pool, connectDb };
