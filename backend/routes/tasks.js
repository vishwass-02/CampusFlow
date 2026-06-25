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

    console.log(`✅ WhatsApp sent to ${formattedPhone}`);
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

  // 4. Schedule 24h reminder (30s in test_mode, 24h before deadline in prod)
  const delay = test_mode
    ? 30 * 1000
    : new Date(task.reminder_time) - new Date();

  if (delay > 0) {
    setTimeout(async () => {
      const reminderMsg = `🔔 Reminder: *${task.subject}* — '${task.title}' is due tomorrow! Don't miss it. — CampusFlow`;
      await sendWhatsApp(`whatsapp:${student.phone}`, reminderMsg);
    }, delay);
  }

  // 4.5. Schedule 1h reminder (60s in test_mode, 1h before deadline in prod)
  const reminder1hTime = new Date(task.deadline);
  reminder1hTime.setHours(reminder1hTime.getHours() - 1);
  const delay1h = test_mode
    ? 60 * 1000
    : reminder1hTime - new Date();

  if (delay1h > 0) {
    setTimeout(async () => {
      const reminder1hMsg = `⏰ Urgent Reminder: *${task.subject}* — '${task.title}' is due in 1 hour! Submit it soon. — CampusFlow`;
      await sendWhatsApp(`whatsapp:${student.phone}`, reminder1hMsg);
    }, delay1h);
  }

  // 4.6. Schedule recurring 3h progress updates (15s in test_mode, 3h in prod)
  const intervalMs = test_mode ? 15 * 1000 : 3 * 3600 * 1000;
  const intervalId = setInterval(async () => {
    const { data: currentTask, error: fetchErr } = await supabase
      .from('tasks')
      .select('status, deadline, title, subject')
      .eq('id', task.id)
      .single();

    if (fetchErr || !currentTask || currentTask.status !== 'pending') {
      clearInterval(intervalId);
      return;
    }

    const timeLeftMs = new Date(currentTask.deadline) - new Date();
    if (timeLeftMs <= 0) {
      clearInterval(intervalId);
      return;
    }

    const hoursLeft = Math.floor(timeLeftMs / (3600 * 1000));
    const minsLeft = Math.floor((timeLeftMs % (3600 * 1000)) / 60000);
    let timeStr = "";
    if (hoursLeft > 0) {
      timeStr += `${hoursLeft} hour(s)`;
      if (minsLeft > 0) {
        timeStr += ` and ${minsLeft} minute(s)`;
      }
    } else {
      timeStr += `${minsLeft} minute(s)`;
    }

    const progressMsg = `⏳ Progress Alert: *${currentTask.subject}* — '${currentTask.title}' has *${timeStr}* remaining until submission! — CampusFlow`;
    await sendWhatsApp(`whatsapp:${student.phone}`, progressMsg);
  }, intervalMs);

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
