const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgres://postgres.kjjbrqgqjbtiejihtnvs:qXVs0cyzwnlOMGa5@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected.');

  // Add missing columns and rename for alignment
  console.log('Patching schema...');
  await client.query(`
    -- Patch events table
    ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS workspace_id text DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS event_type text,
    ADD COLUMN IF NOT EXISTS step text,
    ADD COLUMN IF NOT EXISTS field text;

    -- Migration: map old values if they exist
    UPDATE public.events SET event_type = type WHERE event_type IS NULL AND type IS NOT NULL;
    UPDATE public.events SET step = step_id WHERE step IS NULL AND step_id IS NOT NULL;
    UPDATE public.events SET field = field_id WHERE field IS NULL AND field_id IS NOT NULL;

    -- Patch other tables
    ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS workspace_id text DEFAULT 'default';
    ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS workspace_id text DEFAULT 'default';
    ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS workspace_id text DEFAULT 'default';
  `);
  console.log('Schema patched successfully.');

  await client.end();
  console.log('Done.');
}

run().catch(err => {
  console.error(err.message);
  client.end();
  process.exit(1);
});
