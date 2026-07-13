"use strict";

/* ============================================================
 * Constantes physiques / Physical constants
 * ============================================================ */
const CARD_WIDTH_MM = 85.6;    // carte ISO/IEC 7810 ID-1 / ISO card width
const CARD_RATIO = 53.98 / 85.6;
const THUMB_ANGLE_DEG = 2;     // pouce à bout de bras ≈ 2° / thumb at arm's length ≈ 2°
const BLINDSPOT_ANGLE_DEG = 13.5; // bord proche de la tache aveugle / near edge of blind spot
const ARCMIN_5 = (5 / 60) * Math.PI / 180; // 5 minutes d'arc en radians

// Lignes du test : dénominateurs Snellen en base 6 m (6/60 ... 6/4)
const LINES = [60, 36, 24, 18, 12, 9, 7.5, 6, 5, 4];
const TRIALS_PER_LINE = 5;
const PASS_THRESHOLD = 3; // >= 3 bonnes réponses sur 5 pour passer la ligne

// Équivalents 20 pieds usuels / usual 20-ft equivalents
const FEET_EQUIV = { 60: 200, 36: 120, 24: 80, 18: 60, 12: 40, 9: 30, 7.5: 25, 6: 20, 5: 16, 4: 13 };

const BS_TRIALS = 3; // nombre de mesures de la tache aveugle / blind-spot trials
const LETTERS = ["C", "D", "E", "F", "L", "N", "O", "P", "T", "Z"];

/* ============================================================
 * Internationalisation FR / EN
 * ============================================================ */
const I18N = {
  fr: {
    "intro.title": "👁️ Test de Snellen à la maison",
    "intro.lead": "Estimez votre acuité visuelle depuis chez vous, en trois étapes :",
    "intro.step1": "<strong>Calibration</strong> — mesurez votre écran avec une carte de crédit",
    "intro.step2": "<strong>Distance</strong> — vérifiée avec votre pouce <em>et</em> votre tache aveugle",
    "intro.step3": "<strong>Test</strong> — choisissez entre les « E » directionnels et les lettres classiques",
    "intro.warning": "⚠️ <strong>Ce test n'est pas un examen médical.</strong> Il donne seulement une estimation approximative de votre acuité visuelle. Il ne remplace en aucun cas une consultation chez un optométriste ou un ophtalmologiste. Consultez un professionnel pour tout problème de vision.",
    "intro.need": "Il vous faut : une carte de crédit (ou toute carte au format standard), un endroit où reculer d'environ 2 mètres, et quelque chose pour couvrir un œil.",
    "intro.start": "Commencer",

    "cal.title": "Étape 1 — Calibration de l'écran",
    "cal.instructions": "Placez une carte de crédit <strong>contre l'écran</strong>, sur le rectangle ci-dessous. Ajustez le curseur jusqu'à ce que le rectangle ait <strong>exactement la même taille</strong> que votre carte.",
    "cal.smaller": "− plus petit",
    "cal.larger": "+ plus grand",
    "cal.tip": "Astuce : alignez le coin inférieur gauche de la carte avec celui du rectangle, puis ajustez jusqu'à ce que les bords droit et supérieur coïncident. Les flèches gauche/droite du clavier rapetissent ou agrandissent aussi le rectangle.",
    "cal.done": "Le rectangle correspond à ma carte ✓",

    "dist.title": "Étape 2 — Distance de vision",
    "dist.choose": "Placez-vous le plus loin possible de l'écran, tout en pouvant encore toucher la barre d'espace et utiliser votre souris ou votre pavé tactile sans avancer.",
    "dist.thumbTitle": "Méthode 1 — le pouce (≈ 2° d'angle visuel)",
    "dist.thumbText": "Tendez le bras complètement, pouce levé, un œil fermé. Ajustez le curseur pour changer la taille de la grille jusqu'à ce que votre pouce couvre <em>exactement</em> la barre ci-dessous. Cette étape donne une première estimation de la distance.",
    "dist.sliderLabel": "Distance estimée",
    "dist.sliderHint": "Plus vous êtes loin, plus la barre devient large. Vous pouvez utiliser les boutons, le curseur, ou les flèches gauche/droite du clavier.",
    "dist.thumbSmaller": "Plus petit",
    "dist.thumbLarger": "Plus grand",
    "dist.blindStart": "Démarrer la mesure",
    "dist.blindRestart": "Refaire la mesure",
    "dist.blindGone": "Il a disparu ! (ou Espace)",
    "dist.ok": "Continuer ✓",
    "dist.stay": "Gardez cette position générale. La tache aveugle sera mesurée juste avant chaque œil, pour corriger si vous avez bougé un peu.",
    "dist.headAlignTitle": "Placez votre tête au centre de l'écran",
    "dist.headAlignText": "Avant de démarrer, alignez votre visage avec le milieu de l'écran. Une fois la mesure commencée, gardez la tête immobile et bougez seulement vos yeux, pas votre tête.",
    "dist.blindStay": "Vous devez faire la mesure de la tache aveugle avant de pouvoir commencer le test de cet œil.",
    "dist.startEyeTest": "Commencer le test de cet œil",

    "mode.title": "Étape 3 — Type de test",
    "mode.text": "Les deux options utilisent les mêmes niveaux de taille. Choisissez celle que vous voulez faire.",
    "mode.eTitle": "E directionnel",
    "mode.eText": "Le E tourne; vous indiquez la direction de ses branches.",
    "mode.lettersTitle": "Lettres classiques",
    "mode.lettersText": "Une lettre apparaît; vous choisissez ou tapez la lettre vue.",
    "mode.next": "Continuer",

    "eye.title": "Étape 4 — Préparation du test",
    "eye.p1": "Le test se fait <strong>un œil à la fois</strong>. Couvrez l'autre œil avec la paume de la main (sans appuyer) ou un cache. Gardez vos lunettes ou lentilles si vous en portez habituellement — le test mesurera votre vision corrigée.",
    "eye.p2": "Selon le mode choisi, vous verrez soit un « E » tourné dans une des quatre directions, soit une lettre classique. Répondez avec le clavier ou les boutons à l'écran. Si vous ne voyez pas bien, devinez !",
    "eye.startRight": "Commencer — œil droit<br><small>(couvrez l'œil gauche)</small>",

    "test.question": "Vers où pointent les branches du E ?",
    "test.headAlignReminder": "Gardez votre tête alignée avec le centre de l'écran et immobile pendant tout le test.",
    "test.cantSee": "Je ne vois qu'une tache ✗",
    "test.letterQuestion": "Quelle lettre voyez-vous ?",
    "test.cantRead": "Je ne peux pas lire la lettre ✗",

    "switch.title": "Premier œil terminé ✓",
    "switch.text": "Maintenant, couvrez l'<strong>œil droit</strong>. On va refaire la mesure de la tache aveugle avant de tester l'<strong>œil gauche</strong>, au cas où votre position aurait un peu changé.",
    "switch.btn": "Tester l'œil gauche",

    "results.title": "Résultats",
    "results.thSnellenM": "Snellen (m)",
    "results.thSnellenFt": "Snellen (pi)",
    "results.thDecimal": "Décimale",
    "results.warning": "⚠️ Rappel : ceci est une <strong>estimation à titre indicatif seulement</strong>, sensible à la calibration, à la distance réelle, à l'éclairage et à la qualité de l'écran. Seul un examen par un professionnel de la vue est fiable. En cas de doute ou de changement dans votre vision, consultez.",
    "results.restart": "Refaire le test",

    "footer.text": "Test 100 % local — aucune donnée n'est envoyée nulle part. Optotypes : E de Snellen et lettres classiques.",

    // Chaînes dynamiques
    eyeRightLabel: "Œil droit ouvert (œil gauche fermé)",
    eyeLeftLabel: "Œil gauche ouvert (œil droit fermé)",
    blindTitle: (measureEye, testEye) => `Tache aveugle — mesure avec l'${measureEye === "right" ? "œil droit" : "œil gauche"} (${testEye === "right" ? "test de l'œil droit" : "test de l'œil gauche"})`,
    blindEyeBox: (openEye, closedEye) => `Ouvrez l'${openEye}. Fermez l'${closedEye}.`,
    blindText: (closedEye, openEye, fixSide, direction) => `On mesure la distance avec les deux yeux pour être plus précis. <strong>Fermez l'${closedEye}</strong> et gardez <strong>l'${openEye} ouvert</strong>. Fixez la croix <strong>+</strong> située à ${fixSide} avec l'œil ouvert, <em>sans bouger les yeux</em>. Le point va se déplacer vers ${direction} : cliquez ou appuyez sur <strong>Espace</strong> à l'instant où il disparaît. On répète 3 fois.`,
    blindZoneInstruction: (closedEye, openEye, fixSide) => `Fermez l'${closedEye}. Fixez la croix à ${fixSide} avec l'${openEye}.`,
    eyeOpenShort: "ouvert",
    eyeClosedShort: "fermé",
    bsProgressText: "mesures faites",
    bsSwitchEye: "Changez d'œil, puis démarrez la prochaine mesure.",
    startEyeTestLabel: (eye) => `Commencer le test de l'${eye === "right" ? "œil droit" : "œil gauche"}`,
    lineLabel: (d, i, n) => `Ligne 6/${fmt(d)} — optotype ${i}/${n}`,
    thumbCaption: (cm, m) => `Barre de ${cm} cm — votre pouce doit la couvrir exactement quand vous êtes à ${m} m.`,
    bsTrial: (i, n) => `Mesure ${i}/${n} — fixez la croix, Espace ou clic dès que le point disparaît.`,
    bsEdge: (m) => `Le point a atteint le bord de l'écran sans disparaître — soit vous êtes à plus de ~${m} m (écran trop étroit pour mesurer), soit l'œil a quitté la croix. Essai ignoré.`,
    bsResult: (m) => `Distance mesurée par la tache aveugle : environ <strong>${m} m</strong>.`,
    bsOneDone: (eye, m) => `Mesure avec l'${eye === "right" ? "œil droit" : "œil gauche"} : environ <strong>${m} m</strong>. Mesurez maintenant l'autre œil.`,
    bsOneInvalid: (eye) => `Mesure avec l'${eye === "right" ? "œil droit" : "œil gauche"} non valide. Mesurez maintenant l'autre œil.`,
    bsBothResult: (r, l, avg) => `Distance mesurée — œil droit : ${r}; œil gauche : ${l}. Moyenne utilisée : <strong>${avg} m</strong>.`,
    bsCompare: (pct, target) => ` Écart de ${pct} % par rapport à l'estimation au pouce de ${target} m.`,
    bsNone: "Aucune mesure valide — refaites la mesure de la tache aveugle pour commencer le test.",
    bsRequired: "Faites d'abord la mesure de la tache aveugle pour confirmer la distance.",
    useMeasured: (m) => `✓ Le test utilisera la distance mesurée : ${m} m.`,
    usePending: (m) => `Distance estimée au pouce : ${m} m. Confirmez-la avec la tache aveugle pour commencer le test.`,
    useNominal: (m) => `Le test utilisera la distance nominale : ${m} m (tache aveugle non mesurée).`,
    rightEyeResult: (txt) => `Œil droit : ${txt}.`,
    approx: (d, ft) => `environ 6/${fmt(d)} (${ft})`,
    worse: "moins que 6/60 dans ces conditions de test",
    rowWorse: "Moins que 6/60 — impossible d'estimer avec ce test",
    rightEye: "Œil droit",
    leftEye: "Œil gauche",
    resultsDistance: (r, l) => `Distance utilisée — œil droit : ${r} m; œil gauche : ${l} m.`,
    commentGood: "Les deux yeux atteignent 6/6 (20/20) ou mieux dans ce test — c'est la vision dite « normale ».",
    commentBad: "Au moins un œil est nettement en dessous de 6/12 dans ce test. C'est une bonne raison de prendre rendez-vous chez un professionnel de la vue.",
    commentMid: "Résultat proche de la normale mais pas parfait. Si vous remarquez une gêne au quotidien, un examen professionnel vaut la peine.",
  },

  en: {
    "intro.title": "👁️ Home Snellen Test",
    "intro.lead": "Estimate your visual acuity from home, in three steps:",
    "intro.step1": "<strong>Calibration</strong> — measure your screen with a credit card",
    "intro.step2": "<strong>Distance</strong> — checked with your thumb <em>and</em> your blind spot",
    "intro.step3": "<strong>Test</strong> — choose between tumbling “E” and regular letters",
    "intro.warning": "⚠️ <strong>This is not a medical exam.</strong> It only gives a rough estimate of your visual acuity and is no substitute for a visit to an optometrist or ophthalmologist. See a professional for any vision concern.",
    "intro.need": "You will need: a credit card (or any standard-size card), room to step back about 2 metres (6–7 ft), and something to cover one eye.",
    "intro.start": "Start",

    "cal.title": "Step 1 — Screen calibration",
    "cal.instructions": "Hold a credit card <strong>against the screen</strong>, over the rectangle below. Adjust the slider until the rectangle is <strong>exactly the same size</strong> as your card.",
    "cal.smaller": "− smaller",
    "cal.larger": "+ larger",
    "cal.tip": "Tip: line up the bottom-left corner of the card with the rectangle's, then adjust until the right and top edges match. The keyboard left/right arrows also shrink or enlarge the rectangle.",
    "cal.done": "The rectangle matches my card ✓",

    "dist.title": "Step 2 — Viewing distance",
    "dist.choose": "Move as far from the screen as possible while still being able to press Space and use your mouse or trackpad without leaning forward.",
    "dist.thumbTitle": "Method 1 — your thumb (≈ 2° of visual angle)",
    "dist.thumbText": "Fully extend your arm, thumb up, one eye closed. Adjust the slider to change the grid size until your thumb <em>exactly</em> covers the bar below. This gives a first estimate of your distance.",
    "dist.sliderLabel": "Estimated distance",
    "dist.sliderHint": "The farther away you are, the wider the bar becomes. You can use the buttons, the slider, or the keyboard left/right arrows.",
    "dist.thumbSmaller": "Smaller",
    "dist.thumbLarger": "Larger",
    "dist.blindStart": "Start measuring",
    "dist.blindRestart": "Measure again",
    "dist.blindGone": "It vanished! (or Space)",
    "dist.ok": "Continue ✓",
    "dist.stay": "Keep this general position. Your blind spot will be measured right before each eye, so it is okay if you moved a little.",
    "dist.headAlignTitle": "Center your head with the screen",
    "dist.headAlignText": "Before starting, align your face with the middle of the screen. Once measuring starts, keep your head still and move only your eyes, not your head.",
    "dist.blindStay": "You must complete the blind-spot measurement before starting this eye's test.",
    "dist.startEyeTest": "Start this eye's test",

    "mode.title": "Step 3 — Test type",
    "mode.text": "Both options use the same size levels. Choose the one you want to take.",
    "mode.eTitle": "Tumbling E",
    "mode.eText": "The E rotates; you report which way its prongs point.",
    "mode.lettersTitle": "Regular letters",
    "mode.lettersText": "A letter appears; choose or type the letter you see.",
    "mode.next": "Continue",

    "eye.title": "Step 4 — Getting ready",
    "eye.p1": "The test is done <strong>one eye at a time</strong>. Cover the other eye with your palm (without pressing) or an occluder. Keep your glasses or contacts if you normally wear them — the test will measure your corrected vision.",
    "eye.p2": "Depending on the chosen mode, you will see either an “E” rotated in one of four directions or a regular letter. Answer with the keyboard or the on-screen buttons. If you can't see it clearly, guess!",
    "eye.startRight": "Start — right eye<br><small>(cover your left eye)</small>",

    "test.question": "Which way do the prongs of the E point?",
    "test.headAlignReminder": "Keep your head aligned with the center of the screen and still throughout the test.",
    "test.cantSee": "I only see a blur ✗",
    "test.letterQuestion": "Which letter do you see?",
    "test.cantRead": "I can't read the letter ✗",

    "switch.title": "First eye done ✓",
    "switch.text": "Now cover your <strong>right eye</strong>. We will measure the blind spot again before testing the <strong>left eye</strong>, in case your position changed a little.",
    "switch.btn": "Test the left eye",

    "results.title": "Results",
    "results.thSnellenM": "Snellen (m)",
    "results.thSnellenFt": "Snellen (ft)",
    "results.thDecimal": "Decimal",
    "results.warning": "⚠️ Reminder: this is an <strong>estimate for information only</strong>, sensitive to calibration, actual distance, lighting and screen quality. Only an exam by an eye-care professional is reliable. If in doubt, or if your vision changes, get checked.",
    "results.restart": "Take the test again",

    "footer.text": "Runs 100% locally — no data is sent anywhere. Optotypes: Snellen E and regular letters.",

    // Dynamic strings
    eyeRightLabel: "Right eye open (left eye closed)",
    eyeLeftLabel: "Left eye open (right eye closed)",
    blindTitle: (measureEye, testEye) => `Blind spot — measuring with the ${measureEye === "right" ? "right eye" : "left eye"} (${testEye === "right" ? "right-eye test" : "left-eye test"})`,
    blindEyeBox: (openEye, closedEye) => `Open your ${openEye}. Close your ${closedEye}.`,
    blindText: (closedEye, openEye, fixSide, direction) => `We measure distance with both eyes for better precision. <strong>Close your ${closedEye}</strong> and keep your <strong>${openEye} open</strong>. Stare at the <strong>+</strong> cross on the ${fixSide} with the open eye, <em>without moving your eyes</em>. The dot will move ${direction}: click or press <strong>Space</strong> the instant it disappears. We repeat 3 times.`,
    blindZoneInstruction: (closedEye, openEye, fixSide) => `Close your ${closedEye}. Stare at the cross on the ${fixSide} with your ${openEye}.`,
    eyeOpenShort: "open",
    eyeClosedShort: "closed",
    bsProgressText: "measurements done",
    bsSwitchEye: "Switch eyes, then start the next measurement.",
    startEyeTestLabel: (eye) => `Start the ${eye === "right" ? "right-eye" : "left-eye"} test`,
    lineLabel: (d, i, n) => `Line 6/${fmt(d)} — optotype ${i}/${n}`,
    thumbCaption: (cm, m) => `${cm} cm bar — your thumb should cover it exactly when you are ${m} m away.`,
    bsTrial: (i, n) => `Measure ${i}/${n} — stare at the cross, press Space or click as soon as the dot disappears.`,
    bsEdge: (m) => `The dot reached the edge of the screen without disappearing — either you are farther than ~${m} m (screen too narrow to measure), or your eye left the cross. Trial discarded.`,
    bsResult: (m) => `Distance measured via the blind spot: about <strong>${m} m</strong>.`,
    bsOneDone: (eye, m) => `Measurement with the ${eye === "right" ? "right eye" : "left eye"}: about <strong>${m} m</strong>. Now measure the other eye.`,
    bsOneInvalid: (eye) => `Measurement with the ${eye === "right" ? "right eye" : "left eye"} was not valid. Now measure the other eye.`,
    bsBothResult: (r, l, avg) => `Measured distance — right eye: ${r}; left eye: ${l}. Average used: <strong>${avg} m</strong>.`,
    bsCompare: (pct, target) => ` That is ${pct}% away from the ${target} m thumb estimate.`,
    bsNone: "No valid measurement — repeat the blind-spot measurement to start the test.",
    bsRequired: "Complete the blind-spot measurement first to confirm the distance.",
    useMeasured: (m) => `✓ The test will use the measured distance: ${m} m.`,
    usePending: (m) => `Thumb-estimated distance: ${m} m. Confirm it with the blind-spot measurement to start the test.`,
    useNominal: (m) => `The test will use the nominal distance: ${m} m (blind spot not measured).`,
    rightEyeResult: (txt) => `Right eye: ${txt}.`,
    approx: (d, ft) => `about 6/${fmt(d)} (${ft})`,
    worse: "worse than 6/60 under these test conditions",
    rowWorse: "Worse than 6/60 — cannot be estimated with this test",
    rightEye: "Right eye",
    leftEye: "Left eye",
    resultsDistance: (r, l) => `Distance used — right eye: ${r} m; left eye: ${l} m.`,
    commentGood: "Both eyes reach 6/6 (20/20) or better on this test — that is so-called “normal” vision.",
    commentBad: "At least one eye is clearly below 6/12 on this test. That is a good reason to book an appointment with an eye-care professional.",
    commentMid: "Close to normal but not perfect. If you notice discomfort day to day, a professional exam is worth it.",
  },
};

let lang = localStorage.getItem("snellen.lang")
  || (navigator.language && navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en");

function t(key) { return I18N[lang][key]; }

function fmt(n) {
  // 7.5 -> "7,5" en français / "7.5" in English
  return lang === "fr" ? String(n).replace(".", ",") : String(n);
}
function fmtM(mm) { return fmt(Math.round(mm / 10) / 100); } // mm -> m, 2 décimales max

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.getElementById("btn-lang-fr").classList.toggle("selected", lang === "fr");
  document.getElementById("btn-lang-en").classList.toggle("selected", lang === "en");
  // rafraîchit les textes dynamiques visibles / refresh visible dynamic text
  if (state.pxPerMm) renderThumbBar();
  if (document.getElementById("step-blindspot").classList.contains("active") && state.currentEye) {
    renderBlindSpotCopy();
  }
  if (document.getElementById("step-test").classList.contains("active") && state.currentEye) {
    renderTestHeader();
  }
  renderDistanceNote();
  renderBsResult();
}

document.querySelectorAll("#lang-toggle .btn").forEach(btn =>
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    localStorage.setItem("snellen.lang", lang);
    applyI18n();
  })
);

/* ============================================================
 * État global / Global state
 * ============================================================ */
const state = {
  pxPerMm: null,        // issu de la calibration / from calibration
  distanceMm: 1500,     // distance nominale choisie / chosen nominal distance
  measuredMm: null,     // distance mesurée par la tache aveugle / blind-spot measurement
  measuredByEye: { right: null, left: null },
  testMode: "tumblingE", // "tumblingE" | "letters"
  currentEye: null,     // "right" | "left"
  results: {},
  lineIndex: 0,
  trial: 0,
  correctCount: 0,
  currentDir: null,
  currentLetter: null,
  lastPassedIndex: -1,
};

// distance réellement utilisée pour dimensionner les optotypes
function testDistanceMm(eye = state.currentEye) {
  return (eye && state.measuredByEye[eye]) ?? state.distanceMm;
}

const DIRS = ["up", "right", "down", "left"];
const ROTATION = { right: 0, down: 90, left: 180, up: 270 };

/* ============================================================
 * Navigation entre étapes / Step navigation
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
const distanceSlider = document.getElementById("distance-slider");

function renderCard(widthPx) {
  cardEl.style.width = widthPx + "px";
  cardEl.style.height = widthPx * CARD_RATIO + "px";
  cardEl.style.fontSize = widthPx / 20 + "px";
}

function setCardWidth(widthPx) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  slider.value = Math.min(max, Math.max(min, widthPx));
  renderCard(slider.valueAsNumber);
}

function adjustCardWidth(deltaPx) {
  setCardWidth(slider.valueAsNumber + deltaPx);
}

function initCalibration() {
  const saved = parseFloat(localStorage.getItem("snellen.pxPerMm"));
  const startWidth = saved ? saved * CARD_WIDTH_MM : 3.78 * CARD_WIDTH_MM; // défaut ≈ 96 dpi
  slider.max = Math.max(1200, Math.round(window.innerWidth * 0.9));
  slider.value = Math.round(startWidth);
  renderCard(slider.valueAsNumber);
}

slider.addEventListener("input", () => setCardWidth(slider.valueAsNumber));
document.getElementById("card-minus").addEventListener("click", () => adjustCardWidth(-1));
document.getElementById("card-plus").addEventListener("click", () => adjustCardWidth(1));

document.getElementById("btn-calibrated").addEventListener("click", () => {
  state.pxPerMm = slider.valueAsNumber / CARD_WIDTH_MM;
  localStorage.setItem("snellen.pxPerMm", state.pxPerMm);
  renderThumbBar();
  renderDistanceNote();
  show("step-distance");
});

/* ============================================================
 * Étape 2a — Distance : méthode du pouce / thumb method
 * ============================================================ */
function renderThumbBar() {
  const barMm = 2 * state.distanceMm * Math.tan((THUMB_ANGLE_DEG / 2) * Math.PI / 180);
  const barPx = barMm * state.pxPerMm;
  document.getElementById("thumb-bar").style.width = barPx + "px";
  distanceSlider.value = state.distanceMm;
  document.getElementById("distance-value").textContent = fmtM(state.distanceMm) + " m";
  document.getElementById("thumb-caption").textContent =
    t("thumbCaption")(fmt((barMm / 10).toFixed(1)), fmtM(state.distanceMm));
}

function setThumbDistance(mm) {
  const min = Number(distanceSlider.min);
  const max = Number(distanceSlider.max);
  state.distanceMm = Math.min(max, Math.max(min, mm));
  renderThumbBar();
  renderDistanceNote();
}

function adjustThumbDistance(deltaMm) {
  setThumbDistance(state.distanceMm + deltaMm);
}

distanceSlider.addEventListener("input", () => {
  setThumbDistance(distanceSlider.valueAsNumber);
});

document.getElementById("thumb-smaller").addEventListener("click", () => adjustThumbDistance(-10));
document.getElementById("thumb-larger").addEventListener("click", () => adjustThumbDistance(10));

/* ============================================================
 * Étape 2b — Distance : tache aveugle / blind-spot measurement
 *
 * Œil droit fixant une croix à gauche : la tache aveugle est
 * ~13,5° en temporal (vers la droite). Un point dérive vers la
 * droite ; quand il disparaît, la séparation d donne la distance
 * D = d / tan(13,5°).  (cf. « virtual chinrest », Li et al. 2020)
 * ============================================================ */
const bs = {
  running: false,
  trial: 0,
  samples: [],   // séparations en px au moment du clic
  measureEye: "right",
  distances: { right: null, left: null },
  attempted: { right: false, left: false },
  animId: null,
  dotX: 0,
  crossX: 0,
  maxX: 0,
  minX: 0,
  direction: 1,
};

let suppressBsStartClickUntil = 0;

const bsZone = document.getElementById("bs-zone");
const bsGoneControls = document.getElementById("bs-gone-controls");
const bsDot = document.getElementById("bs-dot");
const bsCross = document.getElementById("bs-cross");
const bsEyeLeft = document.getElementById("bs-eye-left");
const bsEyeRight = document.getElementById("bs-eye-right");
const testEyeLeftSide = document.getElementById("test-eye-left-side");
const testEyeRightSide = document.getElementById("test-eye-right-side");

function showBlindSpotStep(eye) {
  state.currentEye = eye;
  state.measuredMm = state.measuredByEye[eye];
  bsStopAnim();
  bs.trial = 0;
  bs.samples = [];
  bs.measureEye = "right";
  bs.distances = { right: null, left: null };
  bs.attempted = { right: false, left: false };
  show("step-blindspot");
  showBlindSpotPreview();
  renderBlindSpotCopy();
  document.getElementById("bs-status").textContent = "";
  document.getElementById("bs-result").innerHTML = "";
  document.getElementById("btn-bs-start").innerHTML = t("dist.blindStart");
  document.getElementById("btn-start-eye-test").disabled = true;
  renderDistanceNote();
}

function showBlindSpotPreview() {
  bsStopAnim();
  bsZone.hidden = false;
  bsZone.classList.add("preview");
  bsGoneControls.hidden = true;
  positionBlindSpotPreviewCross();
}

function renderBlindSpotCopy() {
  const eye = bs.measureEye;
  const closedEye = eye === "right"
    ? (lang === "fr" ? "œil gauche" : "left eye")
    : (lang === "fr" ? "œil droit" : "right eye");
  const openEye = eye === "right"
    ? (lang === "fr" ? "œil droit" : "right eye")
    : (lang === "fr" ? "œil gauche" : "left eye");
  const fixSide = eye === "right"
    ? (lang === "fr" ? "gauche" : "left")
    : (lang === "fr" ? "droite" : "right");
  const direction = eye === "right"
    ? (lang === "fr" ? "la droite" : "right")
    : (lang === "fr" ? "la gauche" : "left");
  document.getElementById("blindspot-title").textContent = t("blindTitle")(eye, state.currentEye);
  document.getElementById("blindspot-eye-box").textContent = t("blindEyeBox")(openEye, closedEye);
  document.getElementById("blindspot-text").innerHTML = t("blindText")(closedEye, openEye, fixSide, direction);
  document.getElementById("bs-zone-instruction").textContent = t("blindZoneInstruction")(closedEye, openEye, fixSide);
  document.getElementById("btn-start-eye-test").textContent = t("startEyeTestLabel")(state.currentEye);
  renderBlindSpotEyeIcons();
  if (bsZone.classList.contains("preview")) {
    positionBlindSpotPreviewCross();
  } else {
    positionBlindSpotCross();
  }
  renderBlindSpotProgress();
}

function renderBlindSpotEyeIcons() {
  const leftOpen = bs.measureEye === "left";
  setBlindSpotEyeIcon(bsEyeLeft, leftOpen);
  setBlindSpotEyeIcon(bsEyeRight, !leftOpen);
}

function setBlindSpotEyeIcon(el, isOpen) {
  el.classList.toggle("open", isOpen);
  el.classList.toggle("closed", !isOpen);
  el.querySelector("span").textContent = isOpen ? t("eyeOpenShort") : t("eyeClosedShort");
}

function renderBlindSpotProgress(message = t("bsProgressText")) {
  const done = Math.min(bs.samples.length, BS_TRIALS);
  document.getElementById("bs-progress-count").textContent = `${done}/${BS_TRIALS}`;
  document.getElementById("bs-progress-text").textContent = message;
}

function positionBlindSpotCross() {
  const zoneWidth = bsZone.getBoundingClientRect().width;
  if (!zoneWidth) return null;
  const crossWidth = bsCross.offsetWidth;
  const crossLeft = bs.measureEye === "left" ? zoneWidth - 24 - crossWidth : 24;
  bsCross.style.left = crossLeft + "px";
  bsCross.style.right = "auto";
  return crossLeft + crossWidth / 2;
}

function positionBlindSpotPreviewCross() {
  bsCross.style.left = bs.measureEye === "left" ? "auto" : "24px";
  bsCross.style.right = bs.measureEye === "left" ? "24px" : "auto";
}

function positionBlindSpotStart() {
  const zoneRect = bsZone.getBoundingClientRect();
  if (!zoneRect.width) return false;
  bs.direction = bs.measureEye === "left" ? -1 : 1;
  bs.crossX = positionBlindSpotCross() ?? (bsCross.offsetLeft + bsCross.offsetWidth / 2);
  bs.maxX = zoneRect.width - 40;
  bs.minX = 40;
  bs.dotX = bs.crossX + bs.direction * Math.max(60, 0.04 * zoneRect.width);
  bsDot.style.left = bs.dotX + "px";
  return true;
}

function bsStart() {
  document.activeElement?.blur();
  suppressBsStartClickUntil = 0;
  bs.trial = 0;
  bs.samples = [];
  state.measuredMm = null;
  state.measuredByEye[state.currentEye] = null;
  document.getElementById("btn-start-eye-test").disabled = true;
  bsZone.hidden = false;
  bsZone.classList.remove("preview");
  bsGoneControls.hidden = false;
  document.getElementById("bs-result").innerHTML = "";
  renderBlindSpotProgress();
  bsNextTrial();
  bsZone.scrollIntoView({ behavior: "smooth", block: "center" });
}

function bsNextTrial() {
  bs.trial = bs.samples.length + 1;
  document.getElementById("bs-status").textContent = t("bsTrial")(bs.trial, BS_TRIALS);
  const zoneRect = bsZone.getBoundingClientRect();
  positionBlindSpotStart();
  bs.running = true;
  const SPEED = Math.max(60, zoneRect.width / 12); // px/s : traversée ~12 s
  let last = performance.now();
  function step(now) {
    if (!bs.running) return;
    bs.dotX += bs.direction * SPEED * (now - last) / 1000;
    last = now;
    if ((bs.direction > 0 && bs.dotX >= bs.maxX) || (bs.direction < 0 && bs.dotX <= bs.minX)) return bsEdgeReached();
    bsDot.style.left = bs.dotX + "px";
    bs.animId = requestAnimationFrame(step);
  }
  bs.animId = requestAnimationFrame(step);
}

function bsStopAnim() {
  bs.running = false;
  if (bs.animId) cancelAnimationFrame(bs.animId);
}

function bsGone() {
  if (!bs.running) return;
  bsStopAnim();
  bs.samples.push(Math.abs(bs.dotX - bs.crossX));
  renderBlindSpotProgress();
  bsAdvance();
}

function bsEdgeReached() {
  bsStopAnim();
  // distance max mesurable avec cet écran / max measurable distance on this screen
  const maxSeparation = bs.direction > 0 ? bs.maxX - bs.crossX : bs.crossX - bs.minX;
  const maxMm = maxSeparation / state.pxPerMm / Math.tan(BLINDSPOT_ANGLE_DEG * Math.PI / 180);
  document.getElementById("bs-result").innerHTML =
    `<span class="bs-warn">${t("bsEdge")(fmtM(maxMm))}</span>`;
  renderBlindSpotProgress();
  bsAdvance();
}

function bsAdvance() {
  if (bs.samples.length < BS_TRIALS) {
    setTimeout(bsNextTrial, 600);
  } else {
    setTimeout(bsFinish, 650);
  }
}

function bsFinish() {
  bsGoneControls.hidden = true;
  document.getElementById("bs-status").textContent = "";
  document.getElementById("btn-bs-start").innerHTML = t("dist.blindRestart");
  bs.attempted[bs.measureEye] = true;
  if (bs.samples.length === 0) {
    bs.distances[bs.measureEye] = null;
  } else {
    const sorted = [...bs.samples].sort((a, b) => a - b);
    const medianPx = sorted[Math.floor(sorted.length / 2)];
    bs.distances[bs.measureEye] = (medianPx / state.pxPerMm) / Math.tan(BLINDSPOT_ANGLE_DEG * Math.PI / 180);
  }

  if (bs.measureEye === "right") {
    bs.measureEye = "left";
    bs.trial = 0;
    bs.samples = [];
    document.getElementById("btn-bs-start").innerHTML = t("dist.blindStart");
    showBlindSpotPreview();
    renderBlindSpotCopy();
    renderBlindSpotProgress(t("bsSwitchEye"));
  } else {
    bsZone.hidden = true;
    bsZone.classList.remove("preview");
    const valid = [bs.distances.right, bs.distances.left].filter(v => v !== null);
    state.measuredMm = valid.length
      ? valid.reduce((sum, value) => sum + value, 0) / valid.length
      : null;
    state.measuredByEye[state.currentEye] = state.measuredMm;
    document.getElementById("btn-start-eye-test").disabled = state.measuredMm === null;
  }

  renderBsResult();
  renderDistanceNote();
}

function renderBsResult() {
  const el = document.getElementById("bs-result");
  const right = bs.distances.right;
  const left = bs.distances.left;
  if (bs.attempted.right && bs.attempted.left && state.measuredMm !== null) {
    el.innerHTML = t("bsBothResult")(
      right === null ? "—" : fmtM(right) + " m",
      left === null ? "—" : fmtM(left) + " m",
      fmtM(state.measuredMm)
    );
  } else if (bs.attempted.right && right !== null && !bs.attempted.left) {
    el.innerHTML = t("bsOneDone")("right", fmtM(right));
  } else if (bs.attempted.right && right === null && !bs.attempted.left) {
    el.innerHTML = `<span class="bs-warn">${t("bsOneInvalid")("right")}</span>`;
  } else if (state.measuredMm !== null) {
    const pct = Math.round(Math.abs(state.measuredMm - state.distanceMm) / state.distanceMm * 100);
    el.innerHTML = t("bsResult")(fmtM(state.measuredMm)) +
      t("bsCompare")(fmt(pct), fmtM(state.distanceMm));
  } else if (bs.attempted.right && bs.attempted.left) {
    el.innerHTML = `<span class="bs-warn">${t("bsNone")}</span>`;
  }
}

function renderDistanceNote() {
  const el = document.getElementById("test-distance-note");
  if (state.measuredMm !== null) {
    el.innerHTML = t("useMeasured")(fmtM(state.measuredMm));
  } else if (document.getElementById("step-blindspot").classList.contains("active")) {
    el.innerHTML = t("usePending")(fmtM(state.distanceMm));
  } else {
    el.innerHTML = t("useNominal")(fmtM(state.distanceMm));
  }
}

document.getElementById("btn-bs-start").addEventListener("click", e => {
  if (Date.now() < suppressBsStartClickUntil) {
    e.preventDefault();
    suppressBsStartClickUntil = 0;
    e.currentTarget.blur();
    return;
  }
  bsStart();
});
document.getElementById("btn-bs-gone").addEventListener("click", bsGone);
document.getElementById("btn-start-eye-test").addEventListener("click", () => {
  if (state.measuredByEye[state.currentEye] === null) {
    document.getElementById("bs-result").innerHTML = `<span class="bs-warn">${t("bsRequired")}</span>`;
    return;
  }
  startEyeTest(state.currentEye);
});

document.getElementById("btn-distanced").addEventListener("click", () => {
  bsStopAnim();
  bsZone.hidden = true;
  bsZone.classList.remove("preview");
  bsGoneControls.hidden = true;
  show("step-mode");
});

document.querySelectorAll(".mode-choice").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-choice").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.testMode = btn.dataset.mode;
  });
});

document.getElementById("btn-mode-next").addEventListener("click", () => show("step-eye"));

const letterGrid = document.getElementById("letter-grid");
letterGrid.innerHTML = LETTERS
  .map(letter => `<button class="btn letter-choice" data-letter="${letter}">${letter}</button>`)
  .join("");

/* ============================================================
 * Étapes 3–4 — Test
 * ============================================================ */
function optotypeHeightPx(denominator) {
  // À 6/6, l'optotype sous-tend 5 minutes d'arc à la distance de test.
  const heightMm = 2 * testDistanceMm() * Math.tan(ARCMIN_5 / 2) * (denominator / 6);
  return heightMm * state.pxPerMm;
}

function startEyeTest(eye) {
  state.currentEye = eye;
  state.lineIndex = 0;
  state.lastPassedIndex = -1;
  renderTestMode();
  renderTestEyeIcons();
  startLine();
  show("step-test");
  renderTestHeader();
}

function renderTestHeader() {
  document.getElementById("test-eye-label").textContent =
    state.currentEye === "right" ? t("eyeRightLabel") : t("eyeLeftLabel");
  document.getElementById("test-line-label").textContent =
    t("lineLabel")(LINES[state.lineIndex], state.trial + 1, TRIALS_PER_LINE);
  renderTestEyeIcons();
}

function renderTestEyeIcons() {
  if (!state.currentEye) return;
  const leftOpen = state.currentEye === "left";
  setBlindSpotEyeIcon(testEyeLeftSide, leftOpen);
  setBlindSpotEyeIcon(testEyeRightSide, !leftOpen);
}

function renderTestMode() {
  const isLetters = state.testMode === "letters";
  const eOptotype = document.getElementById("optotype");
  const letterOptotype = document.getElementById("letter-optotype");
  const ePad = document.getElementById("answer-pad-e");
  const letterPad = document.getElementById("answer-pad-letters");
  eOptotype.toggleAttribute("hidden", isLetters);
  letterOptotype.toggleAttribute("hidden", !isLetters);
  ePad.toggleAttribute("hidden", isLetters);
  letterPad.toggleAttribute("hidden", !isLetters);
  eOptotype.style.display = isLetters ? "none" : "block";
  letterOptotype.style.display = isLetters ? "flex" : "none";
}

function startLine() {
  state.trial = 0;
  state.correctCount = 0;
  nextTrial();
}

function nextTrial() {
  const denom = LINES[state.lineIndex];
  const px = optotypeHeightPx(denom);

  if (state.testMode === "letters") {
    let letter;
    do { letter = LETTERS[Math.floor(Math.random() * LETTERS.length)]; } while (letter === state.currentLetter);
    state.currentLetter = letter;
    const letterEl = document.getElementById("letter-optotype");
    letterEl.textContent = letter;
    letterEl.style.fontSize = px + "px";
    letterEl.style.width = px * 1.15 + "px";
    letterEl.style.height = px * 1.15 + "px";
  } else {
    let dir;
    do { dir = DIRS[Math.floor(Math.random() * DIRS.length)]; } while (dir === state.currentDir);
    state.currentDir = dir;
    const svg = document.getElementById("optotype");
    svg.style.width = px + "px";
    svg.style.height = px + "px";
    document.getElementById("optotype-g")
      .setAttribute("transform", `rotate(${ROTATION[dir]} 2.5 2.5)`);
  }

  renderTestHeader();
}

function answer(value) {
  const expected = state.testMode === "letters" ? state.currentLetter : state.currentDir;
  if (value === expected) state.correctCount++;
  state.trial++;

  const remaining = TRIALS_PER_LINE - state.trial;
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
    document.getElementById("switch-result").textContent = t("rightEyeResult")(
      r.denominator !== null
        ? t("approx")(r.denominator, feetNotation(r.denominator))
        : t("worse")
    );
    show("step-switch");
  } else {
    showResults();
  }
}

document.querySelectorAll(".btn.arrow").forEach(btn =>
  btn.addEventListener("click", () => answer(btn.dataset.dir))
);
document.querySelectorAll(".letter-choice").forEach(btn =>
  btn.addEventListener("click", () => answer(btn.dataset.letter))
);
document.getElementById("btn-cant-see").addEventListener("click", failLine);
document.getElementById("btn-cant-read").addEventListener("click", failLine);

document.addEventListener("keydown", e => {
  if (e.code === "Space" && bs.running) {
    e.preventDefault();
    if (document.activeElement?.id === "btn-bs-start") {
      suppressBsStartClickUntil = Date.now() + 300;
    }
    return bsGone();
  }
  if (document.getElementById("step-calibrate").classList.contains("active")) {
    const cardKeys = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
    };
    if (cardKeys[e.key]) {
      e.preventDefault();
      adjustCardWidth(cardKeys[e.key]);
    }
    return;
  }
  if (document.getElementById("step-distance").classList.contains("active")) {
    const distanceKeys = {
      ArrowLeft: -10,
      ArrowDown: -10,
      ArrowRight: 10,
      ArrowUp: 10,
    };
    if (distanceKeys[e.key]) {
      e.preventDefault();
      adjustThumbDistance(distanceKeys[e.key]);
    }
    return;
  }
  if (!document.getElementById("step-test").classList.contains("active")) return;
  if (state.testMode === "letters") {
    const letter = e.key.toUpperCase();
    if (LETTERS.includes(letter)) {
      e.preventDefault();
      answer(letter);
    }
    return;
  }
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (map[e.key]) {
    e.preventDefault();
    answer(map[e.key]);
  }
});

document.addEventListener("keyup", e => {
  if (e.code === "Space" && Date.now() < suppressBsStartClickUntil) {
    e.preventDefault();
  }
}, true);

/* ============================================================
 * Étape 5 — Résultats / Results
 * ============================================================ */
function feetNotation(denom) {
  return `20/${FEET_EQUIV[denom] ?? Math.round(denom * 20 / 6)}`;
}

function resultRow(label, res) {
  if (res.denominator === null) {
    return `<tr><td>${label}</td><td colspan="4">${t("rowWorse")}</td></tr>`;
  }
  const d = res.denominator;
  const decimal = fmt((6 / d).toFixed(2));
  const logmar = fmt(Math.log10(d / 6).toFixed(2));
  return `<tr><td>${label}</td><td>6/${fmt(d)}</td><td>${feetNotation(d)}</td><td>${decimal}</td><td>${logmar}</td></tr>`;
}

function showResults() {
  document.getElementById("results-distance").textContent =
    t("resultsDistance")(fmtM(testDistanceMm("right")), fmtM(testDistanceMm("left")));
  const tbody = document.querySelector("#results-table tbody");
  tbody.innerHTML =
    resultRow(t("rightEye"), state.results.right) +
    resultRow(t("leftEye"), state.results.left);

  const denoms = [state.results.right.denominator, state.results.left.denominator];
  const comment = document.getElementById("results-comment");
  if (denoms.every(d => d !== null && d <= 6)) {
    comment.textContent = t("commentGood");
  } else if (denoms.some(d => d === null || d > 12)) {
    comment.textContent = t("commentBad");
  } else {
    comment.textContent = t("commentMid");
  }
  show("step-results");
}

/* ============================================================
 * Navigation générale / General navigation
 * ============================================================ */
document.getElementById("btn-start").addEventListener("click", () => {
  initCalibration();
  show("step-calibrate");
});
document.getElementById("btn-eye-right").addEventListener("click", () => showBlindSpotStep("right"));
document.getElementById("btn-eye-left").addEventListener("click", () => showBlindSpotStep("left"));
document.getElementById("btn-restart").addEventListener("click", () => {
  state.results = {};
  state.measuredMm = null;
  state.measuredByEye = { right: null, left: null };
  show("step-intro");
});

applyI18n();
