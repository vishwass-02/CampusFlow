const { supabase } = require('./supabase');
const twilio = require('twilio');

async function sendWhatsApp(toPhone, message) {
  try {
    let target = toPhone ? toPhone.trim() : '';
    if (target.startsWith('whatsapp:')) {
      target = target.substring('whatsapp:'.length);
    }
    if (!target.startsWith('+')) {
      if (target.length === 10) {
        target = '+91' + target;
      } else {
        target = '+' + target;
      }
    }
    const formattedPhone = `whatsapp:${target}`;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: process.env.TWILIO_FROM,
      to: formattedPhone,
      body: message,
    });

    console.log(`[Scheduler Recovery] ✅ WhatsApp sent to ${formattedPhone}`);
    return true;
  } catch (err) {
    console.error('[Scheduler Recovery] ❌ Twilio error:', err.message);
    return false;
  }
}

async function recoverScheduledReminders() {
  console.log("⏳ [CampusFlow] Recovering scheduled reminders from database...");
  try {
    // 1. Fetch all pending tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error("❌ [CampusFlow] Failed to fetch pending tasks for recovery:", error.message);
      return;
    }

    console.log(`ℹ️ [CampusFlow] Found ${tasks.length} pending tasks to process.`);
    const now = new Date();

    for (const task of tasks) {
      // 2. Fetch student details (need name + phone for WhatsApp)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name, phone')
        .eq('id', task.student_id)
        .single();

      if (studentError || !student) {
        console.warn(`⚠️ [CampusFlow] Could not fetch student details for task ${task.id}, skipping scheduler.`);
        continue;
      }

      // 3. Recover 24h reminder
      const reminderTime = new Date(task.reminder_time);
      const delay24h = reminderTime - now;

      if (delay24h > 0) {
        console.log(`⏰ [CampusFlow] Rescheduled 24h reminder for task '${task.title}' (${task.subject}) in ${Math.round(delay24h / 60000)} minutes.`);
        setTimeout(async () => {
          const reminderMsg = `🔔 Reminder: *${task.subject}* — '${task.title}' is due tomorrow! Don't miss it. — CampusFlow`;
          await sendWhatsApp(`whatsapp:${student.phone}`, reminderMsg);
        }, delay24h);
      } else if (!task.n8n_triggered) {
        // If the reminder time passed while the server was offline, send it now
        console.log(`⚠️ [CampusFlow] Sending missed 24h reminder for task '${task.title}' immediately.`);
        const reminderMsg = `🔔 Missed Reminder: *${task.subject}* — '${task.title}' is due tomorrow! — CampusFlow`;
        const sent = await sendWhatsApp(`whatsapp:${student.phone}`, reminderMsg);
        if (sent) {
          await supabase
            .from('tasks')
            .update({ n8n_triggered: true })
            .eq('id', task.id);
        }
      }

      // 4. Recover 1h reminder
      const deadlineTime = new Date(task.deadline);
      const reminder1hTime = new Date(deadlineTime);
      reminder1hTime.setHours(reminder1hTime.getHours() - 1);
      const delay1h = reminder1hTime - now;

      if (delay1h > 0) {
        console.log(`⏰ [CampusFlow] Rescheduled 1h reminder for task '${task.title}' (${task.subject}) in ${Math.round(delay1h / 60000)} minutes.`);
        setTimeout(async () => {
          const reminder1hMsg = `⏰ Urgent Reminder: *${task.subject}* — '${task.title}' is due in 1 hour! Submit it soon. — CampusFlow`;
          await sendWhatsApp(`whatsapp:${student.phone}`, reminder1hMsg);
        }, delay1h);
      }
    }
    console.log("✅ [CampusFlow] Recovery of scheduled reminders completed!");
  } catch (err) {
    console.error("❌ [CampusFlow] Error during reminder recovery:", err.message);
  }
}

module.exports = { recoverScheduledReminders };
