const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PDFParse, VerbosityLevel } = require('pdf-parse');
const mammoth = require('mammoth');
const { parseOffice } = require('officeparser');
const { upload } = require('../middleware/fileUpload');

// ─────────────────────────────────────────────
// Shared Claude API caller
// ─────────────────────────────────────────────
async function askClaude(systemPrompt, userMessage) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-lite-latest'
  ];

  let lastError = null;
  for (const model of models) {
    try {
      console.log(`[AI] Attempting call with model: ${model}`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`[AI] Successfully generated content using model: ${model}`);
        return response.data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      lastError = err;
      const status = err.response ? err.response.status : 'network';
      const msg = err.response?.data?.error?.message?.split('\n')?.[0] || err.message;
      console.warn(`[AI WARNING] Model ${model} failed (status ${status}): ${msg}`);
    }
  }

  throw lastError || new Error('All AI models failed');
}

// ─────────────────────────────────────────────
// POST /ai/flashcards
// Body: { notes: "..." }
// Returns: [{ front: "Q", back: "A" }, ...]
// ─────────────────────────────────────────────
router.post('/flashcards', async (req, res) => {
  const { notes, exclude = [], count = 6 } = req.body;
  if (!notes) return res.status(400).json({ error: 'notes is required' });

  try {
    let exclusionPhrase = "";
    if (exclude.length > 0) {
      exclusionPhrase = `\nDo NOT duplicate or generate flashcards similar to any of these existing questions/fronts: ${JSON.stringify(exclude)}.`;
    }

    const system = `You are a study assistant for B.Tech students. 
Given notes, generate exactly ${count} flashcards as a JSON array.
Each object must have "front" (question) and "back" (answer).
Return ONLY the JSON array, no explanation, no markdown fences.${exclusionPhrase}
Example: [{"front":"What is OS?","back":"Operating System manages hardware resources"}]`;

    const raw = await askClaude(system, `Generate flashcards from these notes:\n\n${notes}`);

    // Strip markdown fences if Claude adds them anyway
    const clean = raw.replace(/```json|```/g, '').trim();
    const flashcards = JSON.parse(clean);

    res.json({ flashcards });
  } catch (err) {
    console.error('Flashcards error:', err.message);
    res.status(500).json({ error: 'Claude API failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /ai/mcq
// Body: { notes: "..." }
// Returns: [{ question, options: [], answer, explanation }]
// ─────────────────────────────────────────────
router.post('/mcq', async (req, res) => {
  const { notes, exclude = [], count = 5 } = req.body;
  if (!notes) return res.status(400).json({ error: 'notes is required' });

  try {
    let exclusionPhrase = "";
    if (exclude.length > 0) {
      exclusionPhrase = `\nDo NOT duplicate or generate questions similar to any of these existing questions: ${JSON.stringify(exclude)}.`;
    }

    const system = `You are a B.Tech exam question generator.
Given notes, generate exactly ${count} multiple choice questions as a JSON array.
Each object must have:
- "question": string
- "options": array of 4 strings (A, B, C, D)
- "answer": the correct option string (must match one in options exactly)
- "explanation": one line why it's correct
Return ONLY the JSON array, no markdown fences.${exclusionPhrase}`;

    const raw = await askClaude(system, `Generate MCQs from these notes:\n\n${notes}`);
    const clean = raw.replace(/```json|```/g, '').trim();
    const mcqs = JSON.parse(clean);

    res.json({ mcqs });
  } catch (err) {
    console.error('MCQ error:', err.message);
    res.status(500).json({ error: 'Claude API failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /ai/summarize
// Body: { text: "..." }
// Returns: { summary: "...", event_title, event_date }
// ─────────────────────────────────────────────
router.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const system = `You are a college notice summarizer for B.Tech students.
Given a college notice or announcement, return a JSON object with:
- "summary": exactly 3 bullet points as a single string (use • as bullet, newline between)
- "event_title": short calendar-friendly title (max 6 words), or null if no event
- "event_date": ISO 8601 date string if a date is mentioned, or null
Return ONLY the JSON object, no markdown fences.`;

    const raw = await askClaude(system, `Summarize this college notice:\n\n${text}`);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.json(result);
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ error: 'Claude API failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /ai/tip
// Body: { branch: "CSE", year: 2, subjects: ["OS","DBMS"] }
// Returns: { tip: "..." }
// ─────────────────────────────────────────────
router.post('/tip', async (req, res) => {
  const { branch = 'CSE', year = 2, subjects = [] } = req.body;

  try {
    const system = `You are a motivational academic coach for B.Tech students.
Return a single practical productivity tip in 2 sentences max.
Make it specific to the student's context. No generic advice.
Return ONLY the tip text, nothing else.`;

    const tip = await askClaude(
      system,
      `Give a tip for a Year ${year} ${branch} student studying: ${subjects.join(', ') || 'general subjects'}`
    );

    res.json({ tip: tip.trim() });
  } catch (err) {
    console.error('Tip error:', err.message);
    res.status(500).json({ error: 'Claude API failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /ai/extract-text
// Accepts a file upload (PDF, DOCX, PPTX)
// Returns: { text: "extracted content..." }
// ─────────────────────────────────────────────
router.post('/extract-text', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let text = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer, verbosity: VerbosityLevel.ERRORS });
      await parser.load();
      const textResult = await parser.getText();
      text = textResult.text;
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.pptx' || ext === '.ppt') {
      text = await parseOffice(filePath);
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${ext}` });
    }

    // Clean up extracted text: collapse excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    if (!text || text.length < 10) {
      return res.status(422).json({ error: 'Could not extract meaningful text from the file. The file may be image-based or empty.' });
    }

    console.log(`[AI] Extracted ${text.length} chars from ${req.file.originalname}`);
    res.json({ text, filename: req.file.originalname });
  } catch (err) {
    console.error('Text extraction error:', err.message);
    res.status(500).json({ error: 'Failed to extract text from file', detail: err.message });
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch {}
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message?.includes('Only PDF')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
