const TILE_MAP = {
  ground: {},
  objects: {}
};

if (typeof fetch !== 'undefined') {
  fetch('/data/tile_map.json')
    .then(res => res.json())
    .then(data => {
      if (data && data.ground && data.objects) {
        Object.assign(TILE_MAP.ground, data.ground);
        Object.assign(TILE_MAP.objects, data.objects);
        console.log('NusaQuest: Loaded TILE_MAP from data/tile_map.json');
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

    if (TILE_MAP.objects[code]) {
      const objDef = TILE_MAP.objects[code];
      if (this.hasSheet('roguelike')) {
        this.drawSprite(ctx, objDef, px, py, tileSize);
      } else {
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
      case 'C':
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 6, py + 6, tileSize - 12, tileSize - 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + tileSize / 2 - 2, py + 20, 4, 6);
        break;
      case 'T_Table':
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px + 8, py + 12, tileSize - 16, tileSize - 24);
        break;
      case 'S_Chair':
        ctx.fillStyle = '#5c3414';
        ctx.fillRect(px + 12, py + 12, tileSize - 24, tileSize - 24);
        break;
      case 'Y_Wayang':
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(px + 24, py + 20, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(px + 24, py + 20, 8, 0, Math.PI * 2); ctx.fill();
        break;
      case 'E_Exit':
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
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px, py + tileSize - 6, tileSize, 6);
    } else {
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