const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kjjbrqgqjbtiejihtnvs.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqamJycWdxamJ0aWVqaWh0bnZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzNjIyNiwiZXhwIjoyMDg5OTEyMjI2fQ.WIR26_ZPinWo0D72DOyJpS1p8043ffqOgvQBI4ZsXjY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seed() {
  console.log('--- Checking Supabase Tables ---');

  async function tableExists(name) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (error && error.code === '42P01') return false;
    return true;
  }

  const tables = ['events', 'funnels', 'insights', 'alerts'];
  for (const table of tables) {
    const exists = await tableExists(table);
    console.log(`${table}: ${exists ? '✓ Exists' : '✗ Missing'}`);
    if (!exists) {
      console.log(`[STOP] Table ${table} is missing. Please run schema first.`);
      return;
    }
  }

  console.log('\n--- Seeding Data ---');

  // Helper to seed if empty
  async function seedIfEmpty(table, data) {
    const { data: existing, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`Error checking ${table}:`, error.message);
      return;
    }
    if (!existing || existing.length === 0) {
      console.log(`Seeding ${table}...`);
      const { error: insertError } = await supabase.from(table).insert(data);
      if (insertError) console.error(`Insert error for ${table}:`, insertError.message);
    } else {
      console.log(`${table} already has data.`);
    }
  }

  // Funnels
  await seedIfEmpty('funnels', {
    name: 'Signup Flow',
    steps: [
      { stepId: 'step-1', name: 'Email & Password' },
      { stepId: 'step-2', name: 'Personal Details' },
      { stepId: 'step-3', name: 'Phone Verification' },
      { stepId: 'step-4', name: 'Complete' }
    ]
  });

  // Insights
  await seedIfEmpty('insights', [
    { reason: 'Phone OTP delay', description: '68% of failures caused by OTP delay > 5s on Step 3.', impact_score: 8.5, potential_lift: '+8%', status: 'critical', effort: 'low', category: 'Technical' },
    { reason: 'Password rules too strict', description: "Validation errors on 'password' field high on Step 1.", impact_score: 7.2, potential_lift: '+5%', status: 'high', effort: 'medium', category: 'UX Friction' },
    { reason: 'Too many fields on Step 2', description: "High time spent and 'exit' events on Step 2.", impact_score: 6.5, potential_lift: '+12%', status: 'medium', effort: 'high', category: 'Product' }
  ]);

  // Alerts
  await seedIfEmpty('alerts', [
    { title: 'High Drop-off Rate: Step 3', description: 'Drop-off rate on Step 3 (Phone Verification) has increased by 15% in the last 2 hours.', severity: 'critical', status: 'active', type: 'Conversion' },
    { title: 'API Latency Spike', description: '/api/verify-otp is experiencing latency > 5s for 12% of requests.', severity: 'high', status: 'active', type: 'Technical' },
    { title: 'Abnormal Abandonment: Step 1', description: "Identified a 22% increase in abandonment on the 'Password' field.", severity: 'medium', status: 'active', type: 'UX friction' }
  ]);

  // Events
  const { data: evs } = await supabase.from('events').select('id').limit(1);
  if (!evs || evs.length === 0) {
    console.log('Seeding Events...');
    const records = [];
    for (let i = 0; i < 50; i++) {
        const sid = `sess_${Math.random().toString(36).substr(2, 5)}`;
        records.push({
            type: 'page_view',
            step_id: `step-${Math.floor(Math.random() * 4) + 1}`,
            session_id: sid,
            metadata: { device: i % 2 === 0 ? 'mobile' : 'desktop' },
            timestamp: new Date().toISOString()
        });
    }
    await supabase.from('events').insert(records);
  }

  console.log('\n--- Seeding Complete ---');
}

seed().catch(console.error);
