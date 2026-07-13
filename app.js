"use strict";

/* ============================================================
 * Constantes physiques
 * ============================================================ */
const CARD_WIDTH_MM = 85.6;    // carte ISO/IEC 7810 ID-1
const CARD_RATIO = 53.98 / 85.6;
const THUMB_ANGLE_DEG = 2;     // le pouce à bout de bras couvre ~2° d'angle visuel
const ARCMIN_5 = (5 / 60) * Math.PI / 180; // 5 minutes d'arc en radians

// Lignes du test : dénominateurs Snellen en base 6 m (6/60 ... 6/4)
const LINES = [60, 36, 24, 18, 12, 9, 7.5, 6, 5, 4];
const TRIALS_PER_LINE = 5;
const PASS_THRESHOLD = 3; // >= 3 bonnes réponses sur 5 pour passer la ligne

// Équivalents 20 pieds usuels pour l'affichage
const FEET_EQUIV = { 60: 200, 36: 120, 24: 80, 18: 60, 12: 40, 9: 30, 7.5: 25, 6: 20, 5: 16, 4: 13 };

/* ============================================================
 * État global
 * ============================================================ */
const state = {
  pxPerMm: null,        // issu de la calibration
  distanceMm: 1500,     // distance de test choisie
  currentEye: null,     // "right" | "left"
  results: {},          // { right: {denominator|null}, left: {...} }
  // état du test en cours
  lineIndex: 0,
  trial: 0,
  correctCount: 0,
  currentDir: null,
  lastPassedIndex: -1,
};

const DIRS = ["up", "right", "down", "left"];
const ROTATION = { right: 0, down: 90, left: 180, up: 270 };

/* ============================================================
 * Navigation entre étapes
 * ============================================================ */
function show(stepId) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");
  window.scrollTo(0, 0);
}

/* ============================================================
 * Étape 1 — Calibration
 * ============================================================ */
const cardEl = document.getElementById("credit-card");
const slider = document.getElementById("card-slider");

function renderCard(widthPx) {
  cardEl.style.width = widthPx + "px";
  cardEl.style.height = widthPx * CARD_RATIO + "px";
  cardEl.style.fontSize = widthPx / 20 + "px";
}

function initCalibration() {
  // valeur de départ : calibration sauvegardée, sinon estimation ~96 dpi
  const saved = parseFloat(localStorage.getItem("snellen.pxPerMm"));
  const startWidth = saved ? saved * CARD_WIDTH_MM : 3.78 * CARD_WIDTH_MM;
  slider.max = Math.max(1200, Math.round(window.innerWidth * 0.9));
  slider.value = Math.round(startWidth);
  renderCard(slider.valueAsNumber);
}

slider.addEventListener("input", () => renderCard(slider.valueAsNumber));
document.getElementById("card-minus").addEventListener("click", () => {
  slider.value = slider.valueAsNumber - 1;
  renderCard(slider.valueAsNumber);
});
document.getElementById("card-plus").addEventListener("click", () => {
  slider.value = slider.valueAsNumber + 1;
  renderCard(slider.valueAsNumber);
});

document.getElementById("btn-calibrated").addEventListener("click", () => {
  state.pxPerMm = slider.valueAsNumber / CARD_WIDTH_MM;
  localStorage.setItem("snellen.pxPerMm", state.pxPerMm);
  renderThumbBar();
  show("step-distance");
});

/* ============================================================
 * Étape 2 — Distance (méthode du pouce, ~2° d'angle visuel)
 * ============================================================ */
function renderThumbBar() {
  // largeur physique de la barre pour qu'elle sous-tende 2° à la distance choisie
  const barMm = 2 * state.distanceMm * Math.tan((THUMB_ANGLE_DEG / 2) * Math.PI / 180);
  const barPx = barMm * state.pxPerMm;
  document.getElementById("thumb-bar").style.width = barPx + "px";
  document.getElementById("thumb-caption").textContent =
    `Barre de ${(barMm / 10).toFixed(1)} cm — votre pouce doit la couvrir exactement ` +
    `quand vous êtes à ${(state.distanceMm / 1000).toLocaleString("fr")} m.`;
}

document.querySelectorAll(".btn.choice").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn.choice").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.distanceMm = parseInt(btn.dataset.dist, 10);
    renderThumbBar();
  });
});

document.getElementById("btn-distanced").addEventListener("click", () => show("step-eye"));

/* ============================================================
 * Étapes 3–4 — Test
 * ============================================================ */
function optotypeHeightPx(denominator) {
  // À 6/6, l'optotype sous-tend 5 minutes d'arc à la distance de test.
  // Une ligne 6/D est D/6 fois plus grande.
  const heightMm = 2 * state.distanceMm * Math.tan(ARCMIN_5 / 2) * (denominator / 6);
  return heightMm * state.pxPerMm;
}

function startEyeTest(eye) {
  state.currentEye = eye;
  state.lineIndex = 0;
  state.lastPassedIndex = -1;
  startLine();
  show("step-test");
  document.getElementById("test-eye-label").textContent =
    eye === "right" ? "Œil droit (gauche couvert)" : "Œil gauche (droit couvert)";
}

function startLine() {
  state.trial = 0;
  state.correctCount = 0;
  nextTrial();
}

function nextTrial() {
  const denom = LINES[state.lineIndex];
  // nouvelle orientation, différente de la précédente pour éviter les répétitions
  let dir;
  do { dir = DIRS[Math.floor(Math.random() * DIRS.length)]; } while (dir === state.currentDir);
  state.currentDir = dir;

  const svg = document.getElementById("optotype");
  const px = optotypeHeightPx(denom);
  svg.style.width = px + "px";
  svg.style.height = px + "px";
  document.getElementById("optotype-g")
    .setAttribute("transform", `rotate(${ROTATION[dir]} 2.5 2.5)`);

  document.getElementById("test-line-label").textContent =
    `Ligne 6/${denom} — optotype ${state.trial + 1}/${TRIALS_PER_LINE}`;
}

function answer(dir) {
  if (dir === state.currentDir) state.correctCount++;
  state.trial++;

  const remaining = TRIALS_PER_LINE - state.trial;
  // arrêt anticipé : ligne réussie ou échouée mathématiquement
  if (state.correctCount >= PASS_THRESHOLD) return passLine();
  if (state.correctCount + remaining < PASS_THRESHOLD) return failLine();
  if (state.trial >= TRIALS_PER_LINE) {
    return state.correctCount >= PASS_THRESHOLD ? passLine() : failLine();
  }
  nextTrial();
}

function passLine() {
  state.lastPassedIndex = state.lineIndex;
  if (state.lineIndex + 1 >= LINES.length) return endEyeTest();
  state.lineIndex++;
  startLine();
}

function failLine() {
  endEyeTest();
}

function endEyeTest() {
  state.results[state.currentEye] = {
    denominator: state.lastPassedIndex >= 0 ? LINES[state.lastPassedIndex] : null,
  };
  if (state.currentEye === "right") {
    const r = state.results.right;
    document.getElementById("switch-result").textContent =
      "Œil droit : " + (r.denominator !== null
        ? `environ 6/${r.denominator} (${feetNotation(r.denominator)}).`
        : "moins que 6/60 dans ces conditions de test.");
    show("step-switch");
  } else {
    showResults();
  }
}

document.querySelectorAll(".btn.arrow").forEach(btn =>
  btn.addEventListener("click", () => answer(btn.dataset.dir))
);
document.getElementById("btn-cant-see").addEventListener("click", failLine);

document.addEventListener("keydown", e => {
  if (!document.getElementById("step-test").classList.contains("active")) return;
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (map[e.key]) {
    e.preventDefault();
    answer(map[e.key]);
  }
});

/* ============================================================
 * Étape 5 — Résultats
 * ============================================================ */
function feetNotation(denom) {
  return `20/${FEET_EQUIV[denom] ?? Math.round(denom * 20 / 6)}`;
}

function resultRow(label, res) {
  if (res.denominator === null) {
    return `<tr><td>${label}</td><td colspan="4">Moins que 6/60 — impossible d'estimer avec ce test</td></tr>`;
  }
  const d = res.denominator;
  const decimal = (6 / d).toFixed(2);
  const logmar = Math.log10(d / 6).toFixed(2);
  return `<tr><td>${label}</td><td>6/${d}</td><td>${feetNotation(d)}</td><td>${decimal}</td><td>${logmar}</td></tr>`;
}

function showResults() {
  const tbody = document.querySelector("#results-table tbody");
  tbody.innerHTML =
    resultRow("Œil droit", state.results.right) +
    resultRow("Œil gauche", state.results.left);

  const denoms = [state.results.right.denominator, state.results.left.denominator];
  const comment = document.getElementById("results-comment");
  if (denoms.every(d => d !== null && d <= 6)) {
    comment.textContent = "Les deux yeux atteignent 6/6 (20/20) ou mieux dans ce test — c'est la vision dite « normale ».";
  } else if (denoms.some(d => d === null || d > 12)) {
    comment.textContent = "Au moins un œil est nettement en dessous de 6/12 dans ce test. C'est une bonne raison de prendre rendez-vous chez un professionnel de la vue.";
  } else {
    comment.textContent = "Résultat proche de la normale mais pas parfait. Si vous remarquez une gêne au quotidien, un examen professionnel vaut la peine.";
  }
  show("step-results");
}

/* ============================================================
 * Navigation générale
 * ============================================================ */
document.getElementById("btn-start").addEventListener("click", () => {
  initCalibration();
  show("step-calibrate");
});
document.getElementById("btn-eye-right").addEventListener("click", () => startEyeTest("right"));
document.getElementById("btn-eye-left").addEventListener("click", () => startEyeTest("left"));
document.getElementById("btn-restart").addEventListener("click", () => {
  state.results = {};
  show("step-intro");
});
