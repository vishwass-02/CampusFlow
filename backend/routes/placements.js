const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../middleware/supabase');

const CLAUDE = 'https://api.anthropic.com/v1/messages';
const HEADERS = {
  'x-api-key': process.env.ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
};

// GET all placements for a student
router.get('/:studentId', async (req, res) => {
  const { data, error } = await supabase
    .from('placements')
    .select('*')
    .eq('student_id', req.params.studentId)
    .order('applied_date', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST add a company application
router.post('/', async (req, res) => {
  const { student_id, company, role, applied_date, status, current_round, notes, package_lpa } = req.body;
  const { data, error } = await supabase
    .from('placements')
    .insert([{ student_id, company, role, applied_date, status, current_round, notes, package_lpa }])
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// PUT update round / status
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('placements')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// DELETE a placement
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('placements')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Deleted' });
});

// Helper for calling Gemini/Claude
async function askLLM(systemPrompt, userMessage) {
  // If ANTHROPIC_API_KEY is available and not a placeholder, try Claude
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-xxxx') {
    try {
      const response = await axios.post(CLAUDE, {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      }, { headers: HEADERS });
      if (response.data?.content?.[0]?.text) {
        return response.data.content[0].text;
      }
    } catch (err) {
      console.warn(`[AI WARNING] Claude model failed: ${err.message}`);
    }
  }

  // Fallback to Gemini
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

// POST generate weekly AI prep plan
router.post('/ai/prepplan', async (req, res) => {
  const { student_id, placements, branch, year } = req.body;

  const summary = placements.map(p =>
    `${p.company} (${p.role}) — Status: ${p.status}, Round: ${p.current_round}, Rounds cleared: ${(p.rounds_cleared || []).join(', ') || 'none'}`
  ).join('\n');

  const systemPrompt = `You are a placement coach for a ${year}rd year B.Tech ${branch} student.`;

  const prompt = `Here are the companies they have applied to:
${summary}

Generate a personalized 7-day weekly placement prep plan. For each day give:
- A focus topic (DSA / System Design / HR / Core subject / Resume / Mock Interview etc.)
- 2-3 specific tasks with estimated time
- One motivational tip

Reply ONLY with a valid JSON array of 7 objects like:
[
  {
    "day": "Monday",
    "focus": "Arrays & Strings",
    "tasks": ["Solve 3 LeetCode medium array problems (1.5 hrs)", "Revise sliding window technique (30 min)", "Practice explaining solutions out loud (30 min)"],
    "tip": "Consistency beats intensity. 2 hours daily > 14 hours on Sunday."
  }
]
No markdown, no extra text, only the JSON array.`;

  try {
    const raw = await askLLM(systemPrompt, prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(clean);

    // Save to DB
    await supabase.from('prep_plans').insert([{
      student_id,
      week_start: new Date().toISOString().split('T')[0],
      plan_json: plan,
    }]);

    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: 'AI plan generation failed', detail: err.message });
  }
});

// GET latest saved prep plan
router.get('/prepplan/:studentId', async (req, res) => {
  const { data, error } = await supabase
    .from('prep_plans')
    .select('*')
    .eq('student_id', req.params.studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return res.status(404).json({ plan: null });
  res.json({ plan: data.plan_json, created_at: data.created_at });
});

// POST /placements/ai/resume — Resume scorer
router.post('/ai/resume', async (req, res) => {
  const { resumeText, targetRole } = req.body;
  const prompt = `You are an expert technical recruiter reviewing a resume for a "${targetRole}" role.

Resume:
${resumeText}

Give a structured review. Reply ONLY with this JSON (no markdown):
{
  "score": <number 0-100>,
  "verdict": "<one line overall verdict>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "missing_keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "ats_tips": ["<tip 1>", "<tip 2>"]
}`;

  try {
    const { data } = await axios.post(CLAUDE, {
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    }, { headers: HEADERS });
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Resume review failed', detail: err.message });
  }
});

// POST /placements/ai/mockinterview — Mock interview questions
router.post('/ai/mockinterview', async (req, res) => {
  const { company, role, round } = req.body;
  const prompt = `Generate 6 realistic interview questions for a "${role}" role at "${company}" for the "${round}" round.

Reply ONLY with this JSON (no markdown):
[
  {
    "question": "<question text>",
    "type": "<DSA | System Design | HR | Behavioural | Core CS>",
    "hint": "<one sentence hint>",
    "sample_answer": "<2-3 sentence sample answer>"
  }
]`;

  try {
    const { data } = await axios.post(CLAUDE, {
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    }, { headers: HEADERS });
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Mock interview generation failed', detail: err.message });
  }
});

module.exports = router;
