class NpcManager {
  constructor() {
    this.initNpcs();
  }

  initNpcs() {
    if (typeof fetch !== 'undefined') {
      fetch('/data/npc_placements.json')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object') {
            for (const [mapId, list] of Object.entries(data)) {
              if (MAPS[mapId]) MAPS[mapId].npcs = list;
            }
          }
        })
        .catch(() => {});
    }
  }

  getNpcsForMap(mapId) {
    const mapDef = MAPS[mapId];
    if (!mapDef || !mapDef.npcs) return [];

    return mapDef.npcs.map(npcRef => {
      const dialogData = DIALOGUES[npcRef.id] || { name: npcRef.id, role: 'NPC', charIndex: 0, lines: [] };
      return {
        id: npcRef.id,
        name: dialogData.name || npcRef.id,
        role: dialogData.role || 'Warga Desa',
        tileX: npcRef.tileX !== undefined ? npcRef.tileX : 0,
        tileY: npcRef.tileY !== undefined ? npcRef.tileY : 0,
        dir: npcRef.dir !== undefined ? npcRef.dir : 0,
        charIndex: dialogData.charIndex !== undefined ? dialogData.charIndex : (npcRef.charIndex !== undefined ? npcRef.charIndex : 0),
        col: dialogData.col !== undefined ? dialogData.col : npcRef.col,
        row: dialogData.row !== undefined ? dialogData.row : npcRef.row,
        animList: dialogData.animList || npcRef.animList || null,
        dialogue: dialogData.lines || []
      };
    });
  }

  getAdjacentNpc(player, currentMapId) {
    const npcs = this.getNpcsForMap(currentMapId);
    for (const npc of npcs) {
      const dx = Math.abs(player.tileX - npc.tileX);
      const dy = Math.abs(player.tileY - npc.tileY);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        return npc;
      }
    }
    return null;
  }

  drawNpc(ctx, npc, tileSize = 48) {
    const img = AssetManager.images.characters;
    const px = npc.tileX * tileSize;
    const py = npc.tileY * tileSize;

    if (img && img.complete && img.naturalWidth !== 0) {
      let srcX, srcY;
      if (npc.col !== undefined && npc.row !== undefined) {
        srcX = npc.col * 26;
        srcY = npc.row * 36;
      } else {
        const cIdx = npc.charIndex !== undefined ? npc.charIndex : 0;
        const dir = npc.dir !== undefined ? npc.dir : 0;
        srcX = cIdx * 3 * 26 + 26;
        srcY = dir * 36;
      }
      ctx.drawImage(img, srcX, srcY, 26, 36, px + 6, py - 8, 36, 52);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 10, py + 10, 28, 34);
    }
  }
}
