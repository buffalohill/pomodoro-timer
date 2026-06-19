const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const DURATIONS = {
  work: WORK_DURATION,
  break: BREAK_DURATION,
};

const app = document.getElementById('app');
const modeIndicator = document.getElementById('mode-indicator');
const timeDisplay = document.getElementById('time-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');

let timeRemaining = WORK_DURATION;
let isRunning = false;
let currentMode = 'work';
let intervalId = null;

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
  timeRemaining = DURATIONS[currentMode];
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
  timeRemaining = DURATIONS[currentMode];
  updateDOM();
}

startPauseBtn.addEventListener('click', toggleStartPause);
resetBtn.addEventListener('click', reset);

updateDOM();
