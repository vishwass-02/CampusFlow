const express = require('express');
const router = express.Router();
const path = require('path');
const {
  classifyDate,
  getRemainingClasses,
  predictAttendanceAfterMissing,
  maxClassesCanMiss
} = require('../utils/attendanceCalculator');

const {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO
} = require('date-fns');

const calendarData = require('../data/academicCalendar.json');

// POST /api/attendance/calculate
router.post('/calculate', (req, res) => {
  const {
    semesterType,
    attended = 0,
    totalHeldSoFar = 0,
    plannedMisses = 0,
    minRequiredPercent = 75
  } = req.body;

  if (!semesterType || (semesterType !== 'odd' && semesterType !== 'even')) {
    return res.status(400).json({ error: 'Valid semesterType ("odd" or "even") is required.' });
  }

  const parsedAttended = parseInt(attended, 10);
  const parsedTotalHeld = parseInt(totalHeldSoFar, 10);
  const parsedPlannedMisses = parseInt(plannedMisses, 10);
  const parsedMinRequired = parseFloat(minRequiredPercent);

  if (isNaN(parsedAttended) || isNaN(parsedTotalHeld) || parsedTotalHeld < 0 || parsedAttended < 0 || parsedAttended > parsedTotalHeld) {
    return res.status(400).json({ error: 'Invalid attended or totalHeldSoFar values.' });
  }

  // Calculate remaining classes from today
  const today = new Date();
  const remaining = getRemainingClasses(today, semesterType, calendarData);

  // Projected calculation
  const miss = Math.min(parsedPlannedMisses, remaining);
  const attend = Math.max(0, remaining - miss);
  const projectedAttendance = predictAttendanceAfterMissing(parsedAttended, parsedTotalHeld, miss, attend);

  // Maximum classes user can miss
  const maxCanMiss = maxClassesCanMiss(parsedAttended, parsedTotalHeld, remaining, parsedMinRequired);

  // Determine risk level based on projected attendance
  let riskLevel = 'safe';
  if (projectedAttendance < 65) {
    riskLevel = 'danger';
  } else if (projectedAttendance < 75) {
    riskLevel = 'warning';
  }

  res.json({
    remainingClasses: remaining,
    projectedAttendance: parseFloat(projectedAttendance.toFixed(2)),
    maxCanMiss,
    riskLevel
  });
});

// POST /api/attendance/calendar-month
router.post('/calendar-month', (req, res) => {
  const { semesterType, year, month } = req.body;

  if (!semesterType || (semesterType !== 'odd' && semesterType !== 'even')) {
    return res.status(400).json({ error: 'Valid semesterType ("odd" or "even") is required.' });
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);

  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return res.status(400).json({ error: 'Valid year and month (1-12) are required.' });
  }

  const padMonth = m.toString().padStart(2, '0');
  const monthDate = parseISO(`${y}-${padMonth}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  
  const days = eachDayOfInterval({ start, end });
  const result = days.map(day => {
    const classification = classifyDate(day, semesterType, calendarData);
    return {
      date: format(day, 'yyyy-MM-dd'),
      classes: classification.classes,
      type: classification.type,
      label: classification.label
    };
  });

  res.json({ days: result });
});

module.exports = router;
