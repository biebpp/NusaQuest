const DIALOGUES = {};

if (typeof fetch !== 'undefined') {
  fetch('data/dialogues.json')
    .then(res => res.json())
    .then(data => {
      if (data && Object.keys(data).length > 0) {
        Object.assign(DIALOGUES, data);
        console.log('NusaQuest: Loaded DIALOGUES from data/dialogues.json');
      }
    })
    .catch(() => {});
}

if (typeof localStorage !== 'undefined' && localStorage.getItem('NUSAQUEST_DIALOGUES')) {
  try {
    const savedDialogues = JSON.parse(localStorage.getItem('NUSAQUEST_DIALOGUES'));
    if (savedDialogues) {
      Object.assign(DIALOGUES, savedDialogues);
    }
  } catch (e) {}
}

const TOTAL_VOCAB_COUNT = 11;

async function fetchNpcQuiz(npcId) {
  try {
    const res = await fetch('/api/npc/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npcId })
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data && data.quiz) {
      return data.quiz;
    }
  } catch (err) {
    console.warn(`[API] Could not fetch quiz from server (${err.message}). Using local fallback.`);
  }

  return {
    npcId,
    title: `Kuis Tembung — ${DIALOGUES[npcId] ? DIALOGUES[npcId].name : 'NPC'}`,
    questions: [
      {
        id: 1,
        question: 'Apa tegese tembung "sedasa"?',
        options: ['Sepuluh (10)', 'Lima (5)', 'Satu (1)', 'Dua puluh (20)'],
        answer: 0,
        explanation: '"Sedasa" tegese sepuluh.'
      },
      {
        id: 2,
        question: 'Tembung "pinten" digunakake kanggo takon babagan apa?',
        options: ['Waktu', 'Jumlah / Harga', 'Tempat', 'Nama'],
        answer: 1,
        explanation: '"Pinten" artine berapa.'
      }
    ]
  };
}
