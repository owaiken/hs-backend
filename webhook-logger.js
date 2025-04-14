// webhook-logger.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function insertLog(taskId, message, type = 'info') {
  const { error } = await supabase.from('task_logs').insert([
    {
      task_id: taskId,
      message,
      type,
      timestamp: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error(`[❌] Failed to log to Supabase: ${error.message}`);
  }
}

module.exports = { insertLog };
