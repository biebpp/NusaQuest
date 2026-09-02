class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.currentMapId = 'village';
    this.currentMap = MAPS[this.currentMapId] || {
      id: 'village', name: 'Desa NusaQuest', width: 16, height: 10, tileSize: 48, spawnX: 7, spawnY: 4,
      ground: Array.from({ length: 10 }, () => Array(16).fill(0)),
      objects: Array.from({ length: 10 }, () => Array(16).fill('.')),
      collision: Array.from({ length: 10 }, () => Array(16).fill(0))
    };

    this.player = new Player(this.currentMap.spawnX || 7, this.currentMap.spawnY || 4);
    this.npcManager = new NpcManager();
    this.uiManager = new UIManager();

    this.activeDialogueNpc = null;
    this.activeDialogueStep = 0;
    this.isGeneratingQuiz = false;
    this.pendingQuiz = null;
    this.keysPressed = {};

    this.bindInputs();
  }

  initMap(mapId = 'village') {
    if (MAPS[mapId]) {
      this.currentMapId = mapId;
      this.currentMap = MAPS[mapId];
      this.player.setPosition(
        this.currentMap.spawnX !== undefined ? this.currentMap.spawnX : 7,
        this.currentMap.spawnY !== undefined ? this.currentMap.spawnY : 4,
        this.currentMap.spawnDir !== undefined ? this.currentMap.spawnDir : 0
      );
    }
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;

      if (e.code === 'KeyE') {
        this.handleInteractionKey();
      } else if (e.code === 'KeyN' || e.code === 'Tab') {
        e.preventDefault();
        this.uiManager.toggleNotebook();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      this.advanceDialogue();
    });

    this.canvas.addEventListener('click', (e) => {
      if (e.shiftKey) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const tileSize = this.currentMap.tileSize || 48;

        const tileX = Math.floor(clickX / tileSize);
        const tileY = Math.floor(clickY / tileSize);

        const npcs = this.npcManager.getNpcsForMap(this.currentMapId);
        if (npcs.length > 0) {
          const npcToMove = npcs[0];
          npcToMove.tileX = tileX;
          npcToMove.tileY = tileY;

          const currentMapNpcs = npcs.map(n => ({ id: n.id, tileX: n.tileX, tileY: n.tileY, dir: n.dir || 0 }));
          const mapPlacements = { [this.currentMapId]: currentMapNpcs };

          fetch('/api/npc-placements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapPlacements)
          }).catch(err => console.warn('Auto-save NPC placement to server JSON failed:', err));

          this.uiManager.showToast(`Placed ${npcToMove.name} at tile (${tileX}, ${tileY})`);
        }
      }
    });
  }

  handleInteractionKey() {
    if (this.isGeneratingQuiz) return;

    if (this.activeDialogueNpc) {
      this.advanceDialogue();
      return;
    }

    const nearbyNpc = this.npcManager.getAdjacentNpc(this.player, this.currentMapId);
    if (nearbyNpc) {
      this.startDialogue(nearbyNpc);
    }
  }

  async startDialogue(npc) {
    this.activeDialogueNpc = npc;
    this.activeDialogueStep = 0;
    this.pendingQuiz = null;

    if (DIALOGUES[npc.id] && DIALOGUES[npc.id].lines) {
      npc.dialogue = DIALOGUES[npc.id].lines;
    }

    if (this.player.tileX < npc.tileX) { this.player.dir = 2; npc.dir = 1; }
    else if (this.player.tileX > npc.tileX) { this.player.dir = 1; npc.dir = 2; }
    else if (this.player.tileY < npc.tileY) { this.player.dir = 0; npc.dir = 3; }
    else if (this.player.tileY > npc.tileY) { this.player.dir = 3; npc.dir = 0; }

    this.uiManager.showDialogueLoading(npc);

    this.isGeneratingQuiz = true;
    try {
      console.log(`Requesting fresh quiz for NPC ${npc.id}...`);
      const quiz = await fetchNpcQuiz(npc.id);
      this.pendingQuiz = quiz;
    } catch (err) {
      console.error('Error generating quiz:', err);
    } finally {
      this.isGeneratingQuiz = false;
      this.uiManager.showDialogue(npc, this.activeDialogueStep);
    }
  }

  advanceDialogue() {
    if (!this.activeDialogueNpc || this.isGeneratingQuiz) return;

    this.activeDialogueStep++;
    if (this.activeDialogueStep >= this.activeDialogueNpc.dialogue.length) {
      const finishedNpc = this.activeDialogueNpc;
      this.activeDialogueNpc = null;
      this.activeDialogueStep = 0;
      this.uiManager.hideDialogue();

      if (this.pendingQuiz) {
        this.uiManager.showQuizModal(this.pendingQuiz, (score) => {
          console.log(`Quiz completed for ${finishedNpc.id} with score ${score}`);
        });
      }
    } else {
      this.uiManager.showDialogue(this.activeDialogueNpc, this.activeDialogueStep);
    }
  }

  checkWarp(tileX, tileY) {
    if (!this.currentMap.warps) return;

    for (const warp of this.currentMap.warps) {
      if (warp.x === tileX && warp.y === tileY) {
        this.warpToMap(warp.targetMap, warp.targetX, warp.targetY, warp.targetDir);
        break;
      }
    }
  }

  warpToMap(targetMapId, targetX, targetY, targetDir) {
    if (!MAPS[targetMapId]) return;

    this.currentMapId = targetMapId;
    this.currentMap = MAPS[targetMapId];
    this.player.setPosition(targetX, targetY, targetDir);

    this.uiManager.showToast(`Memasuki: ${this.currentMap.name}`);
  }

  update(now) {
    const activeMapContext = {
      ...this.currentMap,
      activeNpcs: this.npcManager.getNpcsForMap(this.currentMapId)
    };

    this.player.update(
      now,
      activeMapContext,
      this.activeDialogueNpc,
      this.keysPressed,
      (tx, ty) => this.checkWarp(tx, ty)
    );
  }

  render(now) {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderGround();
    this.renderEntities(now);
    this.renderPrompts(now);
  }

  renderGround() {
    const map = this.currentMap;
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const type = map.ground[r][c];
        AssetManager.drawGroundTile(this.ctx, type, c * 48, r * 48, 48);
      }
    }
  }

  renderEntities(now) {
    const map = this.currentMap;
    const entities = [];

    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const obj = map.objects[r][c];
        if (obj !== '.') {
          entities.push({
            type: 'object',
            code: obj,
            tileX: c,
            tileY: r,
            sortY: r * 48 + (obj === 'H' || obj === 'M' || obj === 'W' ? 12 : 24)
          });
        }
      }
    }

    const npcs = this.npcManager.getNpcsForMap(this.currentMapId);
    npcs.forEach(npc => {
      entities.push({
        type: 'npc',
        data: npc,
        sortY: npc.tileY * 48 + 32
      });
    });

    entities.push({
      type: 'player',
      sortY: this.player.pixelY + 32
    });

    entities.sort((a, b) => a.sortY - b.sortY);

    entities.forEach(ent => {
      if (ent.type === 'object') AssetManager.drawObjectTile(this.ctx, ent.code, ent.tileX, ent.tileY, 48);
      else if (ent.type === 'npc') this.npcManager.drawNpc(this.ctx, ent.data, 48);
      else if (ent.type === 'player') this.player.draw(this.ctx, 48);
    });
  }

  renderPrompts(now) {
    if (this.activeDialogueNpc) return;

    const adjacentNpc = this.npcManager.getAdjacentNpc(this.player, this.currentMapId);
    if (adjacentNpc) {
      const px = adjacentNpc.tileX * 48 + 24;
      const py = adjacentNpc.tileY * 48 - 20;
      const bounceY = Math.sin(now / 150) * 4;

      this.ctx.save();
      this.ctx.font = 'bold 12px "Quicksand", sans-serif';
      this.ctx.textAlign = 'center';

      const text = "Tekan E kanggo gunem";
      const textWidth = this.ctx.measureText(text).width + 16;

      this.ctx.fillStyle = '#3a1e08';
      this.ctx.beginPath();
      this.ctx.roundRect(px - textWidth / 2, py + bounceY - 14, textWidth, 24, 6);
      this.ctx.fill();
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#fef3c7';
      this.ctx.fillText(text, px, py + bounceY + 2);
      this.ctx.restore();
    }
  }

  start() {
    AssetManager.load(() => {
      console.log('NusaQuest modular assets loaded successfully.');
    });

    const loop = (timestamp) => {
      this.update(timestamp);
      this.render(timestamp);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.addEventListener('load', () => {
  window.game = new GameEngine();
  const mapsPromise = window.mapsLoadPromise || Promise.resolve();
  mapsPromise.then(() => {
    window.game.initMap('village');
    window.game.start();
  });
});
