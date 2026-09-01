/**
 * NusaQuest — Asset Loader & Canvas Drawing Helpers
 */

// Centralized tile mapping configuration for spritesheets and fallbacks
const TILE_MAP = {
  ground: {
    0:  { col: 5,  row: 0,  color: '#4ade80' }, // Grass
    1:  { col: 3,  row: 16,  color: '#d97706' }, // Dirt Path
    2:  { col: 0,  row: 0,  color: '#0284c7' }, // Water Pond
    3:  { col: 8,  row: 10,  color: '#854d0e' }, // Sawah Mud
    4:  { col: 7,  row: 0,  color: '#94a3b8' }, // Cobblestone Plaza
    10: { col: 9, row: 0, color: '#78350f' }, // Indoor Teak Wood Floor
    
    11: { col: 10,  row: 16,  color: '#d97706' }, // Mat (Tikar)
    12: { col: 11,  row: 16,  color: '#d97706' }, // Mat (Tikar)
    13: { col: 12,  row: 16,  color: '#d97706' }, // Mat (Tikar)
    14: { col: 10,  row: 17,  color: '#d97706' }, // Mat (Tikar)
    15: { col: 11,  row: 17,  color: '#d97706' }, // Mat (Tikar)
    16: { col: 12,  row: 17,  color: '#d97706' }, // Mat (Tikar)
    17: { col: 10,  row: 18,  color: '#d97706' }, // Mat (Tikar)
    18: { col: 11,  row: 18,  color: '#d97706' }, // Mat (Tikar)
    19: { col: 12,  row: 18,  color: '#d97706' }, // Mat (Tikar)

    20:  { col: 38,  row: 22,  color: '#a3641b' }, // Cobblestone Plaza
    21:  { col: 39,  row: 22,  color: '#a3641b' }, // Cobblestone Plaza
    22:  { col: 40,  row: 22,  color: '#a3641b' }, // Cobblestone Plaza
    30:  { col: 19,  row: 9,  color: '#a3641b' }, // Cobblestone Plaza
  },
  objects: {
    'T': { col: 19,  row: 9,  yOffset: -12, hExtra: 12, color: '#15803d' }, // Tree
    'Ta': { col: 11, row: 14,  yOffset: -12, hExtra: 12, color: '#15803d' }, // Tree
    'Ta1': { col: 30, row: 12,  color: '#84cc16' },                           // Sawah Padi Crop
    'Ta2': { col: 31, row: 12,  color: '#84cc16' },                           // Sawah Padi Crop
    'Ta3': { col: 30, row: 13,  color: '#84cc16' },                           // Sawah Padi Crop
    'Ta4': { col: 31, row: 13,  color: '#84cc16' },                           // Sawah Padi Crop
    'F': { col: 19,  row: 0,  color: '#78350f' },                           // Wooden Fence
    'FR': { col: 20,  row: 0,  color: '#78350f' },                           // Wooden Fence
    'FL': { col: 21,  row: 0,  color: '#78350f' },                           // Wooden Fence
    'ST': { col: 19,  row: 5,  color: '#78350f' },                           // Wooden Fence
    'SB': { col: 20,  row: 5,  color: '#78350f' },                           // Wooden Fence
    'SR': { col: 21,  row: 5,  color: '#78350f' },                           // Wooden Fence
    'SL': { col: 22,  row: 5,  color: '#78350f' },                           // Wooden Fence
    'P': { col: 13, row: 4,  color: '#84cc16' },                           // Sawah Padi Crop
    'WX': { col: 14, row: 12,  color: '#84cc16' },                           // Sawah Padi Crop
    'WY': { col: 15, row: 13,  color: '#84cc16' },                           // Sawah Padi Crop
    'WR1': { col: 16, row: 12,  color: '#84cc16' },                           // Sawah Padi Crop
    'WR2': { col: 16, row: 13,  color: '#84cc16' },                           // Sawah Padi Crop
    'WL1': { col: 17, row: 12,  color: '#84cc16' },                           // Sawah Padi Crop
    'WL2': { col: 17, row: 13,  color: '#84cc16' },                           // Sawah Padi Crop
    'Wd': { col: 44, row: 5,  color: '#84cc16' },                           // Sawah Padi Crop
    'RR1': { col: 20,  row: 21,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RR2': { col: 20,  row: 22,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RR3': { col: 20,  row: 23,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RT1': { col: 25,  row: 21,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RT2': { col: 25,  row: 22,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RT3': { col: 25,  row: 23,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RL1': { col: 21,  row: 21,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RL2': { col: 21,  row: 22,  color: '#0284c7' },                            // Water Reed / Lilypad
    'RL3': { col: 21,  row: 23,  color: '#0284c7' },                            // Water Reed / Lilypad
  }
};

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
      img.onload = img.onerror = () => {
        if (img.onerror) console.warn(`Fallback image loading for: ${src}`);
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

  // Helper to check if a spritesheet is ready to render
  hasSheet(sheetName = 'roguelike') {
    const img = this.images[sheetName];
    return img && img.complete && img.naturalWidth !== 0;
  },

  // Generic helper to draw single-tile textures from a spritesheet
  drawSprite(ctx, tileInfo, px, py, tileSize, sheetName = 'roguelike') {
    const { col, row, yOffset = 0, hExtra = 0 } = tileInfo;
    const sx = col * 17;
    const sy = row * 17;

    ctx.drawImage(
      this.images[sheetName], 
      sx, sy, 16, 16, 
      px, py + yOffset, tileSize, tileSize + hExtra
    );
  },

  drawGroundTile(ctx, type, px, py, tileSize) {
    let srcCol = 5, srcRow = 0; // Fixes global variable leaks
    const tileDef = TILE_MAP.ground[type] || TILE_MAP.ground[0];

    if (this.hasSheet('roguelike')) {
      this.drawSprite(ctx, tileDef, px, py, tileSize);
    } else {
      ctx.fillStyle = tileDef.color;
      ctx.fillRect(px, py, tileSize, tileSize);
    }
  },

  drawObjectTile(ctx, code, c, r, tileSize) {
    const px = c * tileSize;
    const py = r * tileSize;

    // 1. Handles Spritesheet-mapped Simple Objects
    if (TILE_MAP.objects[code]) {
      const objDef = TILE_MAP.objects[code];
      if (this.hasSheet('roguelike')) {
        this.drawSprite(ctx, objDef, px, py, tileSize);
      } else {
        // Fallback procedural rendering when spritesheet is missing
        ctx.fillStyle = objDef.color;
        if (code === 'T') {
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
        }
      }
      return;
    }

    // 2. Handles Composite or Procedural Objects
    switch (code) {
      case 'H':
      case 'D':
        this.drawJogloHouse(ctx, c, r, tileSize, code === 'D');
        break;
      case 'M':
        this.drawMarketStall(ctx, c, r, tileSize);
        break;
      case 'IndoorWall':
      case 'W_Wall':
        this.drawIndoorWall(ctx, c, r, tileSize);
        break;
      case 'C': // Teak Cabinet
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + tileSize / 2 - 2, py + 20, 4, 6);
        break;
      case 'T_Table': // Teak Table
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px + 8, py + 12, tileSize - 16, tileSize - 24);
        break;
      case 'S_Chair': // Teak Chair
        ctx.fillStyle = '#5c3414';
        ctx.fillRect(px + 12, py + 12, tileSize - 24, tileSize - 24);
        break;
      case 'Y_Wayang': // Wayang Wall Shield Tapestry
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(px + 24, py + 20, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(px + 24, py + 20, 8, 0, Math.PI * 2); ctx.fill();
        break;
      case 'E_Exit': // Indoor Exit Door
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 8, py + 16, tileSize - 16, 32);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('KELUAR', px + 4, py + 12);
        break;
    }
  },

  drawJogloHouse(ctx, c, r, tileSize, isDoor) {
    const px = c * tileSize;
    const py = r * tileSize;

    if (r % 2 === 0) {
      // Roof section
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px, py + tileSize - 6, tileSize, 6);
    } else {
      // Wall & Door section
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#451a03';
      ctx.strokeRect(px, py, tileSize, tileSize);

      if (isDoor) {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 10, py + 6, 28, 38);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 14, py + 10, 20, 30);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 30, py + 24, 4, 4);
      } else {
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

    if (r % 2 === 1) {
      const stripeColor = (c % 2 === 0) ? '#dc2626' : '#f59e0b';
      ctx.fillStyle = stripeColor;
      ctx.fillRect(px, py + 12, tileSize, 32);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py + 44, tileSize, 4);
    } else {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 4, py, tileSize - 8, 36);
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