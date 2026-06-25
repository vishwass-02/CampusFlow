const { readDb, writeDb, generateId } = require('../db');
const { sendEmail } = require('./email');

function getStudentAndPrefs(studentId, db) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;
  let prefs = db.automation_preferences.find(p => p.studentId === studentId);
  if (!prefs) {
    prefs = {
      studentId,
      deadlineReminders: true,
      deadlineHours: 24,
      dailyDigest: true,
      overdueAlerts: true
    };
  }
  return { student, prefs };
}

function logAutomation(db, workflowName, studentId, studentPhone, status, payload) {
  db.automation_logs.push({
    id: generateId(),
    workflow_name: workflowName,
    student_id: studentId,
    student_phone: studentPhone,
    status,
    payload,
    created_at: new Date().toISOString()
  });
}

async function checkDeadlineReminders(studentId) {
  const db = readDb();
  const info = getStudentAndPrefs(studentId, db);
  if (!info || !info.prefs.deadlineReminders) return;
  const { student, prefs } = info;

  const now = new Date();
  const tasks = db.tasks.filter(t => t.student_id === studentId && t.status === 'pending');
  
  let triggered = 0;
  for (const task of tasks) {
    // Has this task already been reminded?
    const alreadyReminded = db.automation_logs.some(l => 
      l.workflow_name === 'Deadline Reminder' && 
      l.payload.taskId === task.id &&
      l.status === 'success'
    );
    if (alreadyReminded) continue;

    const due = new Date(task.deadline);
    const diffHours = (due - now) / (1000 * 60 * 60);
    
    // Test mode overrides deadline checking. If task is in test mode and diff > 0, remind immediately.
    // Otherwise remind if within preference window (default 24h) and not overdue
    const isDueSoon = task.test_mode 
      ? (diffHours > 0)
      : (diffHours > 0 && diffHours <= prefs.deadlineHours);

    if (isDueSoon) {
      try {
        await sendEmail(
          student.email,
          `Reminder: ${task.title} is due soon!`,
          `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Task Reminder</h2>
            <p>Hi ${student.name},</p>
            <p>Your task <strong>${task.title}</strong> for ${task.subject} is due in ${Math.round(diffHours)} hours.</p>
            <p>Deadline: ${due.toLocaleString()}</p>
            <p><a href="http://localhost:3000/dashboard" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Go to Dashboard</a></p>
          </div>`
        );
        logAutomation(db, 'Deadline Reminder', studentId, student.phone, 'success', { taskTitle: task.title, taskId: task.id });
        triggered++;
      } catch (err) {
        logAutomation(db, 'Deadline Reminder', studentId, student.phone, 'failed', { error: err.message, taskTitle: task.title });
      }
    }
  }
  
  if (triggered > 0) writeDb(db);
}

async function checkOverdueAlerts(studentId) {
  const db = readDb();
  const info = getStudentAndPrefs(studentId, db);
  if (!info || !info.prefs.overdueAlerts) return;
  const { student } = info;

  const now = new Date();
  const tasks = db.tasks.filter(t => t.student_id === studentId && t.status === 'pending');

  let triggered = 0;
  for (const task of tasks) {
    const due = new Date(task.deadline);
    const diffHours = (now - due) / (1000 * 60 * 60);

    // If it's overdue by more than 1 hour, send an alert.
    if (diffHours > 1) {
      const alreadyAlerted = db.automation_logs.some(l => 
        l.workflow_name === 'Overdue Alert' && 
        l.payload.taskId === task.id &&
        l.status === 'success'
      );
      if (alreadyAlerted) continue;

      try {
        await sendEmail(
          student.email,
          `Overdue Alert: ${task.title}`,
          `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Overdue Task Alert</h2>
            <p>Hi ${student.name},</p>
            <p>Your task <strong>${task.title}</strong> for ${task.subject} was due ${Math.round(diffHours)} hours ago.</p>
            <p>If you've already completed it, please mark it as done.</p>
            <p><a href="http://localhost:3000/dashboard" style="background:#e11d48;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Go to Dashboard</a></p>
          </div>`
        );
        logAutomation(db, 'Overdue Alert', studentId, student.phone, 'success', { taskTitle: task.title, taskId: task.id });
        triggered++;
      } catch (err) {
        logAutomation(db, 'Overdue Alert', studentId, student.phone, 'failed', { error: err.message, taskTitle: task.title });
      }
    }
  }

  if (triggered > 0) writeDb(db);
}

async function runAllChecks(studentId) {
  await checkDeadlineReminders(studentId);
  await checkOverdueAlerts(studentId);
}

module.exports = {
  checkDeadlineReminders,
  checkOverdueAlerts,
  runAllChecks
};
