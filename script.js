const EVENT_START = new Date("2026-10-31T21:00:00-03:00");
const EVENT_END = new Date("2026-11-01T05:00:00-03:00");

const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const remaining = Math.max(0, EVENT_START.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  countdownFields.days.textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, "0");
  countdownFields.hours.textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  countdownFields.minutes.textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  countdownFields.seconds.textContent = String(totalSeconds % 60).padStart(2, "0");
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadCalendarEvent() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agus//Invitacion XV//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:xv-agus-20261031@bloomdate`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(EVENT_START)}`,
    `DTEND:${toIcsDate(EVENT_END)}`,
    "SUMMARY:XV de Agus",
    "LOCATION:Jano's Vicente López\\, Hipólito Yrigoyen 803\\, Vicente López\\, Buenos Aires",
    "DESCRIPTION:Celebramos los XV años de Agus.",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const file = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "xv-agus.ics";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
document.querySelector("#calendarButton").addEventListener("click", downloadCalendarEvent);

const mapModal = document.querySelector("#mapModal");
const giftsModal = document.querySelector("#giftsModal");

function openModal(modal) {
  modal.showModal();
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.close();
}

function syncModalState() {
  document.body.classList.toggle("modal-open", Boolean(document.querySelector("dialog[open]")));
}

function showCopyMessage(button, message) {
  const toast = button.closest(".modal-art").querySelector(".modal-toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toast.hideTimer);
  toast.hideTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function copyText(button) {
  const text = button.dataset.copy;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  showCopyMessage(button, button.dataset.copyMessage);
}

document.querySelector("#openMapModal").addEventListener("click", () => openModal(mapModal));
document.querySelector("#openGiftsModal").addEventListener("click", () => openModal(giftsModal));

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest("dialog")));
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyText(button));
});

[mapModal, giftsModal].forEach((modal) => {
  modal.addEventListener("close", syncModalState);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

/* Raspadita de fecha: no deja seguir bajando hasta descubrirla (mismo efecto que Vicky). */
const dateSection = document.querySelector(".panel--date");
const dateReveal = document.getElementById("dateReveal");
const dateRevealCanvas = document.getElementById("dateRevealCanvas");
const dateRevealButton = document.getElementById("dateRevealButton");
const dateMagic = document.getElementById("dateMagic");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dateRevealStorageKey = "agus-date-revealed-v1";
let dateWasRevealed = false;

try {
  dateWasRevealed = sessionStorage.getItem(dateRevealStorageKey) === "true";
} catch {
  dateWasRevealed = false;
}

let dateScrollUnlocked = dateWasRevealed;
let isClampingDateScroll = false;
let touchStartY = null;

function getDateGateTop() {
  return Math.round(dateSection.getBoundingClientRect().top + window.scrollY);
}

function isAtDateGate() {
  return window.scrollY >= getDateGateTop() - 2;
}

function clampDateScroll() {
  if (dateScrollUnlocked || isClampingDateScroll) {
    return;
  }

  const dateGateTop = getDateGateTop();

  if (window.scrollY <= dateGateTop) {
    return;
  }

  isClampingDateScroll = true;
  window.scrollTo(0, dateGateTop);
  requestAnimationFrame(() => {
    isClampingDateScroll = false;
  });
}

window.addEventListener("scroll", clampDateScroll, { passive: true });

window.addEventListener(
  "wheel",
  (event) => {
    if (!dateScrollUnlocked && event.deltaY > 0 && isAtDateGate()) {
      event.preventDefault();
      clampDateScroll();
    }
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    const currentY = event.touches[0]?.clientY;

    if (
      !dateScrollUnlocked &&
      touchStartY !== null &&
      currentY !== undefined &&
      currentY < touchStartY &&
      isAtDateGate()
    ) {
      event.preventDefault();
      clampDateScroll();
    }

    touchStartY = currentY ?? touchStartY;
  },
  { passive: false },
);

window.addEventListener("touchend", () => {
  touchStartY = null;
});

window.addEventListener("keydown", (event) => {
  const forwardKeys = ["ArrowDown", "PageDown", "End", " "];

  if (!dateScrollUnlocked && forwardKeys.includes(event.key) && isAtDateGate()) {
    event.preventDefault();
    clampDateScroll();
  }
});

window.addEventListener("pageshow", clampDateScroll);

if (dateWasRevealed) {
  dateReveal.hidden = true;
} else {
  const context = dateRevealCanvas.getContext("2d", { alpha: true });
  let activePointer = null;
  let previousPoint = null;
  let horizontalTravel = 0;
  let revealProgress = 0;

  function sizeDateRevealCanvas() {
    if (horizontalTravel > 0) {
      return;
    }

    const bounds = dateReveal.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    dateRevealCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    dateRevealCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#fefefe";
    context.fillRect(0, 0, bounds.width, bounds.height);
    dateReveal.classList.add("is-initialized");
  }

  function eraseBetween(from, to) {
    const bounds = dateReveal.getBoundingClientRect();
    const brush = Math.min(46, Math.max(24, bounds.width * 0.075));
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brush * 2;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function completeDateReveal() {
    if (dateReveal.classList.contains("is-finishing")) {
      return;
    }

    dateReveal.classList.add("is-finishing");
    dateSection.classList.add("is-revealed");

    if (!reducedMotion) {
      dateMagic.classList.add("is-active");
    }

    try {
      sessionStorage.setItem(dateRevealStorageKey, "true");
    } catch {
      // La interacción sigue funcionando aunque el almacenamiento esté bloqueado.
    }

    window.setTimeout(() => {
      dateReveal.hidden = true;
      dateScrollUnlocked = true;
    }, reducedMotion ? 280 : 430);
  }

  sizeDateRevealCanvas();

  const dateResizeObserver = new ResizeObserver(sizeDateRevealCanvas);
  dateResizeObserver.observe(dateReveal);

  dateReveal.addEventListener("pointerdown", (event) => {
    if (event.target === dateRevealButton) {
      return;
    }

    activePointer = event.pointerId;
    previousPoint = { x: event.offsetX, y: event.offsetY };
    dateReveal.classList.add("has-interacted");
    dateReveal.setPointerCapture(event.pointerId);
  });

  dateReveal.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer || !previousPoint) {
      return;
    }

    const nextPoint = { x: event.offsetX, y: event.offsetY };
    const deltaX = nextPoint.x - previousPoint.x;
    const deltaY = nextPoint.y - previousPoint.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      eraseBetween(previousPoint, nextPoint);
      horizontalTravel += Math.abs(deltaX);
      revealProgress = horizontalTravel / (dateReveal.clientWidth * 4.6);
      dateReveal.classList.toggle("is-scratching", revealProgress > 0.05);

      if (revealProgress >= 1) {
        completeDateReveal();
      }
    }

    previousPoint = nextPoint;
  });

  function releaseDatePointer(event) {
    if (event.pointerId === activePointer) {
      activePointer = null;
      previousPoint = null;
    }
  }

  dateReveal.addEventListener("pointerup", releaseDatePointer);
  dateReveal.addEventListener("pointercancel", releaseDatePointer);
  dateRevealButton.addEventListener("click", completeDateReveal);
}

/* Música: botón flotante para reproducir y pausar. */
const audioToggle = document.querySelector("#audioToggle");
const invitationAudio = document.querySelector("#invitationAudio");
let audioFadeFrame = 0;

function syncAudioControl(isPlaying) {
  audioToggle.classList.toggle("is-playing", isPlaying);
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
  audioToggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
}

function fadeAudioTo(targetVolume = 0.6, duration = 1600) {
  window.cancelAnimationFrame(audioFadeFrame);
  const startedAt = performance.now();
  const startingVolume = invitationAudio.volume;

  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    invitationAudio.volume = startingVolume + (targetVolume - startingVolume) * eased;
    if (progress < 1) audioFadeFrame = window.requestAnimationFrame(step);
  }

  audioFadeFrame = window.requestAnimationFrame(step);
}

async function startInvitationAudio() {
  window.cancelAnimationFrame(audioFadeFrame);
  invitationAudio.volume = 0.05;

  try {
    await invitationAudio.play();
    fadeAudioTo();
  } catch {
    syncAudioControl(false);
  }
}

// El botón solo aparece si el archivo de música existe (en iPhone el audio no se
// precarga hasta que se toca la pantalla, por eso se consulta el archivo directamente).
fetch(invitationAudio.src, { method: "HEAD" })
  .then((response) => {
    if (response.ok) audioToggle.hidden = false;
  })
  .catch(() => {});

audioToggle.addEventListener("click", () => {
  if (invitationAudio.paused) {
    startInvitationAudio();
  } else {
    window.cancelAnimationFrame(audioFadeFrame);
    invitationAudio.pause();
  }
});

invitationAudio.addEventListener("play", () => syncAudioControl(true));
invitationAudio.addEventListener("pause", () => syncAudioControl(false));
