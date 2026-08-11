    state.deltaX = 0;
    resetOffset();
  }

  function resetOffset() {
    ui.primary.style.translate = "0 0";
    ui.secondary.style.translate = "0 0";
    ui.video.style.translate = "0 0";
  }

  function activeMedia() {
    if (ui.video.style.display === "block") return ui.video;
    return state.primaryVisible ? ui.primary : ui.secondary;
  }

  function inactiveMedia() {
    if (ui.video.style.display === "block") return null;
    return state.primaryVisible ? ui.secondary : ui.primary;
  }

  function preloadAround(index) {
    for (let offset = -config.preloadDistance; offset <= config.preloadDistance; offset += 1) {
      if (!offset || !state.pages[index + offset]) continue;
      const page = state.pages[index + offset];
      if (page.type === "photo") { const image = new Image(); image.src = mediaUrl(page); }
      else { const video = document.createElement("video"); video.preload = "metadata"; video.src = mediaUrl(page); }
    }
  }
})();