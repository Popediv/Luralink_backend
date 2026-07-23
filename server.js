require('dotenv').config();

const app = require('./src/app');
const { connectDb } = require('./src/config/db');

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDb();
  } catch (error) {
    console.warn('MongoDB connection skipped or failed:', error.message);
  }

  app.listen(port, () => {
    console.log(`Luralink backend running on port ${port}`);
  });
}

startServer();
