const BREAK_DURATION = 5 * 60;
const WORK_MINUTES_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45];

const app = document.getElementById('app');
const modeIndicator = document.getElementById('mode-indicator');
const timeDisplay = document.getElementById('time-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const minutesViewport = document.getElementById('minutes-viewport');
const minutesTrack = document.getElementById('minutes-track');

let selectedWorkMinutes = 25;
let timeRemaining = selectedWorkMinutes * 60;
let isRunning = false;
let currentMode = 'work';
let intervalId = null;

function getWorkDuration() {
  return selectedWorkMinutes * 60;
}

function getDurationForMode(mode) {
  return mode === 'work' ? getWorkDuration() : BREAK_DURATION;
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

function updateDOM() {
  app.dataset.mode = currentMode;
  modeIndicator.textContent = currentMode === 'work' ? 'Work' : 'Break';
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

function tick() {
  timeRemaining -= 1;
  updateDOM();

  if (timeRemaining <= 0) {
    switchMode();
  }
}

function switchMode() {
  stopInterval();
  isRunning = false;
  currentMode = currentMode === 'work' ? 'break' : 'work';
  timeRemaining = getDurationForMode(currentMode);
  updateDOM();
}

function toggleStartPause() {
  if (isRunning) {
    stopInterval();
    isRunning = false;
  } else {
    isRunning = true;
    intervalId = setInterval(tick, 1000);
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
  minutesTrack.appendChild(createEndCap("let's go!", 'start'));
  WORK_MINUTES_OPTIONS.forEach((minute) => {
    minutesTrack.appendChild(createMajorTick(minute));
  });
  minutesTrack.appendChild(createEndCap('Take a break!', 'end'));
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

  let closestMinute = selectedWorkMinutes;
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

function applySelectedWorkMinutes(minute) {
  if (!WORK_MINUTES_OPTIONS.includes(minute) || minute === selectedWorkMinutes) return;

  selectedWorkMinutes = minute;

  if (!isRunning && currentMode === 'work') {
    timeRemaining = getWorkDuration();
    updateDOM();
  }
}

function handleMinutesScroll() {
  clampScroll();
  applySelectedWorkMinutes(getCenteredMinute());
}

function initMinutesPicker() {
  buildMinutesTrack();
  updateEndCapWidth();
  updateScrollLimits();
  scrollToMinute(selectedWorkMinutes);

  minutesViewport.addEventListener('scroll', handleMinutesScroll, { passive: true });
  minutesViewport.addEventListener('scrollend', handleMinutesScroll);
  window.addEventListener('resize', () => {
    updateEndCapWidth();
    updateScrollLimits();
    clampScroll();
  });
}

startPauseBtn.addEventListener('click', toggleStartPause);
resetBtn.addEventListener('click', reset);

initMinutesPicker();
updateDOM();
