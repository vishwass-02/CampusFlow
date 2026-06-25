const {
  parseISO,
  isWithinInterval,
  isSameDay,
  getDay,
  startOfMonth,
  eachDayOfInterval,
  isBefore,
  isAfter
} = require('date-fns');

/**
 * Classifies a date and returns its details (classes count, classification type, and label).
 */
function classifyDate(date, semesterType, calendarData) {
  const dateObj = typeof date === 'string' ? parseISO(date.split('T')[0]) : date;
  
  const sem = calendarData.semesters[semesterType];
  if (!sem) {
    return { classes: 0, type: 'out-of-bound', label: 'Invalid semester type' };
  }

  const start = parseISO(sem.classesStart);
  const end = parseISO(sem.lastInstructionDay);

  // Rule 3: Only count days between classesStart and lastInstructionDay (inclusive)
  if (isBefore(dateObj, start) || isAfter(dateObj, end)) {
    return { classes: 0, type: 'out-of-bound', label: 'Outside instruction period' };
  }

  // Rule 2a: If date falls within any noAttendanceWindows range for user's selected semester
  const noAttWindows = calendarData.noAttendanceWindows || [];
  for (const win of noAttWindows) {
    if (win.appliesTo === semesterType) {
      const winStart = parseISO(win.start);
      const winEnd = parseISO(win.end);
      if (isWithinInterval(dateObj, { start: winStart, end: winEnd })) {
        return { classes: 0, type: 'exam', label: win.label };
      }
    }
  }

  // Rule 2b: If the date is in the holidays list
  const holidays = calendarData.holidays || [];
  for (const hol of holidays) {
    if (isSameDay(dateObj, parseISO(hol.date))) {
      return { classes: 0, type: 'holiday', label: hol.name };
    }
  }

  // Rule 2c: If the date is a Sunday
  if (getDay(dateObj) === 0) {
    return { classes: 0, type: 'sunday', label: 'Sunday' };
  }

  // Rule 2d: If the date is a Saturday
  if (getDay(dateObj) === 6) {
    // Check thirdSaturdayOverrides
    const overrides = calendarData.thirdSaturdayOverrides || [];
    const override = overrides.find(o => isSameDay(dateObj, parseISO(o.date)));
    if (override && override.type === 'workingDay') {
      return { classes: 4, type: 'override-working', label: override.note };
    }

    // Otherwise, check if it's the 3rd Saturday of its calendar month
    const monthStart = startOfMonth(dateObj);
    const daysInMonthToDate = eachDayOfInterval({ start: monthStart, end: dateObj });
    const saturdaysCount = daysInMonthToDate.filter(d => getDay(d) === 6).length;
    if (saturdaysCount === 3) {
      return { classes: 0, type: 'third-saturday-off', label: '3rd Saturday Off' };
    }

    return { classes: 4, type: 'saturday', label: 'Normal Saturday Classes' };
  }

  // Rule 2e: Otherwise (weekday)
  return { classes: 6, type: 'weekday', label: 'Regular Weekday Classes' };
}

/**
 * Priority order class-held checker:
 * Returns the number of classes (0, 4, or 6) held on a given date.
 */
function getClassesOnDate(date, semesterType, calendarData) {
  const result = classifyDate(date, semesterType, calendarData);
  return result.classes;
}

/**
 * Sums classes from fromDate to that semester's lastInstructionDay (inclusive).
 */
function getRemainingClasses(fromDate, semesterType, calendarData) {
  const fromDateObj = typeof fromDate === 'string' ? parseISO(fromDate.split('T')[0]) : fromDate;
  
  const sem = calendarData.semesters[semesterType];
  if (!sem) return 0;

  const start = parseISO(sem.classesStart);
  const end = parseISO(sem.lastInstructionDay);

  // If fromDate is after lastInstructionDay, there are 0 remaining classes
  if (isAfter(fromDateObj, end)) {
    return 0;
  }

  // Start from fromDateObj, but if fromDateObj is before classesStart, count from classesStart
  const actualStart = isBefore(fromDateObj, start) ? start : fromDateObj;

  const days = eachDayOfInterval({ start: actualStart, end });
  let totalClasses = 0;
  for (const day of days) {
    totalClasses += getClassesOnDate(day, semesterType, calendarData);
  }

  return totalClasses;
}

/**
 * Predicts the projected attendance percentage.
 */
function predictAttendanceAfterMissing(attended, totalHeldSoFar, classesWillMiss, classesWillAttend) {
  const newAttended = attended + classesWillAttend;
  const newTotal = totalHeldSoFar + classesWillMiss + classesWillAttend;
  if (newTotal === 0) return 100;
  return (newAttended / newTotal) * 100;
}

/**
 * Calculates maximum number of classes a student can miss.
 */
function maxClassesCanMiss(attended, totalHeldSoFar, remainingClasses, minRequiredPercent) {
  const totalAtSemesterEnd = totalHeldSoFar + remainingClasses;
  if (totalAtSemesterEnd === 0) return 0;
  const minAttendanceNeeded = Math.ceil((minRequiredPercent / 100) * totalAtSemesterEnd);
  const canMiss = (attended + remainingClasses) - minAttendanceNeeded;
  return Math.max(0, canMiss);
}

module.exports = {
  classifyDate,
  getClassesOnDate,
  getRemainingClasses,
  predictAttendanceAfterMissing,
  maxClassesCanMiss
};
