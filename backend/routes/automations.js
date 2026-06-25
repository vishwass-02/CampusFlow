const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/supabase');

// GET /automations — list latest automation logs
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
