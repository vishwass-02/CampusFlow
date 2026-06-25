const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../middleware/supabase');

// POST /notices/broadcast — send summary to all via n8n
router.post('/broadcast', async (req, res) => {
  const { summary, phoneList, eventTitle, eventDate, studentId } = req.body;

  // Save notice to DB
  await supabase.from('notices').insert([{
    student_id: studentId,
    raw_text: summary,
    ai_summary: summary,
    event_title: eventTitle,
    event_date: eventDate,
    broadcast_sent: true,
  }]);

  // Fire n8n webhook
  await axios.post(process.env.N8N_NOTICE_WEBHOOK, {
    summary, phoneList, eventTitle, eventDate,
  }).catch(err => console.error('n8n notice webhook failed:', err.message));

  // Log it
  await supabase.from('automation_logs').insert([{
    workflow_name: 'Notice Broadcast',
    payload: { eventTitle, phoneList },
    status: 'triggered',
  }]);

  res.json({ message: 'Broadcast triggered' });
});

module.exports = router;
