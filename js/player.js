/**
 * NusaQuest — Player Entity Controller & Movement Engine
 */

class Player {
  constructor(tileX = 7, tileY = 4) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.pixelX = tileX * 48;
    this.pixelY = tileY * 48;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.dir = 0; // 0: Down, 1: Left, 2: Right, 3: Up
    this.isMoving = false;
    this.moveStartTime = 0;
    this.moveDuration = 180; // ms per tile step
    this.animFrame = 0;
    this.charIndex = 0; // Spritesheet column 0
  }

  setPosition(tx, ty, dir = 0) {
    this.tileX = tx;
    this.tileY = ty;
    this.targetTileX = tx;
    this.targetTileY = ty;
    this.pixelX = tx * 48;
    this.pixelY = ty * 48;
    this.dir = dir;
    this.isMoving = false;
    this.animFrame = 0;
  }

  update(now, currentMap, activeNpcDialogue, keysPressed, checkWarpCallback) {
    if (activeNpcDialogue) return; // Frozen during dialogue

    if (this.isMoving) {
      const elapsed = now - this.moveStartTime;
      const progress = Math.min(elapsed / this.moveDuration, 1);

      const startX = this.tileX * 48;
      const startY = this.tileY * 48;
      const targetX = this.targetTileX * 48;
      const targetY = this.targetTileY * 48;

      this.pixelX = startX + (targetX - startX) * progress;
      this.pixelY = startY + (targetY - startY) * progress;

      // Walk cycle animation
      if (progress < 0.25) this.animFrame = 1;
      else if (progress < 0.5) this.animFrame = 0;
      else if (progress < 0.75) this.animFrame = 2;
      else this.animFrame = 0;

      if (progress >= 1) {
        this.isMoving = false;
        this.tileX = this.targetTileX;
        this.tileY = this.targetTileY;
        this.pixelX = this.tileX * 48;
        this.pixelY = this.tileY * 48;
        this.animFrame = 0;

        // Check if current tile triggers map warp/teleport
        if (checkWarpCallback) {
          checkWarpCallback(this.tileX, this.tileY);
        }
      }
      return;
    }

    // Process movement inputs
    let nextX = this.tileX;
    let nextY = this.tileY;
    let newDir = this.dir;
    let keyHit = false;

    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
      nextY--;
      newDir = 3;
      keyHit = true;
    } else if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
      nextY++;
      newDir = 0;
      keyHit = true;
    } else if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
      nextX--;
      newDir = 1;
      keyHit = true;
    } else if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
      nextX++;
      newDir = 2;
      keyHit = true;
    }

    if (keyHit) {
      this.dir = newDir;

      if (this.isWalkable(nextX, nextY, currentMap)) {
        this.isMoving = true;
        this.targetTileX = nextX;
        this.targetTileY = nextY;
        this.moveStartTime = now;
      }
    }
  }

  isWalkable(tx, ty, currentMap) {
    if (tx < 0 || tx >= currentMap.width || ty < 0 || ty >= currentMap.height) return false;
    if (currentMap.collision[ty][tx] === 1) return false;

    // Check NPC tile collision
    if (currentMap.activeNpcs) {
      for (const npc of currentMap.activeNpcs) {
        if (npc.tileX === tx && npc.tileY === ty) return false;
      }
    }
    return true;
  }

  draw(ctx, tileSize = 48) {
    const img = AssetManager.images.characters;
    const px = this.pixelX;
    const py = this.pixelY;

    if (img && img.complete && img.naturalWidth !== 0) {
      const srcX = this.charIndex * 3 * 26 + this.animFrame * 26;
      const srcY = this.dir * 36;
      ctx.drawImage(img, srcX, srcY, 26, 36, px + 6, py - 8, 36, 52);
    } else {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(px + 10, py + 10, 28, 34);
    }
  }
}
