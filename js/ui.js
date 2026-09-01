/**
 * NusaQuest — User Interface Manager (Dialogue Box, Vocab Notebook, Hide Toggle, & Toasts)
 */

class UIManager {
  constructor() {
    this.learnedVocab = new Map();
    this.isNotebookCollapsed = false;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.dialogueBox = document.getElementById('dialogueBox');
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
  }

  bindEvents() {
    if (this.toggleNotebookBtn) {
      this.toggleNotebookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.toggleNotebook();
      });
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
    this.dialogueBox.classList.remove('hidden');

    this.npcName.innerText = `${npc.name} • ${npc.role}`;
    this.javaneseText.innerText = `"${line.javanese}"`;
    this.indonesianText.innerText = `(${line.indonesian})`;

    this.renderPortrait(npc);

    if (line.teaches) {
      this.addVocab(line.teaches.word, line.teaches.meaning);
    }
  }

  hideDialogue() {
    this.dialogueBox.classList.add('hidden');
  }

  renderPortrait(npc) {
    if (!this.portraitCanvas) return;
    const ctx = this.portraitCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);

    const img = AssetManager.images.characters;
    if (img && img.complete && img.naturalWidth !== 0) {
      const srcX = npc.charIndex * 3 * 26 + 26; // Idle frame
      const srcY = 0; // Facing down
      ctx.drawImage(img, srcX, srcY, 26, 36, 6, 2, 52, 60);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 8, 48, 48);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText(npc.name[0], 22, 40);
    }
  }

  addVocab(word, meaning) {
    if (this.learnedVocab.has(word)) return;

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

    this.vocabCounter.innerText = `${this.learnedVocab.size} / ${TOTAL_VOCAB_COUNT} kata`;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span> ${message}`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
