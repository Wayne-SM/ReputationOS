import { pool } from './index.js';

async function migrate() {
  console.log('🔄 Applying schema migrations to PostgreSQL database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add is_platform_admin to users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 2. Add status to businesses
    await client.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
    `);

    // 3. Create business_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reference VARCHAR(255),
        notes TEXT,
        recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Create indexes on business_payments
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bp_business ON business_payments(business_id);
      CREATE INDEX IF NOT EXISTS idx_bp_business_date ON business_payments(business_id, payment_date);
    `);

    // 5. Safely drop obsolete billing/report tables
    await client.query(`
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS monthly_reports CASCADE;
      DROP TABLE IF EXISTS feedback_responses CASCADE;
    `);

    await client.query('COMMIT');
    console.log('✅ Schema migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
