const TILE_MAP = {
  ground: {},
  objects: {}
};

const TILESHEETS_CONFIG = {};

window.tileMapLoadPromise = (function() {
  if (typeof fetch !== 'undefined') {
    return fetch('/data/tile_map.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.ground && data.objects) {
          Object.assign(TILE_MAP.ground, data.ground);
          Object.assign(TILE_MAP.objects, data.objects);
          console.log('NusaQuest: Loaded TILE_MAP from data/tile_map.json');
        }
        return TILE_MAP;
      })
      .catch(err => {
        console.error('Failed to load data/tile_map.json:', err);
        return TILE_MAP;
      });
  }
  return Promise.resolve(TILE_MAP);
})();

if (typeof fetch !== 'undefined') {
  fetch('/assets/tiles/tilesheets.json')
    .then(res => res.json())
    .then(data => {
      if (data && typeof data === 'object') {
        Object.assign(TILESHEETS_CONFIG, data);
        console.log('NusaQuest: Loaded TILESHEETS_CONFIG from assets/tiles/tilesheets.json');
      }
    })
    .catch(() => {});
}

if (typeof localStorage !== 'undefined') {
  try {
    const customMap = localStorage.getItem('NUSAQUEST_TILE_MAP');
    if (customMap) {
      const parsed = JSON.parse(customMap);
      if (parsed.ground) Object.assign(TILE_MAP.ground, parsed.ground);
      if (parsed.objects) Object.assign(TILE_MAP.objects, parsed.objects);
    }
  } catch (err) {}
}

const AssetManager = {
  images: {},
  loaded: false,

  load(callback) {
    const sources = {
      roguelike: '/assets/tiles/kenney_roguelike.png',
      ui_adventure: '/assets/tiles/kenney_ui_adventure.png',
      rpg: '/assets/tiles/kenney_rpg.png',
      urban: '/assets/tiles/kenney_urban.png',
      characters: '/assets/characters/characters.png'
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

  hasSheet(sheetName = 'roguelike') {
    const img = this.images[sheetName];
    return img && img.complete && img.naturalWidth !== 0;
  },

  drawSprite(ctx, tileInfo, px, py, tileSize) {
    if (!tileInfo) return;
    const sheetName = tileInfo.sheet || 'roguelike';
    const img = this.images[sheetName] || this.images['roguelike'];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const col = tileInfo.col !== undefined ? tileInfo.col : 0;
    const row = tileInfo.row !== undefined ? tileInfo.row : 0;
    const yOffset = tileInfo.yOffset || 0;
    const hExtra = tileInfo.hExtra || 0;

    let cfg = null;
    for (const [pathKey, configObj] of Object.entries(TILESHEETS_CONFIG)) {
      if (pathKey.includes(sheetName)) {
        cfg = configObj;
        break;
      }
    }

    const srcTileSize = (cfg && cfg.tileSize) || (sheetName === 'ui_adventure' ? 32 : 16);
    const gap = (cfg && cfg.gap !== undefined) ? cfg.gap : (sheetName === 'urban' ? 0 : 1);
    const margin = (cfg && cfg.margin !== undefined) ? cfg.margin : 0;
    const stride = srcTileSize + gap;

    const sx = margin + col * stride;
    const sy = margin + row * stride;

    ctx.drawImage(
      img,
      sx, sy, srcTileSize, srcTileSize,
      px, py + yOffset, tileSize, tileSize + hExtra
    );
  },

  drawGroundTile(ctx, type, px, py, tileSize) {
    const tileDef = TILE_MAP.ground[type] || TILE_MAP.ground[0];
    if (!tileDef) return;

    const sheetName = tileDef.sheet || 'roguelike';
    if (this.hasSheet(sheetName) || this.hasSheet('roguelike')) {
      this.drawSprite(ctx, tileDef, px, py, tileSize);
    } else {
      ctx.fillStyle = tileDef.color || '#8dc435';
      ctx.fillRect(px, py, tileSize, tileSize);
    }
  },

  drawObjectTile(ctx, code, c, r, tileSize) {
    const px = c * tileSize;
    const py = r * tileSize;

    if (TILE_MAP.objects[code]) {
      const objDef = TILE_MAP.objects[code];
      const sheetName = objDef.sheet || 'roguelike';
      if (this.hasSheet(sheetName) || this.hasSheet('roguelike')) {
        this.drawSprite(ctx, objDef, px, py, tileSize);
      } else {
        ctx.fillStyle = objDef.color || '#15803d';
        ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
      }
    }
  }
};