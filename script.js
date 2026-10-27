 
document.querySelectorAll(".hero-services > span").forEach((line) => {
  const directions = [
    "service-slide-left",
    "service-slide-top",
    "service-slide-right",
    "service-slide-bottom",
  ];
  const text = line.textContent;
  const fragment = document.createDocumentFragment();

  Array.from(text).forEach((character, index) => {
    const letter = document.createElement("span");
    letter.className = "service-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = character === " " ? "\u00a0" : character;
    letter.style.animationName = directions[index % directions.length];
    letter.style.setProperty("--i", (0.6 + (index % 9) * 0.1).toFixed(1));
    fragment.append(letter);
  });

  line.setAttribute("aria-label", text);
  line.replaceChildren(fragment);
});

const revealElements = document.querySelectorAll(".top-heading, .service-cards");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-in-view"));
}

const motionDesignerLine = document.querySelector(".motion-designer-line");
const videoEditorLine = document.querySelector(".video-editor-line");
if (
  (motionDesignerLine || videoEditorLine) &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const restartAnimations = (line) => {
    if (!line) return;

    const animatedParts = line.querySelectorAll(".text-part, .editor-letter");
    animatedParts.forEach((part) => {
      part.style.animation = "none";
    });
    void line.offsetWidth;
    animatedParts.forEach((part) => {
      part.style.removeProperty("animation");
    });
  };

  if (motionDesignerLine) {
    window.setInterval(() => restartAnimations(motionDesignerLine), 15000);
  }

  if (videoEditorLine) {
    window.setInterval(() => restartAnimations(videoEditorLine), 5000);
  }
}

// Video Play/Pause Control Buttons
document.querySelectorAll(".video-play-btn, .video-control-btn:not(.video-sound-btn)").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const container = btn.closest(".work-card, .bottom-video-container, .bottom-video-section");
    if (!container) return;
    const video = container.querySelector("video");
    if (!video) return;

    if (video.paused) {
      video.play();
      btn.classList.remove("is-paused");
      btn.setAttribute("aria-label", "Pause video");
    } else {
      video.pause();
      btn.classList.add("is-paused");
      btn.setAttribute("aria-label", "Play video");
    }
  });
});

// Video Mute / Voice Control Buttons
document.querySelectorAll(".video-sound-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const container = btn.closest(".work-card, .bottom-video-container, .bottom-video-section");
    if (!container) return;
    const video = container.querySelector("video");
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      video.volume = 1;
      btn.classList.remove("is-muted");
      btn.setAttribute("aria-label", "Mute audio");
    } else {
      video.muted = true;
      btn.classList.add("is-muted");
      btn.setAttribute("aria-label", "Unmute audio");
    }
  });
});

// Sync button states if video is paused/played/muted programmatically or on touch
document.querySelectorAll(".work-card video, .bottom-video-container video, .bottom-video-section video").forEach((video) => {
  const container = video.closest(".work-card, .bottom-video-container, .bottom-video-section");
  if (!container) return;
  const playBtn = container.querySelector(".video-play-btn, .video-control-btn:not(.video-sound-btn)");
  const soundBtn = container.querySelector(".video-sound-btn");

  if (playBtn) {
    video.addEventListener("play", () => {
      playBtn.classList.remove("is-paused");
      playBtn.setAttribute("aria-label", "Pause video");
    });

    video.addEventListener("pause", () => {
      playBtn.classList.add("is-paused");
      playBtn.setAttribute("aria-label", "Play video");
    });
  }

  if (soundBtn) {
    video.addEventListener("volumechange", () => {
      if (video.muted || video.volume === 0) {
        soundBtn.classList.add("is-muted");
        soundBtn.setAttribute("aria-label", "Unmute audio");
      } else {
        soundBtn.classList.remove("is-muted");
        soundBtn.setAttribute("aria-label", "Mute audio");
      }
    });
  }
});

// Video Horizontal Progress / Scrubber Bar
document.querySelectorAll(".video-progress-bar").forEach((progressBar) => {
  const container = progressBar.closest(".work-card, .bottom-video-container, .bottom-video-section");
  if (!container) return;
  const video = container.querySelector("video");
  if (!video) return;

  const fill = progressBar.querySelector(".video-progress-fill");
  const thumb = progressBar.querySelector(".video-progress-thumb");
  let isDragging = false;

  const updateProgress = () => {
    if (!video.duration || isDragging) return;
    const percent = Math.min(100, Math.max(0, (video.currentTime / video.duration) * 100));
    if (fill) fill.style.width = `${percent}%`;
    if (thumb) thumb.style.left = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", Math.round(percent));
  };

  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("loadedmetadata", updateProgress);

  const seek = (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.clientX !== undefined
      ? e.clientX
      : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const percent = pos * 100;

    if (fill) fill.style.width = `${percent}%`;
    if (thumb) thumb.style.left = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", Math.round(percent));

    if (video.duration) {
      video.currentTime = pos * video.duration;
    }
  };

  const startDrag = (e) => {
    e.stopPropagation();
    isDragging = true;
    progressBar.classList.add("is-dragging");
    seek(e);

    const onMove = (moveEvent) => {
      if (!isDragging) return;
      seek(moveEvent);
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      progressBar.classList.remove("is-dragging");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  progressBar.addEventListener("mousedown", startDrag);
  progressBar.addEventListener("touchstart", startDrag, { passive: false });

  // Keyboard navigation (Arrow keys to seek)
  progressBar.addEventListener("keydown", (e) => {
    if (!video.duration) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 5);
      updateProgress();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
      updateProgress();
    }
  });
});

