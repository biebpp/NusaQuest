/**
 * NusaQuest — NPC Entity Manager & Proximity Detector
 */

class NpcManager {
  constructor() {
    this.npcsByMap = {};
    this.initNpcs();
  }

  initNpcs() {
    for (const [mapId, mapDef] of Object.entries(MAPS)) {
      this.npcsByMap[mapId] = mapDef.npcs.map(npcRef => {
        const dialogData = DIALOGUES[npcRef.id];
        return {
          id: npcRef.id,
          name: dialogData.name,
          role: dialogData.role,
          tileX: npcRef.tileX,
          tileY: npcRef.tileY,
          dir: npcRef.dir,
          charIndex: dialogData.charIndex,
          dialogue: dialogData.lines
        };
      });
    }
  }

  getNpcsForMap(mapId) {
    return this.npcsByMap[mapId] || [];
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
      const srcX = npc.charIndex * 3 * 26 + 26; // Idle center frame
      const srcY = npc.dir * 36;
      ctx.drawImage(img, srcX, srcY, 26, 36, px + 6, py - 8, 36, 52);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 10, py + 10, 28, 34);
    }
  }
}
