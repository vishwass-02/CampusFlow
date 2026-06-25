const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../middleware/supabase');

// Helper: compute reminder time (24h before deadline, or 30s from now for testing)
function computeReminderTime(deadlineISO, testMode = false) {
  if (testMode) {
    const t = new Date();
    t.setSeconds(t.getSeconds() + 30);
    return t.toISOString();
  }
  const d = new Date(deadlineISO);
  d.setHours(d.getHours() - 24);
  return d.toISOString();
}

const twilio = require('twilio');

async function sendWhatsApp(toPhone, message) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: process.env.TWILIO_FROM,
      to: toPhone,                      // e.g. whatsapp:+919876543210
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${toPhone}`);
    return true;
  } catch (err) {
    console.error('❌ Twilio error:', err.message);
    return false;
  }
}

async function triggerDeadlineWorkflow(task, student) {
  const message = `Reminder: "${task.title}" for subject "${task.subject}" is due on ${new Date(task.deadline).toLocaleString('en-IN')}.`;
  const toPhone = `whatsapp:${student.phone}`;
  const triggered = await sendWhatsApp(toPhone, message);

  // Log to automation_logs table for the status page
  await supabase.from('automation_logs').insert({
    workflow_name: 'Deadline Reminder',
    student_phone: student.phone,
    status: triggered ? 'triggered' : 'failed',
    payload: { taskTitle: task.title, subject: task.subject, deadline: task.deadline, reminderTime: task.reminder_time },
  });

  return triggered;
}

// ─────────────────────────────────────────────
// GET /tasks/:studentId — list all tasks
// ─────────────────────────────────────────────
router.get('/:studentId', async (req, res) => {
  const { studentId } = req.params;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('student_id', studentId)
    .order('deadline', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
// POST /tasks — create task + trigger n8n
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    student_id,
    title,
    subject,
    deadline,
    add_to_calendar = true,
    test_mode = false,   // pass true from Postman to get 30s reminder for demo
  } = req.body;

  // Basic validation
  if (!student_id || !title || !subject || !deadline) {
    return res.status(400).json({ error: 'student_id, title, subject, deadline are required' });
  }

  const reminder_time = computeReminderTime(deadline, test_mode);

  // 1. Save task to Supabase
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      student_id,
      title,
      subject,
      deadline,
      reminder_time,
      add_to_calendar,
      status: 'pending',
      n8n_triggered: false,
    })
    .select()
    .single();

  if (taskError) return res.status(500).json({ error: taskError.message });

  // 2. Fetch student (need name + phone for WhatsApp)
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('name, phone')
    .eq('id', student_id)
    .single();

  if (studentError) {
    console.error('Could not fetch student:', studentError.message);
    // Return task anyway — n8n trigger will just be skipped
    return res.status(201).json({ task, n8n: false, warning: 'Student not found, webhook skipped' });
  }

  // 3. Send instant confirmation WhatsApp
  const confirmMsg = `⏰ Hi ${student.name}! Your *${task.subject}* task '${task.title}' is due on ${new Date(task.deadline).toDateString()}. — CampusFlow 🎓`;
  const triggered = await sendWhatsApp(`whatsapp:${student.phone}`, confirmMsg);

  // 4. Schedule reminder (30s in test_mode, 24h before deadline in prod)
  const delay = test_mode
    ? 30 * 1000
    : new Date(task.reminder_time) - new Date();

  if (delay > 0) {
    setTimeout(async () => {
      const reminderMsg = `🔔 Reminder: *${task.subject}* — '${task.title}' is due tomorrow! Don't miss it. — CampusFlow`;
      await sendWhatsApp(`whatsapp:${student.phone}`, reminderMsg);
    }, delay);
  }

  // 5. Mark task as n8n_triggered (meaning WhatsApp triggered) in DB
  if (triggered) {
    await supabase
      .from('tasks')
      .update({ n8n_triggered: true })
      .eq('id', task.id);
  }

  // Also log to automation_logs table for the status page
  await supabase.from('automation_logs').insert({
    workflow_name: 'Deadline Reminder',
    student_phone: student.phone,
    status: triggered ? 'triggered' : 'failed',
    payload: { taskTitle: task.title, subject: task.subject, deadline: task.deadline, reminderTime: task.reminder_time },
  });

  res.status(201).json({
    task: { ...task, n8n_triggered: triggered },
    n8n: triggered,
    message: triggered
      ? '🎉 Task saved & WhatsApp reminder scheduled!'
      : '⚠️ Task saved, but WhatsApp notification failed. Check logs.',
  });
});

// ─────────────────────────────────────────────
// PUT /tasks/:id — update task (status, title, etc.)
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Don't allow overwriting id or student_id
  delete updates.id;
  delete updates.student_id;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
// DELETE /tasks/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
