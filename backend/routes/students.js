const express = require('express');
const router = express.Router();
const { readDb, writeDb, generateId } = require('../db');

// POST register student
router.post('/register', (req, res) => {
  const { id, name, branch, year, subjects, phone, email } = req.body;
  
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

  const db = readDb();
  const newStudent = {
    id: id || generateId(),
    name, branch, year, subjects, phone: normalizedPhone, email,
    created_at: new Date().toISOString()
  };

  db.students.push(newStudent);
  writeDb(db);

  res.json(newStudent);
});

// GET student by id
router.get('/:id', (req, res) => {
  const db = readDb();
  const student = db.students.find(s => s.id === req.params.id);
  
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

module.exports = router;
