// task-poller.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { runBotTask } = require('./puppeteer-runner'); // placeholder
const { scoreHype } = require('./claude-scorer');     // placeholder
const { getMetadata } = require('./product-metadata'); // placeholder

const SUPABASE = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function pollTasks() {
  console.log('[📡] Polling for new tasks...');

  const { data: tasks, error } = await SUPABASE
    .from('tasks')
    .select('*')
    .eq('status', 'pending')
    .limit(5);

  if (error) {
    console.error('[❌] Failed to fetch tasks:', error.message);
    return;
  }

  for (const task of tasks) {
    console.log(`[⚙️] Processing task ${task.id} - ${task.product_id}`);

    try {
      // 1. Update task status to 'running'
      await SUPABASE.from('tasks').update({ status: 'running' }).eq('id', task.id);

      // 2. Score hype via Claude
      const hype = await scoreHype(task.product_id);
      await SUPABASE.from('tasks').update({ hype_score: hype.score, verdict: hype.verdict }).eq('id', task.id);

      // 3. Enrich product metadata
      const meta = await getMetadata(task.product_id);
      if (meta?.image_url) {
        await SUPABASE.from('tasks').update({ image_url: meta.image_url }).eq('id', task.id);
      }

      // 4. Run Puppeteer bot
      const result = await runBotTask(task, meta);

      // 5. Finalize status
      await SUPABASE.from('tasks').update({ status: result.success ? 'success' : 'failed' }).eq('id', task.id);

    } catch (err) {
      console.error(`[💥] Error running task ${task.id}:`, err.message);
      await SUPABASE.from('tasks').update({ status: 'error' }).eq('id', task.id);
    }
  }
}

// Run every 30 seconds
setInterval(pollTasks, 30_000);
console.log('[🧠] Task poller started. Ready to snipe.');
