const express = require('express');
const router = express.Router();
const { readDb, writeDb, generateId } = require('../db');

// POST register student
router.post('/register', (req, res) => {
  const { id, name, branch, year, subjects, phone, email } = req.body;
  
  const db = readDb();
  const newStudent = {
    id: id || generateId(),
    name, branch, year, subjects, phone, email,
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
