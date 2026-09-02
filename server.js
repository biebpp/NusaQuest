require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
let Groq;
try {
  Groq = require('groq-sdk');
} catch (e) {
  Groq = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const QUIZZES_FILE = path.join(__dirname, 'data', 'quizzes.json');
const TILE_MAP_FILE = path.join(__dirname, 'data', 'tile_map.json');
const TILESHEETS_FILE = path.join(__dirname, 'assets', 'tiles', 'tilesheets.json');
const DIALOGUES_FILE = path.join(__dirname, 'data', 'dialogues.json');
const NPC_PLACEMENTS_FILE = path.join(__dirname, 'data', 'npc_placements.json');
const MAPS_FILE = path.join(__dirname, 'data', 'maps.json');

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


function ensureDataFiles() {
  ensureDirForFile(QUIZZES_FILE);
  if (!fs.existsSync(QUIZZES_FILE)) {
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify({}, null, 2));
  }
}

function readDb(filePath) {
  ensureDataFiles();
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return {};
  }
}

function writeDb(filePath, data) {
  ensureDirForFile(filePath);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}


const NPC_INFO = {
  mbok_sari: {
    name: 'Mbok Sari',
    role: 'Penjual Pasar (Market Seller)',
    persona: 'Market vendor selling fresh vegetables. Teaches numbers, prices, and shopping phrases.',
    vocab: [
      { word: 'sedasa', meaning: 'sepuluh (10)' },
      { word: 'pinten', meaning: 'berapa' },
      { word: 'regine', meaning: 'harganya' },
      { word: 'mundhut', meaning: 'membeli' },
      { word: 'matur nuwun', meaning: 'terima kasih' }
    ]
  },
  pak_joko: {
    name: 'Pak Joko',
    role: 'Petani (Farmer)',
    persona: 'Farmer in rice paddies. Teaches farming, crops, and nature vocabulary.',
    vocab: [
      { word: 'sawah', meaning: 'sawah / ladang' },
      { word: 'pari', meaning: 'padi' },
      { word: 'toya', meaning: 'air' },
      { word: 'panen', meaning: 'panen' },
      { word: 'subur', meaning: 'subur' }
    ]
  },
  dimas: {
    name: 'Dimas',
    role: 'Bocah Desa (Village Kid)',
    persona: 'Village boy playing soccer. Teaches greetings, feelings, and sports.',
    vocab: [
      { word: 'pripun kabare', meaning: 'apa kabar' },
      { word: 'sae', meaning: 'baik / sehat' },
      { word: 'bal-balan', meaning: 'main bola' },
      { word: 'remen', meaning: 'suka' },
      { word: 'kanca', meaning: 'teman' }
    ]
  },
  mbah_kakung: {
    name: 'Mbah Kakung',
    role: 'Sesepuh Joglo (Village Elder)',
    persona: 'Wise elder near the Joglo. Teaches culture, family, and values.',
    vocab: [
      { word: 'kulawarga', meaning: 'keluarga' },
      { word: 'tentrem', meaning: 'tenteram / damai' },
      { word: 'mugi-mugi', meaning: 'semoga' },
      { word: 'balai desa', meaning: 'balai desa' }
    ]
  }
};


let groqClient = null;
if (process.env.GROQ_API_KEY && Groq) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('Groq Client initialized successfully for Quiz Generation (Model: qwen/qwen3.8-27b).');
  } catch (e) {
    console.warn('Groq Client failed to initialize:', e.message);
  }
} else {
  console.log('GROQ_API_KEY not set. Using smart dynamic quiz generator.');
}

function generateFallbackQuiz(npcId, attemptIndex = 1) {
  const npc = NPC_INFO[npcId] || NPC_INFO.mbok_sari;
  
  const questionPool = {
    mbok_sari: [
      {
        question: 'Apa tegese tembung "sedasa" ing basa Indonesia?',
        options: ['Sepuluh (10)', 'Lima (5)', 'Satu (1)', 'Dua puluh (20)'],
        answer: 0,
        explanation: '"Sedasa" tegese sepuluh (10).',
        teaches: { word: 'sedasa', meaning: 'sepuluh (10)' }
      },
      {
        question: 'Tembung "pinten" digunakake kanggo takon babagan apa?',
        options: ['Waktu (Kapan)', 'Jumlah / Harga (Berapa)', 'Tempat (Di mana)', 'Nama orang (Siapa)'],
        answer: 1,
        explanation: '"Pinten" artine berapa.',
        teaches: { word: 'pinten', meaning: 'berapa' }
      },
      {
        question: 'Kepriye ngandhakake "Terima kasih" ing basa Jawa ngoko/krama?',
        options: ['Sugeng enjing', 'Matur nuwun', 'Pripun kabare', 'Sae-sae mawon'],
        answer: 1,
        explanation: '"Matur nuwun" tegese terima kasih.',
        teaches: { word: 'matur nuwun', meaning: 'terima kasih' }
      },
      {
        question: 'Apa tegese tembung "mundhut" ing pasar?',
        options: ['Membeli / Beli', 'Menjual', 'Melihat', 'Membuang'],
        answer: 0,
        explanation: '"Mundhut" tegese tuku utawa membeli.',
        teaches: { word: 'mundhut', meaning: 'membeli' }
      }
    ],
    pak_joko: [
      {
        question: 'Apa tegese tembung "sawah" ing basa Indonesia?',
        options: ['Lautan', 'Sawah / Ladang', 'Hutan', 'Pasar'],
        answer: 1,
        explanation: '"Sawah" tegese sawah utawa ladang.',
        teaches: { word: 'sawah', meaning: 'sawah / ladang' }
      },
      {
        question: 'Tembung "pari" tegese apa yen durung diolah dadi beras?',
        options: ['Jagung', 'Padi', 'Gandum', 'Singkong'],
        answer: 1,
        explanation: '"Pari" artine padi.',
        teaches: { word: 'pari', meaning: 'padi' }
      },
      {
        question: 'Tembung "toya" ing basa Jawa tegese apa?',
        options: ['Air', 'Tanah', 'Api', 'Angin'],
        answer: 0,
        explanation: '"Toya" tegese banyu / air.',
        teaches: { word: 'toya', meaning: 'air' }
      }
    ],
    dimas: [
      {
        question: 'Unen-unen "pripun kabare" tegese apa?',
        options: ['Selamat tinggal', 'Apa kabar', 'Siapa namamu', 'Mau ke mana'],
        answer: 1,
        explanation: '"Pripun kabare" artinya apa kabar.',
        teaches: { word: 'pripun kabare', meaning: 'apa kabar' }
      },
      {
        question: 'Yen ditakoni kabar lan kahananmu sehat, kepriye jawabane?',
        options: ['Sae-sae mawon', 'Mboten ngertos', 'Sampun dhahar', 'Matur nuwun'],
        answer: 0,
        explanation: '"Sae-sae mawon" artine baik-baik saja.',
        teaches: { word: 'sae', meaning: 'baik / sehat' }
      },
      {
        question: 'Olahraga apa sing dimaksud "bal-balan"?',
        options: ['Bulu tangkis', 'Sepak bola', 'Bola voli', 'Renang'],
        answer: 1,
        explanation: '"Bal-balan" artinya bermain sepak bola.',
        teaches: { word: 'bal-balan', meaning: 'main bola' }
      }
    ],
    mbah_kakung: [
      {
        question: 'Apa tegese tembung "kulawarga"?',
        options: ['Tetangga', 'Keluarga', 'Masyarakat', 'Teman'],
        answer: 1,
        explanation: '"Kulawarga" tegese keluarga.',
        teaches: { word: 'kulawarga', meaning: 'keluarga' }
      },
      {
        question: 'Tembung "tentrem" tegese apa?',
        options: ['Ramai', 'Tenteram / Damai', 'Sedih', 'Marah'],
        answer: 1,
        explanation: '"Tentrem" tegese tenteram dan damai.',
        teaches: { word: 'tentrem', meaning: 'tenteram' }
      }
    ]
  };

  const pool = questionPool[npcId] || questionPool.mbok_sari;
  const startIndex = (attemptIndex - 1) % pool.length;
  const selectedQuestions = [];
  for (let i = 0; i < Math.min(3, pool.length); i++) {
    const q = pool[(startIndex + i) % pool.length];
    selectedQuestions.push({
      id: i + 1,
      ...q
    });
  }

  return {
    npcId,
    title: `Kuis Tembung — ${npc.name} (Kuis #${attemptIndex})`,
    generatedAt: new Date().toISOString(),
    questions: selectedQuestions
  };
}


app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    aiQuizEnabled: !!groqClient,
    model: 'qwen/qwen3.8-27b'
  });
});


app.post('/api/npc/quiz', async (req, res) => {
  try {
    const { npcId = 'mbok_sari' } = req.body;
    const db = readDb(QUIZZES_FILE);

    let rawHistory = db[npcId];
    let previousQuizHistory = [];

    if (Array.isArray(rawHistory)) {
      previousQuizHistory = rawHistory;
    } else if (rawHistory && typeof rawHistory === 'object') {
      if (Array.isArray(rawHistory.questions)) {
        previousQuizHistory = [rawHistory];
      } else {
        previousQuizHistory = Object.values(rawHistory).flatMap(val => 
          Array.isArray(val) ? val : (val && val.questions ? [val] : [])
        );
      }
    }

    const previousQuestions = [];
    previousQuizHistory.forEach(qSet => {
      if (qSet && Array.isArray(qSet.questions)) {
        qSet.questions.forEach(q => {
          if (q && q.question) previousQuestions.push(q.question);
        });
      }
    });

    console.log(`[QUIZ REQ] NPC: ${npcId} | Prev Quizzes: ${previousQuizHistory.length} | Prev Questions Count: ${previousQuestions.length}`);

    let generatedQuiz = null;

    if (groqClient) {
      try {
        const npcMeta = NPC_INFO[npcId] || NPC_INFO.mbok_sari;
        const prevQuestionsText = previousQuestions.length > 0 
          ? previousQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')
          : '(No previous questions generated yet.)';

        const vocabListText = npcMeta.vocab.map(v => `- ${v.word}: ${v.meaning}`).join('\n');

        const prompt = `
You are generating a NEW interactive multiple-choice Javanese quiz for NPC "${npcMeta.name}" (${npcMeta.role}) in NusaQuest.

VOCABULARY TAUGHT BY THIS NPC:
${vocabListText}

PREVIOUS QUESTIONS ALREADY GIVEN TO THE PLAYER (DO NOT REPEAT THESE QUESTIONS!):
${prevQuestionsText}

INSTRUCTIONS:
1. Generate a NEW, UNIQUE 3-question quiz testing Javanese vocabulary, sentence translations, or cultural meanings related to ${npcMeta.name}.
2. CRITICAL: Read the PREVIOUS QUESTIONS list carefully! Do NOT repeat or duplicate questions that were already asked before. Create new angles, different options, or ask about other Javanese words taught by this NPC.
3. Provide 4 options per question (indices 0 to 3) and set "answer" to the integer index of the correct option.
4. Add a "teaches" object with "word" and "meaning" for the vocabulary word tested in each question.
5. Output MUST be strict valid JSON matching this schema:
{
  "title": "Kuis Tembung ${npcMeta.name}",
  "questions": [
    {
      "id": 1,
      "question": "Apa tegese tembung 'sedasa' in basa Indonesia?",
      "options": ["Sepuluh (10)", "Lima (5)", "Dua (2)", "Satu (1)"],
      "answer": 0,
      "explanation": "'Sedasa' tegese sepuluh (10).",
      "teaches": {
        "word": "sedasa",
        "meaning": "sepuluh (10)"
      }
    }
  ]
}
`;

        const completion = await groqClient.chat.completions.create({
          model: 'qwen/qwen3.8-27b',
          messages: [
            { role: 'system', content: 'You output strictly valid JSON quiz objects for Javanese learning games.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          generatedQuiz = {
            id: `quiz_${Date.now()}`,
            npcId,
            title: parsed.title || `Kuis Tembung — ${npcMeta.name}`,
            generatedAt: new Date().toISOString(),
            questions: parsed.questions
          };
          console.log(`Groq (qwen/qwen3.8-27b) generated fresh quiz for NPC ${npcId}!`);
        }
      } catch (aiErr) {
        console.error('Groq Quiz error:', aiErr.message);
      }
    }

  
    if (!generatedQuiz) {
      const attemptCount = previousQuizHistory.length + 1;
      console.log(`[FALLBACK DYNAMIC] Generating fallback quiz variant #${attemptCount} for NPC ${npcId}`);
      generatedQuiz = generateFallbackQuiz(npcId, attemptCount);
    }

   
    previousQuizHistory.push(generatedQuiz);
    db[npcId] = previousQuizHistory;
    writeDb(QUIZZES_FILE, db);
    console.log(`Saved newly generated quiz to data/quizzes.json (Total quizzes for ${npcId} = ${previousQuizHistory.length})`);

    return res.json({
      source: groqClient ? 'groq_ai' : 'fallback_generator',
      quiz: generatedQuiz
    });

  } catch (err) {
    console.error('Error in /api/npc/quiz:', err);
    res.status(500).json({ error: 'Failed to process quiz request', details: err.message });
  }
});




app.get('/api/database/view', (req, res) => {
  const quizzes = readDb(QUIZZES_FILE);
  res.json({
    quizzesFile: QUIZZES_FILE,
    npcsCount: Object.keys(quizzes).length,
    quizzes

  });
});

app.get('/api/tile-map', (req, res) => {
  const tileMap = readDb(TILE_MAP_FILE);
  res.json(tileMap);
});

app.post('/api/tile-map', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const ok = writeDb(TILE_MAP_FILE, data);
  if (ok) {
    console.log('Auto-saved data/tile_map.json');
    res.json({ status: 'ok', file: 'data/tile_map.json' });
  } else {
    res.status(500).json({ error: 'Failed to write data/tile_map.json' });
  }
});


app.get('/api/tilesheets', (req, res) => {
  const tilesheets = readDb(TILESHEETS_FILE);
  res.json(tilesheets);
});

app.post('/api/tilesheets', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const ok = writeDb(TILESHEETS_FILE, data);
  if (ok) {
    console.log('Auto-saved assets/tiles/tilesheets.json');
    res.json({ status: 'ok', file: 'assets/tiles/tilesheets.json' });
  } else {
    res.status(500).json({ error: 'Failed to write assets/tiles/tilesheets.json' });
  }
});

app.get('/api/dialogues', (req, res) => {
  const dialogues = readDb(DIALOGUES_FILE);
  res.json(dialogues);
});

app.post('/api/dialogues', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const ok = writeDb(DIALOGUES_FILE, data);
  if (ok) {
    console.log('Auto-saved data/dialogues.json');
    res.json({ status: 'ok', file: 'data/dialogues.json' });
  } else {
    res.status(500).json({ error: 'Failed to write data/dialogues.json' });
  }
});


app.get('/api/npc-placements', (req, res) => {
  const placements = readDb(NPC_PLACEMENTS_FILE);
  res.json(placements);
});

app.post('/api/npc-placements', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const ok = writeDb(NPC_PLACEMENTS_FILE, data);
  if (ok) {
    console.log('Auto-saved data/npc_placements.json');
    res.json({ status: 'ok', file: 'data/npc_placements.json' });
  } else {
    res.status(500).json({ error: 'Failed to write data/npc_placements.json' });
  }
});

app.get('/api/maps', (req, res) => {
  const maps = readDb(MAPS_FILE);
  res.json(maps);
});

app.post('/api/maps', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const ok = writeDb(MAPS_FILE, data);
  if (ok) {
    console.log('Auto-saved data/maps.json');
    res.json({ status: 'ok', file: 'data/maps.json' });
  } else {
    res.status(500).json({ error: 'Failed to write data/maps.json' });
  }
});


app.get('/api/npc-config', (req, res) => {
  const dialogues = readDb(DIALOGUES_FILE);
  const npcPlacements = readDb(NPC_PLACEMENTS_FILE);
  res.json({ dialogues, npcPlacements });
});

app.post('/api/npc-config', (req, res) => {
  const { dialogues, npcPlacements } = req.body || {};
  let ok = true;
  if (dialogues) {
    ok = writeDb(DIALOGUES_FILE, dialogues) && ok;
    console.log('Auto-saved data/dialogues.json');
  }
  if (npcPlacements) {
    ok = writeDb(NPC_PLACEMENTS_FILE, npcPlacements) && ok;
    console.log('Auto-saved data/npc_placements.json');
  }
  if (ok) {
    res.json({ status: 'ok', message: 'Saved NPC dialogues and placements to JSON' });
  } else {
    res.status(500).json({ error: 'Failed to save NPC configuration' });
  }
});

app.listen(PORT, () => {
  console.log(`NusaQuest running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
