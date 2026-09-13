class SoundManager {
  constructor() {
    this.muted = false;
    this.initialized = false;
    this.currentAmbientMode = null;
    this.currentDialogueAudio = null;
    this.fadeInterval = null;

    try {
      const savedMute = localStorage.getItem('nusaquest_muted');
      if (savedMute !== null) {
        this.muted = savedMute === 'true';
      }
    } catch (e) { }

    this.sfx = {
      dialog: new Audio('/assets/sfx/dialog.mp3'),
      atif: new Audio('/assets/sfx/atip russia.mp3'),
      correct: new Audio('/assets/sfx/correct.mp3'),
      incorrect: new Audio('/assets/sfx/incorrect.wav')
    };

    this.ambient = {
      outdoor: new Audio('/assets/sfx/ambient_outdoor.mp3'),
      indoor: new Audio('/assets/sfx/ambient_indoor.wav')
    };

    this.sfx.dialog.loop = true;
    this.sfx.dialog.volume = 0.45;

    this.sfx.atif.loop = true;
    this.sfx.atif.volume = 0.50;

    this.sfx.correct.volume = 0.65;
    this.sfx.incorrect.volume = 0.55;

    this.ambient.outdoor.loop = true;
    this.ambient.outdoor.volume = 0;

    this.ambient.indoor.loop = true;
    this.ambient.indoor.volume = 0;

    this.bindUnlockListener();
  }

  bindUnlockListener() {
    const unlock = () => {
      this.initialized = true;
      if (this.currentAmbientMode) {
        this.playAmbient(this.currentAmbientMode);
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('nusaquest_muted', String(this.muted));
    } catch (e) { }

    if (this.muted) {
      this.stopDialogueSfx();
      if (this.ambient.outdoor) this.ambient.outdoor.volume = 0;
      if (this.ambient.indoor) this.ambient.indoor.volume = 0;
    } else {
      if (this.currentAmbientMode) {
        this.playAmbient(this.currentAmbientMode, true);
      }
    }

    this.updateMuteUI();
    return this.muted;
  }

  setMute(isMuted) {
    this.muted = !!isMuted;
    try {
      localStorage.setItem('nusaquest_muted', String(this.muted));
    } catch (e) { }

    if (this.muted) {
      this.stopDialogueSfx();
      if (this.ambient.outdoor) this.ambient.outdoor.volume = 0;
      if (this.ambient.indoor) this.ambient.indoor.volume = 0;
    } else {
      if (this.currentAmbientMode) {
        this.playAmbient(this.currentAmbientMode, true);
      }
    }
    this.updateMuteUI();
  }

  isMuted() {
    return this.muted;
  }

  updateAmbientForMap(mapId, mapName = '') {
    const isIndoor = this.isIndoorMap(mapId, mapName);
    const targetMode = isIndoor ? 'indoor' : 'outdoor';
    this.currentAmbientMode = targetMode;

    if (this.initialized) {
      this.playAmbient(targetMode);
    }
  }

  isIndoorMap(mapId, mapName = '') {
    const id = (mapId || '').toLowerCase();
    const name = (mapName || '').toLowerCase();
    return name.includes('indoor') || id.includes('indoor') || id.includes('rumah') || id.includes('istana') || id.includes('balai');
  }

  playAmbient(targetMode, immediate = false) {
    if (this.muted) return;

    const targetVolume = 0.26;
    const activeAudio = targetMode === 'indoor' ? this.ambient.indoor : this.ambient.outdoor;
    const inactiveAudio = targetMode === 'indoor' ? this.ambient.outdoor : this.ambient.indoor;

    try {
      if (activeAudio.paused) {
        activeAudio.play().catch(() => { });
      }
    } catch (e) { }

    if (immediate) {
      if (this.fadeInterval) clearInterval(this.fadeInterval);
      activeAudio.volume = targetVolume;
      inactiveAudio.volume = 0;
      try { inactiveAudio.pause(); } catch (e) { }
      return;
    }

    if (this.fadeInterval) clearInterval(this.fadeInterval);

    let step = 0;
    const totalSteps = 20;
    const initialActiveVol = activeAudio.volume;
    const initialInactiveVol = inactiveAudio.volume;

    this.fadeInterval = setInterval(() => {
      step++;
      const progress = Math.min(step / totalSteps, 1.0);

      activeAudio.volume = initialActiveVol + (targetVolume - initialActiveVol) * progress;
      inactiveAudio.volume = Math.max(0, initialInactiveVol * (1.0 - progress));

      if (step >= totalSteps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        activeAudio.volume = targetVolume;
        inactiveAudio.volume = 0;
        try {
          inactiveAudio.pause();
        } catch (e) { }
      }
    }, 50);
  }

  startDialogueSfx(npc) {
    if (this.muted) return;

    this.stopDialogueSfx();

    const isRadenAtif = npc && (
      npc.id === 'raden_atif' ||
      (typeof npc.name === 'string' && npc.name.toLowerCase().includes('atif'))
    );

    const targetAudio = isRadenAtif ? this.sfx.atif : this.sfx.dialog;
    this.currentDialogueAudio = targetAudio;

    try {
      targetAudio.currentTime = 0;
      const playPromise = targetAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { });
      }
    } catch (err) { }
  }

  stopDialogueSfx() {
    if (this.currentDialogueAudio) {
      try {
        this.currentDialogueAudio.pause();
        this.currentDialogueAudio.currentTime = 0;
      } catch (e) { }
      this.currentDialogueAudio = null;
    }
    try {
      this.sfx.dialog.pause();
      this.sfx.dialog.currentTime = 0;
      this.sfx.atif.pause();
      this.sfx.atif.currentTime = 0;
    } catch (e) { }
  }

  playCorrect() {
    if (this.muted) return;
    try {
      const correctSound = this.sfx.correct.cloneNode();
      correctSound.volume = 0.65;
      const playPromise = correctSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { });
      }
    } catch (e) { }
  }

  playIncorrect() {
    if (this.muted) return;
    try {
      const wrongSound = this.sfx.incorrect.cloneNode();
      wrongSound.volume = 0.55;
      const playPromise = wrongSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { });
      }
    } catch (e) { }
  }

  updateMuteUI() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      if (this.muted) {
        btn.innerHTML = '<i data-lucide="volume-x" style="width: 14px; height: 14px;"></i> Suara (M)';
        btn.classList.add('muted');
      } else {
        btn.innerHTML = '<i data-lucide="volume-2" style="width: 14px; height: 14px;"></i> Suara (M)';
        btn.classList.remove('muted');
      }
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }
  }
}

window.SoundManager = new SoundManager();
