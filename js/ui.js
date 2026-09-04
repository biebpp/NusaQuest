class UIManager {
  constructor() {
    this.learnedVocab = new Map();
    this.isNotebookCollapsed = false;
    
    this.currentQuiz = null;
    this.currentQuestionIdx = 0;
    this.selectedOptionIdx = null;
    this.answeredCurrentQuestion = false;
    this.score = 0;
    this.onQuizComplete = null;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.dialogueBox = document.getElementById('dialogueBox');
    this.aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    this.dialogueContent = this.dialogueBox ? this.dialogueBox.querySelector('.dialogue-content') : null;
    this.dialogueFooter = this.dialogueBox ? this.dialogueBox.querySelector('.dialogue-footer') : null;
    this.portraitCanvas = document.getElementById('portraitCanvas');
    this.npcName = document.getElementById('npcName');
    this.javaneseText = document.getElementById('javaneseText');
    this.indonesianText = document.getElementById('indonesianText');
    this.nextBtn = document.getElementById('nextBtn');

    this.vocabNotebook = document.getElementById('vocabNotebook');
    this.toggleNotebookBtn = document.getElementById('toggleNotebookBtn');
    this.vocabCounter = document.getElementById('vocabCounter');
    this.vocabList = document.getElementById('vocabList');
    this.toastContainer = document.getElementById('toastContainer');

    this.quizModal = document.getElementById('quizModal');
    this.quizTitle = document.getElementById('quizTitle');
    this.quizProgress = document.getElementById('quizProgress');
    this.quizQuestion = document.getElementById('quizQuestion');
    this.quizOptions = document.getElementById('quizOptions');
    this.quizFeedback = document.getElementById('quizFeedback');
    this.nextQuizBtn = document.getElementById('nextQuizBtn');
    this.closeQuizBtn = document.getElementById('closeQuizBtn');
  }

  bindEvents() {
    if (this.toggleNotebookBtn) {
      this.toggleNotebookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.toggleNotebook();
      });
    }

    if (this.closeQuizBtn) {
      this.closeQuizBtn.addEventListener('click', () => this.hideQuizModal());
    }

    if (this.nextQuizBtn) {
      this.nextQuizBtn.addEventListener('click', () => this.handleNextQuestion());
    }
  }

  showDialogueLoading(npc) {
    if (!this.dialogueBox) return;
    this.dialogueBox.classList.remove('hidden');

    if (this.aiLoadingIndicator) this.aiLoadingIndicator.classList.remove('hidden');
    if (this.dialogueContent) this.dialogueContent.style.display = 'none';
    if (this.dialogueFooter) this.dialogueFooter.style.display = 'none';
  }

  setAiLoading(isLoading) {
    if (!this.aiLoadingIndicator) return;
    if (isLoading) {
      this.aiLoadingIndicator.classList.remove('hidden');
    } else {
      this.aiLoadingIndicator.classList.add('hidden');
    }
  }

  toggleNotebook() {
    this.isNotebookCollapsed = !this.isNotebookCollapsed;
    if (this.isNotebookCollapsed) {
      this.vocabNotebook.classList.add('collapsed');
      if (this.toggleNotebookBtn) this.toggleNotebookBtn.innerText = '+';
    } else {
      this.vocabNotebook.classList.remove('collapsed');
      if (this.toggleNotebookBtn) this.toggleNotebookBtn.innerText = '−';
    }
  }

  showDialogue(npc, lineIndex) {
    const line = npc.dialogue[lineIndex];
    if (!line) return;

    this.dialogueBox.classList.remove('hidden');

    if (this.aiLoadingIndicator) this.aiLoadingIndicator.classList.add('hidden');
    if (this.dialogueContent) this.dialogueContent.style.display = 'flex';
    if (this.dialogueFooter) this.dialogueFooter.style.display = 'flex';

    this.npcName.innerText = `${npc.name} • ${npc.role}`;
    this.javaneseText.innerText = `"${line.javanese}"`;
    this.indonesianText.innerText = `(${line.indonesian})`;

    this.renderPortrait(npc);
  }

  hideDialogue() {
    this.dialogueBox.classList.add('hidden');
    if (this.aiLoadingIndicator) this.aiLoadingIndicator.classList.add('hidden');
  }

  renderPortrait(npc) {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);

    const img = AssetManager.images.characters;
    if (img && img.complete && img.naturalWidth !== 0) {
      const srcX = npc.charIndex * 3 * 26 + 26;
      const srcY = 0;
      ctx.drawImage(img, srcX, srcY, 26, 36, 6, 2, 52, 60);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 8, 48, 48);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText(npc.name ? npc.name[0] : 'N', 22, 40);
    }
  }

  addVocab(word, meaning) {
    if (!word || this.learnedVocab.has(word)) return;

    this.learnedVocab.set(word, meaning);
    this.updateVocabUI(word, meaning);
    this.showToast(`+1 Kata Baru: ${word}!`);
  }

  updateVocabUI(newWord, newMeaning) {
    const emptyMsg = this.vocabList.querySelector('.empty-msg');
    if (emptyMsg) {
      emptyMsg.remove();
    }

    const li = document.createElement('li');
    li.className = 'vocab-item';
    li.innerHTML = `
      <div class="vocab-javanese">${newWord}</div>
      <div class="vocab-indonesian">${newMeaning}</div>
    `;
    this.vocabList.appendChild(li);
    this.vocabList.scrollTop = this.vocabList.scrollHeight;

    this.vocabCounter.innerText = `${this.learnedVocab.size} kata`;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  isQuizActive() {
    return !!this.currentQuiz && this.quizModal && !this.quizModal.classList.contains('hidden');
  }

  showQuizModal(quizData, onComplete = null) {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) return;

    this.currentQuiz = quizData;
    this.currentQuestionIdx = 0;
    this.selectedOptionIdx = null;
    this.answeredCurrentQuestion = false;
    this.score = 0;
    this.onQuizComplete = onComplete;

    this.quizTitle.innerText = quizData.title || 'Kuis Tembung NPC';
    this.quizModal.classList.remove('hidden');

    this.renderQuestion();
  }

  hideQuizModal() {
    this.quizModal.classList.add('hidden');
    this.currentQuiz = null;
    if (this.onQuizComplete) {
      this.onQuizComplete(this.score);
    }
  }

  renderQuestion() {
    const q = this.currentQuiz.questions[this.currentQuestionIdx];
    const total = this.currentQuiz.questions.length;

    this.quizProgress.innerText = `Pertanyaan ${this.currentQuestionIdx + 1} dari ${total}`;
    this.quizQuestion.innerText = q.question;
    this.selectedOptionIdx = null;
    this.answeredCurrentQuestion = false;

    this.quizFeedback.classList.add('hidden');
    this.quizFeedback.innerHTML = '';

    this.nextQuizBtn.classList.add('hidden');

    this.quizOptions.innerHTML = '';
    q.options.forEach((optText, idx) => {
      const card = document.createElement('div');
      card.className = 'quiz-option-card';
      card.innerText = `${String.fromCharCode(65 + idx)}. ${optText}`;
      card.dataset.idx = idx;

      card.addEventListener('click', () => {
        if (this.answeredCurrentQuestion) return;
        this.selectAndCheckAnswer(idx, q);
      });

      this.quizOptions.appendChild(card);
    });
  }

  selectAndCheckAnswer(selectedIdx, q) {
    this.answeredCurrentQuestion = true;
    this.selectedOptionIdx = selectedIdx;
    const isCorrect = selectedIdx === q.answer;

    const cards = this.quizOptions.querySelectorAll('.quiz-option-card');
    cards.forEach((card, idx) => {
      if (idx === q.answer) {
        card.classList.add('correct');
      } else if (idx === selectedIdx && !isCorrect) {
        card.classList.add('incorrect');
      }
    });

    this.quizFeedback.classList.remove('hidden');
    if (isCorrect) {
      this.score++;
      this.quizFeedback.className = 'quiz-feedback success';
      this.quizFeedback.innerHTML = `<strong>Bener!</strong> ${q.explanation || ''}`;

      if (q.teaches && q.teaches.word) {
        this.addVocab(q.teaches.word, q.teaches.meaning);
      } else {
        this.extractAndAddVocabFromQuestion(q);
      }
    } else {
      this.quizFeedback.className = 'quiz-feedback error';
      this.quizFeedback.innerHTML = `<strong>Kurang tepat.</strong> ${q.explanation || ''}`;
    }

    this.nextQuizBtn.classList.remove('hidden');
    if (this.currentQuestionIdx === this.currentQuiz.questions.length - 1) {
      this.nextQuizBtn.innerText = 'Selesai';
    } else {
      this.nextQuizBtn.innerText = 'Lanjut ▶';
    }
  }

  extractAndAddVocabFromQuestion(q) {
    const vocabList = [
      { word: 'sedasa', meaning: 'sepuluh (10)' },
      { word: 'pinten', meaning: 'berapa' },
      { word: 'matur nuwun', meaning: 'terima kasih' },
      { word: 'mundhut', meaning: 'membeli' },
      { word: 'regine', meaning: 'harganya' },
      { word: 'sawah', meaning: 'sawah / ladang' },
      { word: 'pari', meaning: 'padi' },
      { word: 'toya', meaning: 'air' },
      { word: 'panen', meaning: 'panen' },
      { word: 'subur', meaning: 'subur' },
      { word: 'pripun kabare', meaning: 'apa kabar' },
      { word: 'sae', meaning: 'baik / sehat' },
      { word: 'bal-balan', meaning: 'main bola' },
      { word: 'kulawarga', meaning: 'keluarga' },
      { word: 'tentrem', meaning: 'tenteram / damai' }
    ];

    const textToSearch = `${q.question} ${q.explanation || ''}`.toLowerCase();
    for (const v of vocabList) {
      if (textToSearch.includes(v.word.toLowerCase())) {
        this.addVocab(v.word, v.meaning);
        break;
      }
    }
  }

  handleNextQuestion() {
    if (this.currentQuestionIdx < this.currentQuiz.questions.length - 1) {
      this.currentQuestionIdx++;
      this.renderQuestion();
    } else {
      const total = this.currentQuiz.questions.length;
      this.showToast(`Kuis Selesai! Skor: ${this.score} / ${total}`);
      this.hideQuizModal();
    }
  }
}
