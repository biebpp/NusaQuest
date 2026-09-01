/**
 * NusaQuest — Asset Loader & Canvas Drawing Helpers
 */

const AssetManager = {
  images: {},
  loaded: false,

  load(callback) {
    const sources = {
      roguelike: 'assets/tiles/kenney_roguelike.png',
      rpg: 'assets/tiles/kenney_rpg.png',
      urban: 'assets/tiles/kenney_urban.png',
      characters: 'assets/characters/characters.png'
    };

    let loadedCount = 0;
    const total = Object.keys(sources).length;

    for (const [key, src] of Object.entries(sources)) {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === total) {
          this.loaded = true;
          if (callback) callback();
        }
      };
      img.onerror = () => {
        console.warn(`Fallback image loading for: ${src}`);
        loadedCount++;
        if (loadedCount === total) {
          this.loaded = true;
          if (callback) callback();
        }
      };
      img.src = src;
      this.images[key] = img;
    }
  },

  drawGroundTile(ctx, type, px, py, tileSize) {
    const roguelike = this.images.roguelike;
    const hasSheet = roguelike && roguelike.complete && roguelike.naturalWidth !== 0;

    if (hasSheet) {
      let srcCol = 0, srcRow = 10; // Default Grass (col 0, row 10)
      if (type === 0) { srcCol = 0; srcRow = 10; } // Grass
      else if (type === 1) { srcCol = 5; srcRow = 9; } // Dirt Path
      else if (type === 2) { srcCol = 0; srcRow = 0; } // Water Pond
      else if (type === 3) { srcCol = 5; srcRow = 2; } // Sawah Mud
      else if (type === 4) { srcCol = 13; srcRow = 12; } // Cobblestone Plaza
      else if (type === 10) { srcCol = 11; srcRow = 14; } // Indoor Teak Wood Floor
      else if (type === 11) { srcCol = 14; srcRow = 14; } // Bamboo Mat (Tikar)
      else if (type === 12) { srcCol = 13; srcRow = 14; } // Exit Door Mat

      const sx = srcCol * 17;
      const sy = srcRow * 17;
      ctx.drawImage(roguelike, sx, sy, 16, 16, px, py, tileSize, tileSize);

      // Overlays for indoor bamboo mats for extra warmth
      if (type === 11) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.1)';
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.3)';
        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
      }
    } else {
      if (type === 0) ctx.fillStyle = '#4ade80';
      else if (type === 1) ctx.fillStyle = '#d97706';
      else if (type === 2) ctx.fillStyle = '#0284c7';
      else if (type === 3) ctx.fillStyle = '#854d0e';
      else if (type === 4) ctx.fillStyle = '#94a3b8';
      else if (type === 10) ctx.fillStyle = '#78350f';
      else if (type === 11) ctx.fillStyle = '#d97706';
      else if (type === 12) ctx.fillStyle = '#b45309';
      ctx.fillRect(px, py, tileSize, tileSize);
    }
  },

  drawObjectTile(ctx, code, c, r, tileSize) {
    const px = c * tileSize;
    const py = r * tileSize;
    const roguelike = this.images.roguelike;
    const hasRoguelike = roguelike && roguelike.complete && roguelike.naturalWidth !== 0;

    if (code === 'T') {
      // Tree
      if (hasRoguelike) {
        ctx.drawImage(roguelike, 0 * 17, 1 * 17, 16, 16, px, py - 12, tileSize, tileSize + 12);
      } else {
        ctx.fillStyle = '#15803d';
        ctx.beginPath(); ctx.arc(px + 24, py + 20, 20, 0, Math.PI * 2); ctx.fill();
      }
    } else if (code === 'F') {
      // Wooden Fence
      if (hasRoguelike) {
        ctx.drawImage(roguelike, 0 * 17, 3 * 17, 16, 16, px, py, tileSize, tileSize);
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 4, py + 16, 40, 16);
      }
    } else if (code === 'P') {
      // Sawah Padi Crop
      if (hasRoguelike) {
        ctx.drawImage(roguelike, 13 * 17, 4 * 17, 16, 16, px, py, tileSize, tileSize);
      } else {
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(px + 12, py + 8, 24, 32);
      }
    } else if (code === 'W') {
      // Water Reed / Lilypad
      if (hasRoguelike) {
        ctx.drawImage(roguelike, 1 * 17, 4 * 17, 16, 16, px, py, tileSize, tileSize);
      }
    } else if (code === 'H' || code === 'D') {
      this.drawJogloHouse(ctx, c, r, tileSize, code === 'D');
    } else if (code === 'M') {
      this.drawMarketStall(ctx, c, r, tileSize);
    } else if (code === 'IndoorWall' || code === 'W_Wall') {
      this.drawIndoorWall(ctx, c, r, tileSize);
    } else if (code === 'C') {
      // Teak Cabinet
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + tileSize / 2 - 2, py + 20, 4, 6);
    } else if (code === 'T_Table') {
      // Teak Table
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 8, py + 12, tileSize - 16, tileSize - 24);
    } else if (code === 'S_Chair') {
      // Teak Chair
      ctx.fillStyle = '#5c3414';
      ctx.fillRect(px + 12, py + 12, 24, 24);
    } else if (code === 'Y_Wayang') {
      // Wayang Wall Shield Tapestry
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(px + 24, py + 20, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px + 24, py + 20, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (code === 'E_Exit') {
      // Indoor Exit Door
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px + 8, py + 16, tileSize - 16, 32);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('KELUAR', px + 4, py + 12);
    }
  },

  drawJogloHouse(ctx, c, r, tileSize, isDoor) {
    const px = c * tileSize;
    const py = r * tileSize;

    if (r === 0) {
      // Roof section (Pyramid Joglo)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px, py + tileSize - 6, tileSize, 6);
    } else if (r === 1) {
      // Wall & Door section
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#451a03';
      ctx.strokeRect(px, py, tileSize, tileSize);

      if (isDoor) {
        // Doorway
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 10, py + 6, 28, 42);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 14, py + 10, 20, 34);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 30, py + 26, 4, 4);
      } else {
        // Wooden window
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 14, py + 12, 20, 20);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 16, py + 14, 16, 16);
      }
    }
  },

  drawMarketStall(ctx, c, r, tileSize) {
    const px = c * tileSize;
    const py = r * tileSize;

    if (r === 1) {
      const stripeColor = (c % 2 === 0) ? '#dc2626' : '#f59e0b';
      ctx.fillStyle = stripeColor;
      ctx.fillRect(px, py + 12, tileSize, 36);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py + 44, tileSize, 4);
    } else if (r === 2) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 4, py, tileSize - 8, 36);
      if (c === 12) {
        ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(px + 16, py + 16, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(px + 32, py + 16, 7, 0, Math.PI * 2); ctx.fill();
      } else if (c === 14) {
        ctx.fillStyle = '#ea580c'; ctx.fillRect(px + 12, py + 10, 8, 16);
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(px + 30, py + 18, 8, 0, Math.PI * 2); ctx.fill();
      }
    }
  },

  drawIndoorWall(ctx, c, r, tileSize) {
    const px = c * tileSize;
    const py = r * tileSize;
    ctx.fillStyle = '#3a1e08';
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = '#5c3414';
    ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
  }
};
