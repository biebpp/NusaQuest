class QuestEngine {
  constructor(uiManager = null) {
    this.uiManager = uiManager;
    this.quests = [];
    this.playerXP = 0;
    this.badges = [];
    this.isLoaded = false;

    this.defaultQuests = [
      {
        id: "quest_1",
        title: "Misi Belanja ing Pasar Gede",
        description: "Bantu Mbok Sari ing pasar lan sinau basa Jawa seputar angka & harga.",
        npcId: "mbok_sari",
        npcName: "Mbok Sari",
        status: "IN_PROGRESS",
        reward: {
          xp: 100,
          badge: "Lencana Pasar Gede",
          icon: "🛍️"
        },
        steps: [
          {
            id: "step_1",
            description: "Bicara dengan Mbok Sari di pasar.",
            type: "TALK_NPC",
            targetNpc: "mbok_sari",
            completed: false
          },
          {
            id: "step_2",
            description: "Pelajari 3 kata seputar angka & harga (sedasa, pinten, regine).",
            type: "LEARN_VOCAB",
            targetWords: ["sedasa", "pinten", "regine"],
            completed: false
          },
          {
            id: "step_3",
            description: "Selesaikan Kuis Pasar dengan skor sempurna.",
            type: "PERFECT_QUIZ",
            targetNpc: "mbok_sari",
            completed: false
          }
        ]
      },
      {
        id: "quest_2",
        title: "Misi Sowan marang Omah Pak RT",
        description: "Sowan marang Omah Pak RT / Balai Desa lan sinau basa Krama kanggo bertamu.",
        npcId: "mbah_kakung",
        npcName: "Pak RT / Mbah Kakung",
        status: "UNSTARTED",
        reward: {
          xp: 150,
          badge: "Lencana Tata Krama",
          icon: "🏛️"
        },
        steps: [
          {
            id: "step_1",
            description: "Cari rumah Pak RT di peta.",
            type: "VISIT_MAP",
            targetMap: "balai_indoor",
            completed: false
          },
          {
            id: "step_2",
            description: "Lakukan peragaan bertamu menggunakan bahasa Krama (sugeng rawuh, kulawarga).",
            type: "TALK_OR_VOCAB",
            targetNpc: "mbah_kakung",
            targetWords: ["sugeng rawuh", "kulawarga"],
            completed: false
          }
        ]
      }
    ];

    this.init();
  }

  setUiManager(uiManager) {
    this.uiManager = uiManager;
  }

  async init() {
    this.quests = JSON.parse(JSON.stringify(this.defaultQuests));

    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/data/quests.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.quests = data.map(q => ({
              ...q,
              status: q.status || 'UNSTARTED',
              steps: q.steps.map(s => ({ ...s, completed: false }))
            }));
          }
        }
      }
    } catch (e) {
      console.warn('[QuestEngine] Using default fallback quests:', e.message);
    }

    this.loadState();
    this.isLoaded = true;

    if (this.uiManager) {
      this.uiManager.updateQuestTracker();
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('NUSAQUEST_QUESTS_STATE');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playerXP !== undefined) this.playerXP = parsed.playerXP;
        if (Array.isArray(parsed.badges)) this.badges = parsed.badges;

        if (parsed.questsState && typeof parsed.questsState === 'object') {
          this.quests.forEach(q => {
            const state = parsed.questsState[q.id];
            if (state) {
              q.status = state.status || q.status;
              if (Array.isArray(state.stepsCompleted)) {
                q.steps.forEach((step, idx) => {
                  step.completed = !!state.stepsCompleted[idx];
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('[QuestEngine] Error loading state:', e);
    }

    this.ensureActiveQuestExists();
  }

  saveState() {
    try {
      const questsState = {};
      this.quests.forEach(q => {
        questsState[q.id] = {
          status: q.status,
          stepsCompleted: q.steps.map(s => !!s.completed)
        };
      });

      const dataToSave = {
        playerXP: this.playerXP,
        badges: this.badges,
        questsState
      };

      localStorage.setItem('NUSAQUEST_QUESTS_STATE', JSON.stringify(dataToSave));
    } catch (e) {
      console.error('[QuestEngine] Error saving state:', e);
    }
  }

  ensureActiveQuestExists() {
    const hasActive = this.quests.some(q => q.status === 'IN_PROGRESS');
    if (!hasActive) {
      const firstUncompleted = this.quests.find(q => q.status === 'UNSTARTED');
      if (firstUncompleted) {
        firstUncompleted.status = 'IN_PROGRESS';
      }
    }
  }

  getActiveQuest() {
    return this.quests.find(q => q.status === 'IN_PROGRESS') || null;
  }

  getActiveStep(quest) {
    if (!quest || quest.status !== 'IN_PROGRESS') return null;
    return quest.steps.find(s => !s.completed) || null;
  }

  getActiveStepInstruction() {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) {
      const allCompleted = this.quests.every(q => q.status === 'COMPLETED');
      if (allCompleted) return "🎉 Semua Misi Budaya Selesai!";
      return "Belum ada misi aktif";
    }

    const activeStep = this.getActiveStep(activeQuest);
    if (activeStep) {
      return `📌 Misi: ${activeStep.description}`;
    }

    return `📌 Misi: ${activeQuest.title}`;
  }

  onTalkNpc(npcId) {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) return;

    const activeStep = this.getActiveStep(activeQuest);
    if (!activeStep) return;

    if (activeStep.type === 'TALK_NPC' && activeStep.targetNpc === npcId) {
      this.completeStep(activeQuest, activeStep);
    } else if (activeStep.type === 'TALK_OR_VOCAB' && activeStep.targetNpc === npcId) {
      if (this.checkTargetWordsLearned(activeStep.targetWords)) {
        this.completeStep(activeQuest, activeStep);
      }
    }
  }

  onLearnVocab(learnedWordsMap) {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) return;

    const activeStep = this.getActiveStep(activeQuest);
    if (!activeStep) return;

    if (activeStep.type === 'LEARN_VOCAB' || activeStep.type === 'TALK_OR_VOCAB') {
      if (this.checkTargetWordsLearned(activeStep.targetWords, learnedWordsMap)) {
        this.completeStep(activeQuest, activeStep);
      }
    }
  }

  checkTargetWordsLearned(targetWords, wordsMap = null) {
    if (!targetWords || targetWords.length === 0) return true;

    let learnedMap = wordsMap;
    if (!learnedMap && this.uiManager && this.uiManager.learnedVocab) {
      learnedMap = this.uiManager.learnedVocab;
    }
    if (!learnedMap) return false;

    return targetWords.every(word => {
      const targetClean = word.trim().toLowerCase();
      for (const [w] of learnedMap.entries()) {
        if (w.trim().toLowerCase().includes(targetClean) || targetClean.includes(w.trim().toLowerCase())) {
          return true;
        }
      }
      return false;
    });
  }

  onQuizComplete(npcId, score, totalQuestions) {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) return;

    const activeStep = this.getActiveStep(activeQuest);
    if (!activeStep) return;

    if (activeStep.type === 'PERFECT_QUIZ' && activeStep.targetNpc === npcId) {
      if (score === totalQuestions && totalQuestions > 0) {
        this.completeStep(activeQuest, activeStep);
      } else {
        if (this.uiManager) {
          this.uiManager.showToast(`Kuis butuh skor sempurna (3/3) kanggo nyelesaike langkah misi!`);
        }
      }
    }
  }

  onMapEnter(mapId) {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) return;

    const activeStep = this.getActiveStep(activeQuest);
    if (!activeStep) return;

    if (activeStep.type === 'VISIT_MAP' && activeStep.targetMap === mapId) {
      this.completeStep(activeQuest, activeStep);
    }
  }

  completeStep(quest, step) {
    if (step.completed) return;
    step.completed = true;

    if (this.uiManager) {
      this.uiManager.showToast(`✅ Langkah Selesai: ${step.description}`);
    }

    const allStepsDone = quest.steps.every(s => s.completed);
    if (allStepsDone) {
      this.completeQuest(quest);
    } else {
      this.saveState();
      if (this.uiManager) {
        this.uiManager.updateQuestTracker();
        this.uiManager.renderQuestLog();
      }
    }
  }

  completeQuest(quest) {
    quest.status = 'COMPLETED';

    const xpEarned = (quest.reward && quest.reward.xp) ? quest.reward.xp : 100;
    const badgeEarned = (quest.reward && quest.reward.badge) ? quest.reward.badge : 'Lencana Budaya';
    const icon = (quest.reward && quest.reward.icon) ? quest.reward.icon : '🏅';

    this.playerXP += xpEarned;
    if (!this.badges.includes(badgeEarned)) {
      this.badges.push(badgeEarned);
    }

    if (this.uiManager) {
      this.uiManager.showToast(`🎉 QUEST SELESAI: ${quest.title}!`);
      this.uiManager.showToast(`🏆 +${xpEarned} XP | Hadiah: ${icon} ${badgeEarned}`);
    }

    const nextQuest = this.quests.find(q => q.status === 'UNSTARTED');
    if (nextQuest) {
      nextQuest.status = 'IN_PROGRESS';
      if (this.uiManager) {
        this.uiManager.showToast(`📌 Misi Baru Terbuka: ${nextQuest.title}`);
      }
    }

    this.saveState();

    if (this.uiManager) {
      this.uiManager.updateQuestTracker();
      this.uiManager.renderQuestLog();
    }
  }

  getAllQuests() {
    return this.quests;
  }

  getPlayerXP() {
    return this.playerXP;
  }

  getPlayerBadges() {
    return this.badges;
  }
}
