const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Brute force SSL bypass for migration
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgres://postgres.kjjbrqgqjbtiejihtnvs:qXVs0cyzwnlOMGa5@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function migrate() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database (SSL bypass active)...');
    await client.connect();
    console.log('Connected successfully.');

    // Write a temporary schema file from the content if we can't find it
    const schemaContent = `-- Create tables for Drop-off Detection Dashboard

-- 1. Events table for ingestion
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  step_id text not null,
  field_id text,
  session_id text not null,
  metadata jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default now()
);

-- 2. Funnels table
create table if not exists public.funnels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  steps jsonb not null,
  created_at timestamp with time zone default now()
);

-- 3. Insights table
create table if not exists public.insights (
  id uuid default gen_random_uuid() primary key,
  reason text not null,
  description text,
  impact_score float8,
  potential_lift text,
  status text,
  effort text,
  category text,
  created_at timestamp with time zone default now()
);

-- 4. Alerts table
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  severity text,
  status text,
  type text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_events_session_id on public.events(session_id);
create index if not exists idx_events_step_id on public.events(step_id);
`;

    console.log('Executing migration statements...');
    await client.query(schemaContent);
    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
