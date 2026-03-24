const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: 'postgres://postgres.kjjbrqgqjbtiejihtnvs:qXVs0cyzwnlOMGa5@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected.');

  // Full schema reset: drop and recreate events so the schema is clean
  await client.query(`DROP TABLE IF EXISTS public.events`);
  await client.query(`
    CREATE TABLE public.events (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      workspace_id text NOT NULL DEFAULT 'default',
      event_type text NOT NULL,
      step text NOT NULL,
      field text,
      session_id text NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb,
      timestamp timestamp with time zone DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id);
    CREATE INDEX IF NOT EXISTS idx_events_step    ON public.events(step);
    CREATE INDEX IF NOT EXISTS idx_events_workspace_id ON public.events(workspace_id);
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for now" ON public.events;
    CREATE POLICY "Allow all for now" ON public.events FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('Events table recreated cleanly.');

  // Realistic funnel: 120 → 90 → 62 → 35 unique sessions per step
  const stepConfig = [
    { step: 'step-1', count: 120 },
    { step: 'step-2', count: 90  },
    { step: 'step-3', count: 62  },
    { step: 'step-4', count: 35  },
  ];

  const rows = [];
  const TOTAL_USERS = 120;
  const now = Date.now();

  for (let i = 0; i < TOTAL_USERS; i++) {
    const sid = `sess_prod_${String(i).padStart(3, '0')}`;
    const device = i % 3 === 0 ? 'mobile' : 'desktop';
    const startTime = now - Math.random() * 3 * 3600000; // Random start in last 3h

    // Everyone does Step 1
    rows.push(['default', 'page_view', 'step-1', null, sid, JSON.stringify({ device }), new Date(startTime).toISOString()]);

    // 90/120 do Step 2
    if (i < 90) {
      const t2 = startTime + 30000 + Math.random() * 60000; // +30-90s
      rows.push(['default', 'page_view', 'step-2', null, sid, JSON.stringify({ device }), new Date(t2).toISOString()]);

      // 62/120 do Step 3
      if (i < 62) {
        const t3 = t2 + 45000 + Math.random() * 90000; // +45-135s
        rows.push(['default', 'page_view', 'step-3', null, sid, JSON.stringify({ device }), new Date(t3).toISOString()]);

        // Friction events for some users on Step 3
        if (i % 5 === 0) {
          rows.push(['default', 'api_failure', 'step-3', 'otp_input', sid, JSON.stringify({ error: 'OTP timeout', device }), new Date(t3 + 5000).toISOString()]);
        }

        // 35/120 do Step 4 (Complete)
        if (i < 35) {
          const t4 = t3 + 20000 + Math.random() * 40000; // +20-60s
          rows.push(['default', 'page_view', 'step-4', null, sid, JSON.stringify({ device }), new Date(t4).toISOString()]);
        }
      }
    }
  }

  // Insert in batches
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const values = chunk
      .map((_, j) => {
        const base = j * 7;
        return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}::jsonb, $$base+7)`;
      })
      .join(', ');
    
    // Wait, the $base+7 escaped wrong above. Fixing manually:
    const valuesCorrected = chunk
      .map((_, j) => {
        const base = j * 7;
        return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}::jsonb, $${base+7})`;
      })
      .join(', ');

    const flat = chunk.flat();
    await client.query(
      `INSERT INTO public.events (workspace_id, event_type, step, field, session_id, metadata, timestamp) VALUES ${valuesCorrected}`,
      flat
    );
  }

  console.log(`Inserted ${rows.length} events.`);

  // Verify
  for (const { step } of stepConfig) {
    const { rows: r } = await client.query(
      `SELECT COUNT(*) FROM public.events WHERE step = $1 AND event_type = 'page_view'`,
      [step]
    );
    console.log(`  ${step}: ${r[0].count} page_view events`);
  }

  await client.end();
  console.log('Done.');
}

run().catch(err => { console.error(err.message); client.end(); process.exit(1); });
