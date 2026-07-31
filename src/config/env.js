import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  postgresConnectionString: process.env.DATABASE_URL || process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/luralink',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_3c3227f6386373e4ab706cdf70a0a4ff02b6a8a0',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_5e3932f6d50ed9d7710d43524ccf1c3d5d2b4db2'
};

