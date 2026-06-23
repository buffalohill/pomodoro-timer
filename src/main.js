const MINUTES_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45];

const END_CAP_LABELS = {
  work: { start: "Let's go!", end: '...then take a break!' },
  pause: { start: 'Refuel your energy!', end: '...then ready for more!' },
};

const app = document.getElementById('app');
const modeSwitch = document.getElementById('mode-switch');
const timeDisplay = document.getElementById('time-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const minutesViewport = document.getElementById('minutes-viewport');
const minutesTrack = document.getElementById('minutes-track');

let selectedWorkMinutes = 25;
let selectedPauseMinutes = 5;
let timeRemaining = selectedWorkMinutes * 60;
let isRunning = false;
let currentMode = 'work';
let intervalId = null;

function getSelectedMinutes(mode) {
  return mode === 'work' ? selectedWorkMinutes : selectedPauseMinutes;
}

function setSelectedMinutes(mode, minute) {
  if (!MINUTES_OPTIONS.includes(minute)) return;
  if (mode === 'work') {
    selectedWorkMinutes = minute;
  } else {
    selectedPauseMinutes = minute;
  }
}

function getDurationForMode(mode) {
  return getSelectedMinutes(mode) * 60;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDatetime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `PT${mins}M`;
  return `PT${mins}M${secs}S`;
}

function updateEndCapLabels() {
  const labels = END_CAP_LABELS[currentMode];
  minutesTrack.querySelector('.minutes-picker__end-cap--start .minutes-picker__end-cap-text').textContent =
    labels.start;
  minutesTrack.querySelector('.minutes-picker__end-cap--end .minutes-picker__end-cap-text').textContent =
    labels.end;
}

function updateModeSwitch() {
  modeSwitch.querySelectorAll('.mode-switch__option').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.mode === currentMode ? 'true' : 'false');
  });
}

function updateDOM() {
  app.dataset.mode = currentMode;
  app.dataset.running = isRunning ? 'true' : 'false';
  updateModeSwitch();
  timeDisplay.textContent = formatTime(timeRemaining);
  timeDisplay.dateTime = formatDatetime(timeRemaining);
  startPauseBtn.textContent = isRunning ? 'Pause' : 'Start';
}

function stopInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startTimer() {
  isRunning = true;
  intervalId = setInterval(tick, 1000);
}

function tick() {
  timeRemaining -= 1;
  updateDOM();

  if (timeRemaining <= 0) {
    switchMode();
  }
}

function setMode(mode) {
  if (mode !== 'work' && mode !== 'pause') return;
  if (mode === currentMode) return;

  currentMode = mode;
  updateEndCapLabels();
  scrollToMinute(getSelectedMinutes(currentMode));

  if (!isRunning) {
    timeRemaining = getDurationForMode(currentMode);
  }

  updateDOM();
}

function switchMode() {
  stopInterval();
  currentMode = currentMode === 'work' ? 'pause' : 'work';
  updateEndCapLabels();
  scrollToMinute(getSelectedMinutes(currentMode));
  timeRemaining = getDurationForMode(currentMode);
  startTimer();
  updateDOM();
}

function toggleStartPause() {
  if (isRunning) {
    stopInterval();
    isRunning = false;
  } else {
    startTimer();
  }
  updateDOM();
}

function reset() {
  stopInterval();
  isRunning = false;
  timeRemaining = getDurationForMode(currentMode);
  updateDOM();
}

function createEndCap(text, side) {
  const cap = document.createElement('div');
  cap.className = `minutes-picker__end-cap minutes-picker__end-cap--${side}`;
  cap.innerHTML = `<span class="minutes-picker__end-cap-text">${text}</span>`;
  return cap;
}

function createMajorTick(minute) {
  const tick = document.createElement('div');
  tick.className = 'minutes-picker__tick minutes-picker__tick--major';
  tick.dataset.minute = String(minute);
  tick.innerHTML = `
    <span class="minutes-picker__tick-label">${minute}</span>
    <span class="minutes-picker__tick-mark"></span>
  `;
  return tick;
}

function buildMinutesTrack() {
  const labels = END_CAP_LABELS[currentMode];
  minutesTrack.appendChild(createEndCap(labels.start, 'start'));
  MINUTES_OPTIONS.forEach((minute) => {
    minutesTrack.appendChild(createMajorTick(minute));
  });
  minutesTrack.appendChild(createEndCap(labels.end, 'end'));
}

let minScrollLeft = 0;
let maxScrollLeft = 0;

function getScrollLeftToCenterTick(tick) {
  const viewportRect = minutesViewport.getBoundingClientRect();
  const tickRect = tick.getBoundingClientRect();
  const tickCenterX = tickRect.left + tickRect.width / 2;
  const viewportCenterX = viewportRect.left + viewportRect.width / 2;
  return minutesViewport.scrollLeft + (tickCenterX - viewportCenterX);
}

function updateEndCapWidth() {
  const picker = minutesViewport.closest('.minutes-picker');
  const tick = minutesTrack.querySelector('[data-minute="5"]');
  if (!picker || !tick) return;

  const capWidth = minutesViewport.clientWidth / 2 - tick.offsetWidth / 2;
  picker.style.setProperty('--minutes-end-cap-width', `${capWidth}px`);
}

function updateScrollLimits() {
  const tick5 = minutesTrack.querySelector('[data-minute="5"]');
  const tick45 = minutesTrack.querySelector('[data-minute="45"]');
  if (!tick5 || !tick45) return;

  minScrollLeft = getScrollLeftToCenterTick(tick5);
  maxScrollLeft = getScrollLeftToCenterTick(tick45);
}

function clampScroll() {
  if (minutesViewport.scrollLeft < minScrollLeft) {
    minutesViewport.scrollLeft = minScrollLeft;
  } else if (minutesViewport.scrollLeft > maxScrollLeft) {
    minutesViewport.scrollLeft = maxScrollLeft;
  }
}

function getCenteredMinute() {
  const viewportRect = minutesViewport.getBoundingClientRect();
  const centerX = viewportRect.left + viewportRect.width / 2;

  let closestMinute = getSelectedMinutes(currentMode);
  let closestDistance = Infinity;

  minutesTrack.querySelectorAll('[data-minute]').forEach((tick) => {
    const tickRect = tick.getBoundingClientRect();
    const tickCenterX = tickRect.left + tickRect.width / 2;
    const distance = Math.abs(tickCenterX - centerX);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestMinute = Number(tick.dataset.minute);
    }
  });

  return closestMinute;
}

function scrollToMinute(minute, behavior = 'auto') {
  const tick = minutesTrack.querySelector(`[data-minute="${minute}"]`);
  if (!tick) return;

  minutesViewport.scrollTo({
    left: getScrollLeftToCenterTick(tick),
    behavior,
  });
}

function applySelectedMinutes(minute) {
  const current = getSelectedMinutes(currentMode);
  if (!MINUTES_OPTIONS.includes(minute) || minute === current) return;

  setSelectedMinutes(currentMode, minute);

  if (!isRunning) {
    timeRemaining = getDurationForMode(currentMode);
    updateDOM();
  }
}

function handleMinutesScroll() {
  clampScroll();
  applySelectedMinutes(getCenteredMinute());
}

function initMinutesPicker() {
  buildMinutesTrack();
  updateEndCapWidth();
  updateScrollLimits();
  scrollToMinute(getSelectedMinutes(currentMode));

  minutesViewport.addEventListener('scroll', handleMinutesScroll, { passive: true });
  minutesViewport.addEventListener('scrollend', handleMinutesScroll);
  window.addEventListener('resize', () => {
    updateEndCapWidth();
    updateScrollLimits();
    clampScroll();
  });
}

function initModeSwitch() {
  modeSwitch.querySelectorAll('.mode-switch__option').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
}

startPauseBtn.addEventListener('click', toggleStartPause);
resetBtn.addEventListener('click', reset);

initMinutesPicker();
initModeSwitch();
updateDOM();
