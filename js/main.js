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

    this.tileSize = this.currentMap.tileSize || 48;

    this.player = new Player(this.currentMap.spawnX || 7, this.currentMap.spawnY || 4, this.getTileSize());
    this.npcManager = new NpcManager();
    this.uiManager = new UIManager();

    this.activeDialogueNpc = null;
    this.activeDialogueStep = 0;
    this.isGeneratingQuiz = false;
    this.pendingQuiz = null;
    this.keysPressed = {};

    this.isWarping = false;
    this.warpPhase = null;
    this.warpStartTime = 0;
    this.warpDuration = 300;
    this.pendingWarp = null;
    this.warpCooldownArea = null;

    this.updateCanvasDimensions();
    this.bindInputs();
  }

  getTileSize() {
    return this.tileSize || (this.currentMap && this.currentMap.tileSize) || 48;
  }

  setTileSize(newSize) {
    const size = parseInt(newSize, 10);
    if (!isNaN(size) && size >= 16 && size <= 128) {
      this.tileSize = size;
      if (this.currentMap) this.currentMap.tileSize = size;
      this.updateCanvasDimensions();
      this.player.updatePixelPosition(size);
      const select = document.getElementById('tileSizeSelect');
      if (select && select.value !== String(size)) {
        select.value = String(size);
      }
    }
  }

  updateCanvasDimensions() {
    const ts = this.getTileSize();
    const mapW = this.currentMap ? this.currentMap.width : 16;
    const mapH = this.currentMap ? this.currentMap.height : 10;

    this.canvas.width = mapW * ts;
    this.canvas.height = mapH * ts;

    const container = document.getElementById('canvasContainer');
    if (container) {
      container.style.width = `${this.canvas.width}px`;
      container.style.height = `${this.canvas.height}px`;
    }
  }

  initMap(mapId = 'village') {
    if (MAPS[mapId]) {
      this.currentMapId = mapId;
      this.currentMap = MAPS[mapId];
      if (this.currentMap.tileSize) {
        this.tileSize = this.currentMap.tileSize;
      }
      this.updateCanvasDimensions();
      this.player.setPosition(
        this.currentMap.spawnX !== undefined ? this.currentMap.spawnX : 7,
        this.currentMap.spawnY !== undefined ? this.currentMap.spawnY : 4,
        this.currentMap.spawnDir !== undefined ? this.currentMap.spawnDir : 0,
        this.getTileSize()
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

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.advanceDialogue();
      });
    }

    const tileSizeSelect = document.getElementById('tileSizeSelect');
    if (tileSizeSelect) {
      tileSizeSelect.value = String(this.getTileSize());
      tileSizeSelect.addEventListener('change', (e) => {
        this.setTileSize(e.target.value);
      });
    }

    this.canvas.addEventListener('click', (e) => {
      if (e.shiftKey) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const ts = this.getTileSize();

        const tileX = Math.floor((clickX * scaleX) / ts);
        const tileY = Math.floor((clickY * scaleY) / ts);

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
    if (this.isGeneratingQuiz || this.isWarping || (this.uiManager && this.uiManager.isQuizActive())) return;

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
    if (this.isWarping) return;

    if (this.warpCooldownArea) {
      const cdWarp = this.warpCooldownArea.warp;
      const cdW = cdWarp.w || cdWarp.width || 1;
      const cdH = cdWarp.h || cdWarp.height || 1;
      const insideCd = (this.warpCooldownArea.mapId === this.currentMapId) &&
                       (tileX >= cdWarp.x && tileX < cdWarp.x + cdW &&
                        tileY >= cdWarp.y && tileY < cdWarp.y + cdH);
      if (!insideCd) {
        this.warpCooldownArea = null;
      }
    }

    if (!this.currentMap.warps) return;

    for (const warp of this.currentMap.warps) {
      const w = warp.w || warp.width || 1;
      const h = warp.h || warp.height || 1;

      if (tileX >= warp.x && tileX < warp.x + w && tileY >= warp.y && tileY < warp.y + h) {
        if (this.warpCooldownArea &&
            this.warpCooldownArea.mapId === this.currentMapId &&
            this.warpCooldownArea.warp === warp) {
          return;
        }

        this.warpToMap(warp.targetMap, warp.targetX, warp.targetY, warp.targetDir);
        break;
      }
    }
  }

  warpToMap(targetMapId, targetX, targetY, targetDir, immediate = false) {
    if (!MAPS[targetMapId]) return;

    if (immediate) {
      this.executeWarp(targetMapId, targetX, targetY, targetDir);
      return;
    }

    if (this.isWarping) return;

    this.isWarping = true;
    this.warpPhase = 'fade_out';
    this.warpStartTime = performance.now();
    this.pendingWarp = { targetMapId, targetX, targetY, targetDir };
  }

  executeWarp(targetMapId, targetX, targetY, targetDir) {
    this.currentMapId = targetMapId;
    this.currentMap = MAPS[targetMapId];
    if (this.currentMap.tileSize) {
      this.tileSize = this.currentMap.tileSize;
    }
    this.updateCanvasDimensions();
    this.player.setPosition(targetX, targetY, targetDir, this.getTileSize());

    this.warpCooldownArea = null;
    if (this.currentMap.warps) {
      for (const warp of this.currentMap.warps) {
        const w = warp.w || warp.width || 1;
        const h = warp.h || warp.height || 1;
        if (targetX >= warp.x && targetX < warp.x + w && targetY >= warp.y && targetY < warp.y + h) {
          this.warpCooldownArea = { mapId: targetMapId, warp };
          break;
        }
      }
    }

    this.uiManager.showToast(`Memasuki: ${this.currentMap.name}`);
  }

  updateWarpTransition(now) {
    if (!this.isWarping) return;

    const elapsed = now - this.warpStartTime;
    if (this.warpPhase === 'fade_out') {
      if (elapsed >= this.warpDuration) {
        if (this.pendingWarp) {
          const { targetMapId, targetX, targetY, targetDir } = this.pendingWarp;
          this.executeWarp(targetMapId, targetX, targetY, targetDir);
          this.pendingWarp = null;
        }
        this.warpPhase = 'fade_in';
        this.warpStartTime = now;
      }
    } else if (this.warpPhase === 'fade_in') {
      if (elapsed >= this.warpDuration) {
        this.isWarping = false;
        this.warpPhase = null;
      }
    }
  }

  update(now) {
    if (this.isWarping) {
      this.updateWarpTransition(now);
      return;
    }

    const activeMapContext = {
      ...this.currentMap,
      activeNpcs: this.npcManager.getNpcsForMap(this.currentMapId)
    };

    const ts = this.getTileSize();

    this.player.update(
      now,
      activeMapContext,
      this.activeDialogueNpc || (this.uiManager && this.uiManager.isQuizActive()),
      this.keysPressed,
      (tx, ty) => this.checkWarp(tx, ty),
      ts
    );
  }

  render(now) {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderGround();
    this.renderEntities(now);
    this.renderPrompts(now);
    this.renderWarpTransition(now);
  }

  renderGround() {
    const map = this.currentMap;
    const ts = this.getTileSize();
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const type = map.ground[r][c];
        AssetManager.drawGroundTile(this.ctx, type, c * ts, r * ts, ts);
      }
    }
  }

  renderEntities(now) {
    const map = this.currentMap;
    const ts = this.getTileSize();
    const entities = [];

    const getObjectStack = (tileObj) => {
      if (!tileObj || tileObj === '.') return [];
      if (Array.isArray(tileObj)) return tileObj.filter(c => c && c !== '.');
      if (typeof tileObj === 'string') {
        return tileObj.split(',').map(s => s.trim()).filter(s => s && s !== '.');
      }
      return [];
    };

    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const rawObj = map.objects ? map.objects[r][c] : '.';
        const stack = getObjectStack(rawObj);
        const isOverhead = map.collision && map.collision[r] && map.collision[r][c] === 2;

        if (stack.length > 0) {
          stack.forEach((objCode, layerIdx) => {
            const baseSortY = isOverhead ? (r * ts + ts - 1) : (r * ts + (objCode === 'H' || objCode === 'M' || objCode === 'W' ? ts * 0.25 : ts * 0.5));
            entities.push({
              type: 'object',
              code: objCode,
              tileX: c,
              tileY: r,
              layerIdx: layerIdx,
              sortY: baseSortY + (layerIdx * 0.01)
            });
          });
        } else if (isOverhead) {
          entities.push({
            type: 'ground_overhead',
            groundType: map.ground[r][c],
            tileX: c,
            tileY: r,
            sortY: r * ts + ts - 1
          });
        }
      }
    }

    const npcs = this.npcManager.getNpcsForMap(this.currentMapId);
    npcs.forEach(npc => {
      entities.push({
        type: 'npc',
        data: npc,
        sortY: npc.tileY * ts + ts * 0.66
      });
    });

    entities.push({
      type: 'player',
      sortY: this.player.pixelY + ts * 0.66
    });

    entities.sort((a, b) => a.sortY - b.sortY);

    entities.forEach(ent => {
      if (ent.type === 'object') AssetManager.drawObjectTile(this.ctx, ent.code, ent.tileX, ent.tileY, ts);
      else if (ent.type === 'ground_overhead') AssetManager.drawGroundTile(this.ctx, ent.groundType, ent.tileX * ts, ent.tileY * ts, ts);
      else if (ent.type === 'npc') this.npcManager.drawNpc(this.ctx, ent.data, ts);
      else if (ent.type === 'player') this.player.draw(this.ctx, ts);
    });
  }

  renderPrompts(now) {
    if (this.activeDialogueNpc || this.isWarping || (this.uiManager && this.uiManager.isQuizActive())) return;

    const ts = this.getTileSize();
    const adjacentNpc = this.npcManager.getAdjacentNpc(this.player, this.currentMapId);
    if (adjacentNpc) {
      const px = adjacentNpc.tileX * ts + ts / 2;
      const py = adjacentNpc.tileY * ts - (ts * 0.4);
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

  renderWarpTransition(now) {
    if (!this.isWarping || !this.warpPhase) return;

    const elapsed = Math.max(0, now - this.warpStartTime);
    const rawProgress = Math.min(elapsed / this.warpDuration, 1);
    
    // Smooth quadratic easing (easeInOut)
    const progress = rawProgress < 0.5 
      ? 2 * rawProgress * rawProgress 
      : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

    let alpha = 0;
    if (this.warpPhase === 'fade_out') {
      alpha = progress;
    } else if (this.warpPhase === 'fade_in') {
      alpha = 1 - progress;
    }

    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
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
