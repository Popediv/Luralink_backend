import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  postgresConnectionString: process.env.DATABASE_URL || process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/luralink',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || ''
};