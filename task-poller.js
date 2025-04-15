require('dotenv').config();
const { scoreHype } = require('./claude-scorer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Util to insert log messages
async function insertLog(task_id, message, type = 'info') {
  await supabase.from('task_logs').insert([
    {
      id: uuidv4(),
      task_id,
      message,
      type,
      created_at: new Date().toISOString(),
    }
  ]);
}

// Main task polling loop
async function pollTasks() {
  console.log('🚀 Task poller started');

  while (true) {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (error) {
      console.error('[❌ Supabase error]', error.message);
      await new Promise(res => setTimeout(res, 5000));
      continue;
    }

    for (const task of tasks) {
      const taskId = task.id;
      try {
        await insertLog(taskId, `Processing task: ${task.product_id}`, 'info');

        // Run Claude scoring (simulate product score analysis)
        const result = await scoreHype(task.product_id, task.retail_price, task.resale_listings || []);
        await insertLog(taskId, `Claude Score: ${result.score} | Verdict: ${result.verdict}`, 'success');

        // Mark task as completed
        await supabase
          .from('tasks')
          .update({
            status: 'completed',
            hype_score: result.score,
            hype_verdict: result.verdict,
            hype_reason: result.reason
          })
          .eq('id', taskId);

        await insertLog(taskId, `Task completed successfully`, 'success');
      } catch (err) {
        console.error('[Task Error]', err.message);
        await insertLog(taskId, `Task failed: ${err.message}`, 'error');
        await supabase
          .from('tasks')
          .update({ status: 'failed' })
          .eq('id', taskId);
      }
    }

    // Sleep 10 seconds
    await new Promise(res => setTimeout(res, 10000));
  }
}

pollTasks();
