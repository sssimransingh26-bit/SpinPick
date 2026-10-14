// SpinPick keeps the options in one array so the list and canvas always share
// the same source of truth.
const DEFAULT_OPTIONS = ["Pizza", "Burger", "Pasta", "Biryani"];
const COLORS = ["#8b5cf6", "#f472b6", "#22d3ee", "#f59e0b", "#34d399", "#fb7185", "#818cf8", "#facc15"];

const canvas = document.querySelector("#wheelCanvas");
const context = canvas.getContext("2d");
const wheelStage = document.querySelector(".wheel-stage");
const optionInput = document.querySelector("#optionInput");
const addForm = document.querySelector("#addForm");
const optionList = document.querySelector("#optionList");
const optionCount = document.querySelector("#optionCount");
const formHint = document.querySelector("#formHint");
const resultText = document.querySelector("#resultText");
const resultCard = document.querySelector("#resultCard");
const spinButton = document.querySelector("#spinButton");
const spinAgainButton = document.querySelector("#spinAgainButton");
const resetButton = document.querySelector("#resetButton");

let options = [...DEFAULT_OPTIONS];
let rotation = 0;
let isSpinning = false;
let animationFrameId;

function drawWheel() {
  const size = wheelStage.clientWidth;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);

  const center = size / 2;
  const radius = size / 2 - 8;
  const slice = (Math.PI * 2) / options.length;

  options.forEach((option, index) => {
    const startAngle = rotation + index * slice - Math.PI / 2;
    const endAngle = startAngle + slice;

    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = COLORS[index % COLORS.length];
    context.fill();
    context.strokeStyle = "rgba(16, 16, 32, 0.45)";
    context.lineWidth = 2;
    context.stroke();

    // Rotate the label so it stays centered within its colorful slice.
    context.save();
    context.translate(center, center);
    context.rotate(startAngle + slice / 2);
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.font = `700 ${Math.max(12, Math.min(18, size / 24))}px system-ui, sans-serif`;
    const label = option.length > 18 ? `${option.slice(0, 17)}…` : option;
    context.fillText(label, radius - 22, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.lineWidth = 4;
  context.stroke();
}

function renderOptions() {
  optionList.innerHTML = "";
  options.forEach((option, index) => {
    const item = document.createElement("li");
    item.className = "option-item";
    item.innerHTML = `
      <span class="option-name">${escapeHtml(option)}</span>
      <button class="remove-option" type="button" data-index="${index}" aria-label="Remove ${escapeHtml(option)}">×</button>
    `;
    optionList.appendChild(item);
  });

  optionCount.textContent = `${options.length} ${options.length === 1 ? "option" : "options"}`;
  spinButton.disabled = options.length < 2 || isSpinning;
  spinAgainButton.disabled = options.length < 2 || isSpinning;
  formHint.textContent = options.length < 2 ? "Add at least two options to start spinning." : "You can add up to 32 characters per option.";
  formHint.classList.remove("error");
  drawWheel();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function addOption(event) {
  event.preventDefault();
  const newOption = optionInput.value.trim();
  if (!newOption) {
    formHint.textContent = "Type an option before adding it.";
    formHint.classList.add("error");
    optionInput.focus();
    return;
  }
  if (options.some((option) => option.toLowerCase() === newOption.toLowerCase())) {
    formHint.textContent = "That option is already on the wheel.";
    formHint.classList.add("error");
    optionInput.focus();
    return;
  }

  options.push(newOption);
  optionInput.value = "";
  renderOptions();
  optionInput.focus();
}

function removeOption(index) {
  if (isSpinning) return;
  options.splice(index, 1);
  resultText.textContent = options.length ? "Ready when you are!" : "Add an option to begin.";
  renderOptions();
}

function spin() {
  if (isSpinning || options.length < 2) return;
  isSpinning = true;
  renderOptions();
  resultCard.classList.remove("winner");
  resultText.textContent = "Spinning…";

  const selectedIndex = Math.floor(Math.random() * options.length);
  const slice = (Math.PI * 2) / options.length;
  // The pointer is at the top. Aim the selected slice's center at that point.
  const targetRotation = rotation + Math.PI * 2 * 6
    + (Math.PI * 2 - (selectedIndex * slice + slice / 2));
  const startRotation = rotation;
  const duration = 4300;
  const startTime = performance.now();

  function animate(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetRotation - startRotation) * easedProgress;
    drawWheel();

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    rotation %= Math.PI * 2;
    isSpinning = false;
    resultText.textContent = options[selectedIndex];
    resultCard.classList.add("winner");
    renderOptions();
  }

  animationFrameId = requestAnimationFrame(animate);
}

function resetWheel() {
  if (isSpinning) return;
  cancelAnimationFrame(animationFrameId);
  options = [...DEFAULT_OPTIONS];
  rotation = 0;
  resultText.textContent = "Ready when you are!";
  resultCard.classList.remove("winner");
  renderOptions();
}

addForm.addEventListener("submit", addOption);
spinButton.addEventListener("click", spin);
spinAgainButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetWheel);
optionList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-option");
  if (removeButton) removeOption(Number(removeButton.dataset.index));
});
window.addEventListener("resize", drawWheel);

renderOptions();