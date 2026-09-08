const DIALOGUES = {};

function initDialogues() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('NUSAQUEST_DIALOGUES')) {
    try {
      const savedDialogues = JSON.parse(localStorage.getItem('NUSAQUEST_DIALOGUES'));
      if (savedDialogues && typeof savedDialogues === 'object') {
        Object.assign(DIALOGUES, savedDialogues);
      }
    } catch (e) {}
  }

  if (typeof fetch !== 'undefined') {
    fetch('/data/dialogues.json')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          // Merge server data while retaining any locally added/edited dialogues
          for (const [id, d] of Object.entries(data)) {
            if (!DIALOGUES[id]) {
              DIALOGUES[id] = d;
            } else {
              DIALOGUES[id] = Object.assign({}, d, DIALOGUES[id]);
            }
          }
          console.log('NusaQuest: Synced DIALOGUES from data/dialogues.json');
        }
      })
      .catch(() => {});
  }
}

initDialogues();

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

  const dialogData = DIALOGUES[npcId] || {};
  const npcName = dialogData.name || (npcId ? npcId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'NPC');
  const vocabItems = [];

  if (Array.isArray(dialogData.vocab)) {
    vocabItems.push(...dialogData.vocab);
  }

  if (Array.isArray(dialogData.lines)) {
    dialogData.lines.forEach(l => {
      if (l.teaches && l.teaches.word) {
        vocabItems.push({ word: l.teaches.word, meaning: l.teaches.meaning });
      } else if (l.javanese && l.indonesian && vocabItems.length === 0) {
        vocabItems.push({ word: l.javanese, meaning: l.indonesian });
      }
    });
  }

  const questions = [];
  const distractorPool = ['Selamat', 'Terima kasih', 'Berapa', 'Keluarga', 'Baik / Sehat', 'Sawah / Ladang', 'Padi', 'Air'];

  if (vocabItems.length > 0) {
    vocabItems.slice(0, 3).forEach((v, idx) => {
      const options = [v.meaning];
      distractorPool.forEach(d => {
        if (options.length < 4 && d !== v.meaning) options.push(d);
      });
      while (options.length < 4) {
        options.push(`Pilihan ${options.length + 1}`);
      }

      questions.push({
        id: idx + 1,
        question: `Apa tegese tembung "${v.word}"?`,
        options: options,
        answer: 0,
        explanation: `"${v.word}" tegese ${v.meaning}.`,
        teaches: { word: v.word, meaning: v.meaning }
      });
    });
  } else {
    questions.push(
      {
        id: 1,
        question: 'Tembung "Sugeng" ing basa Indonesia tegese apa?',
        options: ['Selamat', 'Terima kasih', 'Maaf', 'Sampai jumpa'],
        answer: 0,
        explanation: '"Sugeng" tegese selamat.'
      },
      {
        id: 2,
        question: 'Tembung "Matur nuwun" tegese apa?',
        options: ['Terima kasih', 'Selamat pagi', 'Apa kabar', 'Sama-sama'],
        answer: 0,
        explanation: '"Matur nuwun" tegese terima kasih.'
      }
    );
  }

  return {
    npcId,
    title: `Kuis Tembung — ${npcName}`,
    questions: questions
  };
}

