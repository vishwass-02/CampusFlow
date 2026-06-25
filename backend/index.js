const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const studentsRouter = require('./routes/students');
const tasksRouter = require('./routes/tasks');
const aiRouter = require('./routes/ai');
const noticesRouter = require('./routes/notices');
const automationsRouter = require('./routes/automations');
const attendanceRouter = require('./routes/attendanceRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/students', studentsRouter);
app.use('/tasks', tasksRouter);
app.use('/ai', aiRouter);
app.use('/notices', noticesRouter);
app.use('/automations', automationsRouter);
app.use('/api/attendance', attendanceRouter);

app.get('/', (req, res) => res.json({ status: 'CampusFlow local backend running' }));

app.get('/health', (req, res) => {
  res.json({
    auth: 'local-json',
    gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'placeholder'),
    n8n: !!(process.env.N8N_DEADLINE_WEBHOOK && process.env.N8N_DEADLINE_WEBHOOK !== 'https://placeholder.com' && process.env.N8N_NOTICE_WEBHOOK && process.env.N8N_NOTICE_WEBHOOK !== 'https://placeholder.com')
  });
});

const { recoverScheduledReminders } = require('./middleware/scheduler');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  recoverScheduledReminders();
});
