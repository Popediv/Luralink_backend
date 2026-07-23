const { pool } = require('../src/config/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Seed data placeholder executed');
  } finally {
    client.release();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
