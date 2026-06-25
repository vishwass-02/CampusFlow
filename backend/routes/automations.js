const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../db');
const { runAllChecks } = require('../lib/automation-engine');

// GET /automations/preferences/:studentId
router.get('/preferences/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();
  let prefs = db.automation_preferences.find(p => p.studentId === studentId);
  
  if (!prefs) {
    prefs = {
      studentId,
      deadlineReminders: true,
      deadlineHours: 24,
      dailyDigest: true,
      overdueAlerts: true
    };
    db.automation_preferences.push(prefs);
    writeDb(db);
  }
  
  res.json(prefs);
});

// PUT /automations/preferences/:studentId
router.put('/preferences/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();
  let index = db.automation_preferences.findIndex(p => p.studentId === studentId);
  
  const updatedPrefs = { ...req.body, studentId };
  
  if (index === -1) {
    db.automation_preferences.push(updatedPrefs);
  } else {
    db.automation_preferences[index] = updatedPrefs;
  }
  
  writeDb(db);
  res.json(updatedPrefs);
});

// GET /automations/logs/:studentId
router.get('/logs/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();
  const logs = db.automation_logs
    .filter(l => l.student_id === studentId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50); // limit to recent 50
    
  res.json(logs);
});

// POST /automations/trigger-check
router.post('/trigger-check', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId required' });
  
  try {
    await runAllChecks(studentId);
    res.json({ success: true, message: 'Automation checks run successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
