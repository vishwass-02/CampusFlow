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

      // 3. Recover 2h follow-up reminder
      const reminderTime = new Date(task.reminder_time);
      const delay = reminderTime - now;

      if (delay > 0) {
        console.log(`⏰ [CampusFlow] Rescheduled 2h follow-up reminder for task '${task.title}' (${task.subject}) in ${Math.round(delay / 60000)} minutes.`);
        setTimeout(async () => {
          const reminderMsg = `🔔 Follow-up Reminder: *${task.subject}* — '${task.title}' is due in 2 hours! Make sure to submit. — CampusFlow`;
          await sendWhatsApp(`whatsapp:${student.phone}`, reminderMsg);
        }, delay);
      }
    }
    console.log("✅ [CampusFlow] Recovery of scheduled reminders completed!");
  } catch (err) {
    console.error("❌ [CampusFlow] Error during reminder recovery:", err.message);
  }
}

module.exports = { recoverScheduledReminders };
