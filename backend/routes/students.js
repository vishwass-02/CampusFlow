const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/supabase');

// POST register student
router.post('/register', async (req, res) => {
  const { name, branch, year, subjects, phone, email } = req.body;
  let normalizedPhone = phone ? phone.trim() : '';
  if (normalizedPhone) {
    if (normalizedPhone.startsWith('whatsapp:')) {
      normalizedPhone = normalizedPhone.substring('whatsapp:'.length);
    }
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.length === 10) {
        normalizedPhone = '+91' + normalizedPhone;
      } else {
        normalizedPhone = '+' + normalizedPhone;
      }
    }
  }
  const { data, error } = await supabase
    .from('students')
    .insert([{ name, branch, year, subjects, phone: normalizedPhone, email }])
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET student by id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error });
  res.json(data);
});

module.exports = router;
