const MAPS = {};

window.mapsLoadPromise = (function() {
  if (typeof fetch !== 'undefined') {
    return fetch('/data/maps.json')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          for (const [mapId, mapDef] of Object.entries(data)) {
            MAPS[mapId] = mapDef;
          }
          console.log('NusaQuest: Successfully loaded MAPS from data/maps.json');
        }
        return MAPS;
      })
      .catch(err => {
        console.error('Failed to load data/maps.json:', err);
        return MAPS;
      });
  }
  return Promise.resolve(MAPS);
})();
