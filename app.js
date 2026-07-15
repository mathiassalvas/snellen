"use strict";

/* ============================================================
 * Constantes physiques / Physical constants
 * ============================================================ */
const CARD_WIDTH_MM = 85.6;    // carte ISO/IEC 7810 ID-1 / ISO card width
const CARD_RATIO = 53.98 / 85.6;
/*
 * Thumb visual-angle estimate based on:
 * O'Shea, R. P. (1991).
 * Thumb's rule tested: Visual angle of thumb's width is about 2 deg.
 * Perception, 20, 415–418.
 *
 * Mean thumb-width visual angle at arm's length:
 * approximately 2.12° for the preferred hand.
 *
 * Refined estimate:
 * angleDeg ≈ 0.07 × thumbWidthMm + 0.74
 */
const DEFAULT_THUMB_ANGLE_DEG = 2.12; // moyenne O'Shea (1991) pour la main dominante / O'Shea (1991) mean, dominant hand
const BLINDSPOT_ANGLE_DEG = 13.5; // bord proche de la tache aveugle / near edge of blind spot
const ARCMIN_5 = (5 / 60) * Math.PI / 180; // 5 minutes d'arc en radians

// O'Shea (1991): estimated thumb visual angle in degrees
// angle ≈ 0.07 × thumb width in mm + 0.74
function estimateThumbAngleDeg(thumbWidthMm) {
  if (!Number.isFinite(thumbWidthMm) || thumbWidthMm <= 0) {
    return DEFAULT_THUMB_ANGLE_DEG;
  }
  return 0.07 * thumbWidthMm + 0.74;
}

// Lignes du test : dénominateurs Snellen en base 6 m (6/60 ... 6/2.4).
// Les petites lignes utilisent les conversions exactes des fractions en pieds :
// 20/15 -> 6/4.5, 20/13 -> 6/3.9, 20/10 -> 6/3, 20/8 -> 6/2.4.
const LINES = [60, 36, 24, 18, 12, 9, 7.5, 6, 4.5, 3.9, 3, 2.4];
const TRIALS_PER_LINE = 5;
const PASS_THRESHOLD = 3; // >= 3 bonnes réponses sur 5 pour passer la ligne

// Équivalents 20 pieds usuels / usual 20-ft equivalents
const FEET_EQUIV = { 60: 200, 36: 120, 24: 80, 18: 60, 15: 50, 12: 40, 9: 30, 7.5: 25, 6: 20, 4.5: 15, 3.9: 13, 3: 10, 2.4: 8 };

// Lignes du mode "tableau Snellen" : 20/50, 20/40, 20/30, 20/25, 20/20, 20/15,
// 20/13, 20/10, 20/8 — converties en dénominateurs base 6 m (feet × 6/20) pour
// réutiliser telle quelle toute la géométrie existante (optotypeHeightPx, etc.).
const CHART_LINES = [15, 12, 9, 7.5, 6, 4.5, 3.9, 3, 2.4];

const BS_TRIALS = 5; // essais par œil ; on retire le min et le max, puis on moyenne le reste
const BS_MISMATCH_PCT = 30; // écart pouce/tache-aveugle au-delà duquel on avertit l'utilisateur
const LETTERS = ["C", "D", "H", "K", "N", "O", "R", "S", "V", "Z"];
const LETTER_OPTOTYPE_FONT = '"Optician Sans", Arial, Helvetica, sans-serif';
const LETTER_METRIC_FONT_SIZE = 200;

/* ============================================================
 * Internationalisation FR / EN
 * ============================================================ */
const I18N = {
  fr: {
    "intro.title": "👁️ Test Snellen - Mathias",
    "intro.lead": "Estimez votre acuité visuelle depuis chez vous, en trois étapes :",
    "intro.step1": "<strong>Calibration</strong> — mesurez votre écran avec une carte de crédit",
    "intro.step2": "<strong>Test</strong> — tableau Snellen, « E » directionnels ou lettres Sloan, un œil ou les deux",
    "intro.step3": "<strong>Distance</strong> — vérifiée avec votre pouce <em>et</em> votre tache aveugle",
    "intro.warning": "⚠️ <strong>Ce test n'est pas un examen médical.</strong> Il donne seulement une estimation approximative de votre acuité visuelle. Il ne remplace en aucun cas une consultation chez un optométriste ou un ophtalmologiste. Consultez un professionnel pour tout problème de vision.",
    "intro.need": "Il vous faut : une carte de crédit (ou toute carte au format standard), assez d'espace pour vous éloigner de l'écran (idéalement au moins environ 1 m), et quelque chose pour couvrir un œil.",
    "intro.start": "Commencer",

    "cal.title": "Étape 1 — Calibration de l'écran",
    "cal.instructions": "Placez une carte de crédit, ou toute carte de taille standard, <strong>contre l'écran</strong>, sur le rectangle ci-dessous. Elle sert seulement d'objet de référence pour calibrer l'écran. Le format standard <a href=\"https://en.wikipedia.org/wiki/ISO/IEC_7810\" target=\"_blank\" rel=\"noopener noreferrer\">ISO/IEC 7810 ID-1</a> mesure <strong>85,60 mm × 53,98 mm</strong>. Ajustez le curseur jusqu'à ce que le rectangle ait <strong>exactement la même taille</strong> que votre carte.",
    "cal.smaller": "− plus petit",
    "cal.larger": "+ plus grand",
    "cal.tip": "Astuce : alignez le coin inférieur gauche de la carte avec celui du rectangle, puis ajustez jusqu'à ce que les bords droit et supérieur coïncident. Les flèches gauche/droite du clavier rapetissent ou agrandissent aussi le rectangle.",
    "cal.done": "Le rectangle correspond à ma carte ✓",
    zoomChangedWarning: "⚠️ Le zoom du navigateur a changé depuis la calibration. Remettez le zoom à 100 % ou recalibrez l'écran avant de lire les lettres.",

    "dist.title": "Étape 3 — Distance de vision",
    "dist.choose": "Placez-vous le plus loin possible de l'écran, tout en pouvant utiliser votre clavier ou votre souris sans avancer.",
    "dist.thumbTitle": "Méthode 1 — le pouce",
    "dist.step1Title": "1. Positionnez votre pouce",
    "dist.step1Text": "Fermez un œil, tendez complètement le bras et levez le pouce devant l'écran.",
    "dist.step2Title": "2. Ajustez la barre",
    "dist.step2Text": "Ajustez la barre pour qu'elle corresponde à la largeur de votre pouce. Utilisez le curseur, les boutons ou les flèches du clavier.",
    "dist.adjustBarLabel": "Ajustez la barre à la largeur de votre pouce",
    "dist.sliderLabel": "Distance estimée",
    "dist.thumbSmaller": "Plus petit",
    "dist.thumbLarger": "Plus grand",
    "dist.measureThumbTitle": "📏 Mesurer la largeur de mon pouce — Facultatif",
    "dist.measureThumbToggle": "Mesurer",
    "dist.measureThumbInstructions": "Posez la première articulation de votre <strong>pouce dominant</strong> contre l'écran et ajustez la barre pour qu'elle corresponde exactement à sa largeur.",
    "dist.measureThumbConfirm": "Confirmer cette mesure",
    "dist.blindStart": "Démarrer la mesure",
    "dist.blindRestart": "Refaire la mesure",
    "dist.blindGone": "Il a disparu ! (ou Espace)",
    "dist.ok": "Confirmer cette distance ✓",
    "dist.headAlignTitle": "Placez votre tête au centre de l'écran",
    "dist.headAlignText": "Avant de démarrer, alignez votre visage avec le milieu de l'écran. Une fois la mesure commencée, gardez la tête immobile et bougez seulement vos yeux, pas votre tête.",
    "dist.blindStay": "Vous devez faire la mesure de la tache aveugle avant de pouvoir commencer le test de cet œil.",
    "dist.startEyeTest": "Commencer le test de cet œil",

    "mode.title": "Étape 2 — Type de test",
    "mode.text": "Choisissez le type de test, puis si vous testez un œil à la fois, les deux ensemble, ou le test complet.",
    "mode.typeLabel": "Type de test",
    "mode.chartTitle": "Tableau Snellen",
    "mode.chartText": "Tableau complet affiché en une fois, à une distance que vous mesurez vous-même (idéalement ≥ 150 cm). Vous (ou un proche) lisez la plus petite ligne possible.",
    "mode.eTitle": "E directionnel",
    "mode.eText": "Recommandé — le E tourne; vous indiquez la direction de ses branches.",
    "mode.lettersTitle": "Lettres Sloan",
    "mode.lettersText": "Une lettre Sloan apparaît avec une police optotype; vous choisissez ou tapez la lettre vue.",
    "mode.eyesLabel": "Mode d'évaluation",
    "mode.monoTitle": "Un œil à la fois",
    "mode.monoText": "Un résultat séparé par œil — plus précis, deux fois plus long.",
    "mode.biTitle": "Deux yeux ensemble",
    "mode.biText": "Un seul résultat rapide, pour vérifier que la vision est ≥ 20/40.",
    "mode.completeTitle": "Test complet",
    "mode.completeText": "Recommandé — trois résultats : œil droit, œil gauche, puis les deux yeux ensemble.",
    "mode.next": "Continuer",

    "eye.title": "Étape — Préparation du test",
    "eye.p1Mono": "Le test se fait <strong>un œil à la fois</strong>. Couvrez l'autre œil avec la paume de la main (sans appuyer) ou un cache. Gardez vos lunettes ou lentilles si vous en portez habituellement — le test mesurera votre vision corrigée.",
    "eye.p1Bi": "Le test se fait avec <strong>les deux yeux ouverts</strong> en même temps, sans rien couvrir. Gardez vos lunettes ou lentilles si vous en portez habituellement — le test mesurera votre vision corrigée.",
    "eye.p1Complete": "Le test complet se fait en trois passes : <strong>œil droit</strong>, <strong>œil gauche</strong>, puis <strong>les deux yeux ensemble</strong>. Gardez vos lunettes ou lentilles si vous en portez habituellement.",
    "eye.p2Interactive": "Les caractères affichés deviendront progressivement plus petits. Répondez avec le clavier, les boutons à l'écran ou la commande vocale, si elle est activée. En cas d'incertitude, donnez votre meilleure réponse.",
    "eye.p2Chart": "Un tableau complet va s'afficher, du plus grand au plus petit. Lisez-le de haut en bas et indiquez la plus petite ligne que vous pouvez encore lire confortablement.",
    "eye.displayConditions": "<strong>Avant de commencer :</strong> mettez la luminosité de l'écran au maximum, désactivez Night Shift / filtre de lumière bleue / mode sombre si possible, et placez-vous dans une pièce bien éclairée sans reflet sur l'écran.",
    "eye.startRight": "Commencer — œil droit<br><small>(couvrez l'œil gauche)</small>",
    "eye.startBoth": "Commencer le test",

    "test.question": "Vers où pointent les branches du E ?",
    "test.headAlignReminder": "Gardez votre tête alignée avec le centre de l'écran et immobile pendant tout le test.",
    precisionCapNote: (fraction) => `ℹ️ Écran ou distance limités : à partir de ${fraction}, les lettres peuvent être moins nettes. Le test continue, mais le résultat final en tiendra compte.`,
    "test.cantSee": "Je ne vois qu'une tache ✗",
    "test.letterQuestion": "Quelle lettre voyez-vous ?",
    "test.cantRead": "Je ne peux pas lire la lettre ✗",

    "switch.title": "Premier œil terminé ✓",
    "switch.textBlindspot": "Maintenant, couvrez l'<strong>œil droit</strong>. On va refaire la mesure de la tache aveugle avant de tester l'<strong>œil gauche</strong>, au cas où votre position aurait un peu changé.",
    "switch.textChart": "Maintenant, couvrez l'<strong>œil droit</strong> et lisez à nouveau le tableau avec l'<strong>œil gauche</strong>, à la même distance.",
    "switch.textBoth": "Dernière passe : ouvrez <strong>les deux yeux</strong>. Gardez la même distance et continuez sans couvrir un œil.",
    "switch.btn": "Tester l'œil gauche",
    "switch.btnBoth": "Tester les deux yeux",

    "results.title": "Résultats",
    "results.thSnellenM": "Snellen (m)",
    "results.thSnellenFt": "Snellen (pi)",
    "results.thDecimal": "Décimale",
    "results.thLogmar": "LogMAR ajusté",
    "results.warning": "⚠️ Rappel : ceci est une <strong>estimation à titre indicatif seulement</strong>, sensible à la calibration, à la distance réelle, à l'éclairage et à la qualité de l'écran. Seul un examen par un professionnel de la vue est fiable. En cas de doute ou de changement dans votre vision, consultez.",
    "results.restart": "Refaire le test",
    "results.precisionTitle": "Limite de rendu de l'écran",

    "footer.text": "Test 100 % local — aucune donnée n'est envoyée nulle part. Optotypes : E de Snellen et lettres Sloan.",

    "manual.title": "Étape — Distance mesurée",
    "manual.text": "Avec un ruban ou un mètre, mesurez la distance réelle entre vos yeux et l'écran, puis entrez-la ci-dessous. Au moins 150 cm est recommandé pour une bonne précision — plus c'est loin, mieux c'est.",
    "manual.inputLabel": "Distance mesurée",
    "manual.next": "Continuer",

    "chart.question": "Quelle est la plus petite ligne que vous pouvez lire confortablement (au moins 3 lettres sur 5) ?",
    "chart.none": "Aucune ligne n'est lisible ✗",
    "chart.instructions": "Lisez le tableau ci-dessous de haut en bas, puis indiquez la plus petite ligne que vous pouvez encore lire.",

    // Chaînes dynamiques
    manualWarningShort: (cm) => `⚠️ ${cm} cm, c'est assez proche — le résultat sera moins précis. Si possible, reculez-vous.`,
    chartEyeBoth: "Deux yeux ouverts",
    chartEyeMono: (eye) => `Œil ${eye === "right" ? "droit" : "gauche"} ouvert (${eye === "right" ? "gauche" : "droit"} fermé)`,
    eyeRightLabel: "Test : œil droit (gauche fermé)",
    eyeLeftLabel: "Test : œil gauche (droit fermé)",
    bothEyesOpenLabel: "Deux yeux ouverts",
    blindTitle: (measureEye, testEye) => `Tache aveugle — mesure avec l'${measureEye === "right" ? "œil droit" : "œil gauche"} (${testEye === "both" ? "test des deux yeux" : testEye === "right" ? "test de l'œil droit" : "test de l'œil gauche"})`,
    blindEyeBox: (openEye, closedEye) => `Ouvrez l'${openEye}. Fermez l'${closedEye}.`,
    blindText: (closedEye, openEye, fixSide, direction) => `<p>On mesure la distance avec les deux yeux pour être plus précis.</p><ol class="bs-steps"><li>Fermez l'<strong>${closedEye}</strong> et gardez l'<strong>${openEye} ouvert</strong>.</li><li>Fixez la croix <strong>+</strong> située à ${fixSide} avec l'œil ouvert, <em>sans bouger les yeux</em>.</li><li>Cliquez ou appuyez sur <strong>Espace</strong> à l'instant où le point disparaît (il se déplace vers ${direction}).</li></ol><p class="hint">On répète ${BS_TRIALS} fois.</p>`,
    blindZoneInstruction: (closedEye, openEye, fixSide) => `Fermez l'${closedEye}. Fixez la croix à ${fixSide} avec l'${openEye}.`,
    eyeOpenShort: "ouvert",
    eyeClosedShort: "fermé",
    bsProgressText: "mesures faites",
    bsSwitchEye: "Changez d'œil, puis démarrez la prochaine mesure.",
    startEyeTestLabel: (eye) => eye === "both" ? "Commencer le test (deux yeux)" : `Commencer le test de l'${eye === "right" ? "œil droit" : "œil gauche"}`,
    lineLabel: (d, i, n) => `Ligne 6/${fmt(d)} — optotype ${i}/${n}`,
    thumbWidthCaption: (mm) => `Largeur ajustée : ${mm} mm.`,
    thumbWidthConfirmed: (mm, deg) => `✓ Pouce mesuré à ${mm} mm (angle visuel estimé : ${deg}°). Cette valeur est utilisée pour affiner la barre ci-dessus.`,
    bsTrial: (i, n) => `Mesure ${i}/${n} — fixez la croix, Espace ou clic dès que le point disparaît.`,
    bsEdge: (m) => `⚠️ Essai manqué (max mesurable ici : ~${m} m) — on reprend.`,
    bsTooFar: "⚠️ Point rendu trop loin selon l'estimation au pouce — on reprend.",
    bsResult: (m) => `Distance mesurée par la tache aveugle : environ <strong>${m} m</strong>.`,
    bsOneDone: (eye, m) => `Mesure avec l'${eye === "right" ? "œil droit" : "œil gauche"} : environ <strong>${m} m</strong>. Mesurez maintenant l'autre œil.`,
    bsOneInvalid: (eye) => `Mesure avec l'${eye === "right" ? "œil droit" : "œil gauche"} non valide. Mesurez maintenant l'autre œil.`,
    bsBothResult: (r, l, avg) => `Distance mesurée — œil droit : ${r}; œil gauche : ${l}. Moyenne utilisée : <strong>${avg} m</strong>.`,
    bsCompare: (pct, target) => ` Écart de ${pct} % par rapport à l'estimation au pouce de ${target} m.`,
    bsMismatchWarning: (pct) => `⚠️ Écart important (${pct} %) entre l'estimation au pouce et la tache aveugle. Vérifiez que vous fixez bien la croix sans bouger les yeux, ou refaites la mesure.`,
    bsNone: "Aucune mesure valide — refaites la mesure de la tache aveugle pour commencer le test.",
    bsRequired: "Faites d'abord la mesure de la tache aveugle pour confirmer la distance.",
    useMeasured: (m) => `✓ Le test utilisera la distance mesurée : ${m} m.`,
    usePending: (m) => `Distance estimée au pouce : ${m} m.`,
    useNominal: (m) => `Le test utilisera la distance nominale : ${m} m (tache aveugle non mesurée).`,
    rightEyeResult: (txt) => `Œil droit : ${txt}.`,
    approx: (d, ft) => `environ 6/${fmt(d)} (${ft})`,
    worse: "moins que 6/60 dans ces conditions de test",
    rowWorse: "Moins que 6/60 — impossible d'estimer avec ce test",
    rightEye: "Œil droit",
    leftEye: "Œil gauche",
    bothEyes: "Deux yeux",
    resultsDistance: (r, l) => `Distance utilisée — œil droit : ${r} m; œil gauche : ${l} m.`,
    resultsDistanceBoth: (m) => `Distance utilisée : ${m} m.`,
    resultsDistanceComplete: (r, l, b) => `Distance utilisée — œil droit : ${r} m; œil gauche : ${l} m; deux yeux : ${b} m.`,
    resultsPrecisionWarning: (items) => `ℹ️ Pour ${items}, certaines lettres étaient près de la limite de pixels de votre écran à cette distance. Un échec aux plus petites lignes peut donc être expliqué en partie par l'affichage, pas seulement par la vision.`,
    commentGood: "Les deux yeux atteignent 6/6 (20/20) ou mieux dans ce test — c'est la vision dite « normale ».",
    commentBad: "Au moins un œil est nettement en dessous de 6/12 dans ce test. C'est une bonne raison de prendre rendez-vous chez un professionnel de la vue.",
    commentMid: "Résultat proche de la normale mais pas parfait. Si vous remarquez une gêne au quotidien, un examen professionnel vaut la peine.",

    "cam.title": "📷 Suivi caméra — Facultatif",
    "cam.text": "La caméra vérifie votre distance et l’alignement de votre tête pendant le test. L’analyse se fait sur votre appareil et aucune image n’est envoyée à un serveur.",
    "cam.enable": "Activer la caméra",
    "cam.disable": "Désactiver la caméra",
    "cam.requesting": "Demande d'accès à la caméra…",
    "cam.loadingModel": "Chargement du modèle de détection de visage…",
    "cam.tracking": "✓ Suivi actif — restez dans cette position.",
    "cam.denied": "Accès caméra refusé. Vous pouvez continuer sans ce suivi.",
    "cam.error": "Le suivi caméra n'a pas pu démarrer (modèle indisponible ou navigateur non compatible). Vous pouvez continuer sans lui.",
    "cam.noFace": "📷 Visage non détecté",
    "cam.headAngled": "🧭 Angle horiz.",
    "cam.tooFar": "📷 Trop loin",
    "cam.tooClose": "📷 Trop proche",
    "cam.eyesUnknown": "👁️ Suivez la consigne d'œil",
    "cam.rejectedTrial": "⚠️ Vous vous êtes trop rapproché ou éloigné — reprenez votre position et réessayez.",

    "mic.title": "🎤 Réponse vocale — Facultatif · Bêta",
    "mic.text": "Répondez à voix haute sans utiliser le clavier. Pour le E directionnel, dites « haut », « bas », « gauche » ou « droite ». Pour les lettres Sloan, nommez simplement la lettre affichée.",
    "mic.textNote": "La reconnaissance vocale est gérée par votre navigateur et peut utiliser ses serveurs.",
    "mic.enable": "Activer le micro",
    "mic.disable": "Désactiver le micro",
    "mic.listening": "✓ Micro actif — répondez à voix haute pendant le test.",
    "mic.denied": "Accès micro refusé. Vous pouvez continuer sans la réponse vocale.",
    "mic.unsupported": "La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome ou Edge). Vous pouvez continuer sans elle.",
    "mic.error": "La reconnaissance vocale n'a pas pu démarrer. Vous pouvez continuer sans elle.",
    "mic.tryItLabel": "Essayez : dites un des mots ci-dessus →",
    micIdle: "🎤 À l'écoute…",
    micHeard: (word) => `🎤 « ${word} »`,
    micExpectedDirections: "Le micro comprend : « haut », « bas », « gauche », « droite » pendant le test, et « oui » pour confirmer la disparition du point pendant la mesure de distance.",
    micExpectedLetters: (letters) => `Le micro comprend : les lettres ${letters} pendant le test, et « oui » pour confirmer la disparition du point pendant la mesure de distance.`,
    camLiveDistance: (m) => `📷 ≈ ${m} m`,
    camLiveAngle: (deg) => `🧭 horiz. ${deg}°`,
    camEyeInstruction: (openSide, closedSide) => `👁️ ${openSide === "left" ? "G" : "D"} ouvert / ${closedSide === "left" ? "G" : "D"} fermé`,
    camBothEyesInstruction: "👁️ 2 yeux ouverts",
  },

  en: {
    "intro.title": "👁️ Test Snellen - Mathias",
    "intro.lead": "Estimate your visual acuity from home, in three steps:",
    "intro.step1": "<strong>Calibration</strong> — measure your screen with a credit card",
    "intro.step2": "<strong>Test</strong> — Snellen chart, tumbling “E”, or Sloan letters, one eye or both",
    "intro.step3": "<strong>Distance</strong> — checked with your thumb <em>and</em> your blind spot",
    "intro.warning": "⚠️ <strong>This is not a medical exam.</strong> It only gives a rough estimate of your visual acuity and is no substitute for a visit to an optometrist or ophthalmologist. See a professional for any vision concern.",
    "intro.need": "You will need: a credit card (or any standard-size card), enough room to move back from the screen (ideally at least about 1 m / 3 ft), and something to cover one eye.",
    "intro.start": "Start",

    "cal.title": "Step 1 — Screen calibration",
    "cal.instructions": "Hold a credit card, or any standard-size card, <strong>against the screen</strong>, over the rectangle below. It is only a known-size reference for screen calibration. The standard <a href=\"https://en.wikipedia.org/wiki/ISO/IEC_7810\" target=\"_blank\" rel=\"noopener noreferrer\">ISO/IEC 7810 ID-1</a> size is <strong>85.60 mm × 53.98 mm</strong>. Adjust the slider until the rectangle is <strong>exactly the same size</strong> as your card.",
    "cal.smaller": "− smaller",
    "cal.larger": "+ larger",
    "cal.tip": "Tip: line up the bottom-left corner of the card with the rectangle's, then adjust until the right and top edges match. The keyboard left/right arrows also shrink or enlarge the rectangle.",
    "cal.done": "The rectangle matches my card ✓",
    zoomChangedWarning: "⚠️ Browser zoom changed after calibration. Reset zoom to 100% or recalibrate the screen before reading the letters.",

    "dist.title": "Step 3 — Viewing distance",
    "dist.choose": "Move as far from the screen as possible while still being able to use your keyboard or mouse without leaning forward.",
    "dist.thumbTitle": "Method 1 — your thumb",
    "dist.step1Title": "1. Position your thumb",
    "dist.step1Text": "Close one eye, fully extend your arm, and raise your thumb in front of the screen.",
    "dist.step2Title": "2. Adjust the bar",
    "dist.step2Text": "Adjust the bar to match the width of your thumb. Use the slider, the buttons, or the keyboard arrows.",
    "dist.adjustBarLabel": "Adjust the bar to your thumb's width",
    "dist.sliderLabel": "Estimated distance",
    "dist.thumbSmaller": "Smaller",
    "dist.thumbLarger": "Larger",
    "dist.measureThumbTitle": "📏 Measure my thumb width — Optional",
    "dist.measureThumbToggle": "Measure",
    "dist.measureThumbInstructions": "Place the first knuckle of your <strong>dominant thumb</strong> against the screen and adjust the bar until it exactly matches its width.",
    "dist.measureThumbConfirm": "Confirm this measurement",
    "dist.blindStart": "Start measuring",
    "dist.blindRestart": "Measure again",
    "dist.blindGone": "It vanished! (or Space)",
    "dist.ok": "Confirm this distance ✓",
    "dist.headAlignTitle": "Center your head with the screen",
    "dist.headAlignText": "Before starting, align your face with the middle of the screen. Once measuring starts, keep your head still and move only your eyes, not your head.",
    "dist.blindStay": "You must complete the blind-spot measurement before starting this eye's test.",
    "dist.startEyeTest": "Start this eye's test",

    "mode.title": "Step 2 — Test type",
    "mode.text": "Choose the test type, then whether you're testing one eye at a time, both together, or the complete test.",
    "mode.typeLabel": "Test type",
    "mode.chartTitle": "Snellen chart",
    "mode.chartText": "Full chart shown at once, at a distance you measure yourself (ideally ≥ 150 cm). You (or a helper) read the smallest line possible.",
    "mode.eTitle": "Tumbling E",
    "mode.eText": "Recommended — the E rotates; you report which way its prongs point.",
    "mode.lettersTitle": "Sloan letters",
    "mode.lettersText": "A Sloan letter appears in an optotype font; choose or type the letter you see.",
    "mode.eyesLabel": "Assessment mode",
    "mode.monoTitle": "One eye at a time",
    "mode.monoText": "A separate result per eye — more precise, takes twice as long.",
    "mode.biTitle": "Both eyes together",
    "mode.biText": "One quick result, to check vision is ≥ 20/40.",
    "mode.completeTitle": "Complete test",
    "mode.completeText": "Recommended — three results: right eye, left eye, then both eyes together.",
    "mode.next": "Continue",

    "eye.title": "Step — Getting ready",
    "eye.p1Mono": "The test is done <strong>one eye at a time</strong>. Cover the other eye with your palm (without pressing) or an occluder. Keep your glasses or contacts if you normally wear them — the test will measure your corrected vision.",
    "eye.p1Bi": "The test is done with <strong>both eyes open</strong> at the same time, nothing covered. Keep your glasses or contacts if you normally wear them — the test will measure your corrected vision.",
    "eye.p1Complete": "The complete test has three passes: <strong>right eye</strong>, <strong>left eye</strong>, then <strong>both eyes together</strong>. Keep your glasses or contacts if you normally wear them.",
    "eye.p2Interactive": "The displayed characters will get progressively smaller. Answer with the keyboard, the on-screen buttons, or voice input if enabled. If you're unsure, give your best guess.",
    "eye.p2Chart": "A full chart will appear, from biggest to smallest. Read it top to bottom and report the smallest line you can still read comfortably.",
    "eye.displayConditions": "<strong>Before starting:</strong> set screen brightness to maximum, turn off Night Shift / blue-light filters / dark mode if possible, and use a well-lit room with no glare on the screen.",
    "eye.startRight": "Start — right eye<br><small>(cover your left eye)</small>",
    "eye.startBoth": "Start the test",

    "test.question": "Which way do the prongs of the E point?",
    "test.headAlignReminder": "Keep your head aligned with the center of the screen and still throughout the test.",
    precisionCapNote: (fraction) => `ℹ️ Screen or distance limited: from ${fraction} onward, letters may be less sharp. The test continues, but the final result will note it.`,
    "test.cantSee": "I only see a blur ✗",
    "test.letterQuestion": "Which letter do you see?",
    "test.cantRead": "I can't read the letter ✗",

    "switch.title": "First eye done ✓",
    "switch.textBlindspot": "Now cover your <strong>right eye</strong>. We will measure the blind spot again before testing the <strong>left eye</strong>, in case your position changed a little.",
    "switch.textChart": "Now cover your <strong>right eye</strong> and read the chart again with your <strong>left eye</strong>, at the same distance.",
    "switch.textBoth": "Final pass: open <strong>both eyes</strong>. Keep the same distance and continue without covering either eye.",
    "switch.btn": "Test the left eye",
    "switch.btnBoth": "Test both eyes",

    "results.title": "Results",
    "results.thSnellenM": "Snellen (m)",
    "results.thSnellenFt": "Snellen (ft)",
    "results.thDecimal": "Decimal",
    "results.thLogmar": "Adjusted LogMAR",
    "results.warning": "⚠️ Reminder: this is an <strong>estimate for information only</strong>, sensitive to calibration, actual distance, lighting and screen quality. Only an exam by an eye-care professional is reliable. If in doubt, or if your vision changes, get checked.",
    "results.restart": "Take the test again",
    "results.precisionTitle": "Screen rendering limit",

    "footer.text": "Runs 100% locally — no data is sent anywhere. Optotypes: Snellen E and Sloan letters.",

    "manual.title": "Step — Measured distance",
    "manual.text": "Using a tape measure, measure the real distance between your eyes and the screen, then enter it below. At least 150 cm is recommended for good accuracy — farther is better.",
    "manual.inputLabel": "Measured distance",
    "manual.next": "Continue",

    "chart.question": "What's the smallest line you can read comfortably (at least 3 of 5 letters)?",
    "chart.none": "No line is readable ✗",
    "chart.instructions": "Read the chart below top to bottom, then report the smallest line you can still read.",

    // Dynamic strings
    manualWarningShort: (cm) => `⚠️ ${cm} cm is quite close — the result will be less precise. If possible, move farther back.`,
    chartEyeBoth: "Both eyes open",
    chartEyeMono: (eye) => `${eye === "right" ? "Right" : "Left"} eye open (${eye === "right" ? "left" : "right"} closed)`,
    eyeRightLabel: "Test: right eye (left closed)",
    eyeLeftLabel: "Test: left eye (right closed)",
    bothEyesOpenLabel: "Both eyes open",
    blindTitle: (measureEye, testEye) => `Blind spot — measuring with the ${measureEye === "right" ? "right eye" : "left eye"} (${testEye === "both" ? "both-eyes test" : testEye === "right" ? "right-eye test" : "left-eye test"})`,
    blindEyeBox: (openEye, closedEye) => `Open your ${openEye}. Close your ${closedEye}.`,
    blindText: (closedEye, openEye, fixSide, direction) => `<p>We measure distance with both eyes for better precision.</p><ol class="bs-steps"><li>Close your <strong>${closedEye}</strong> and keep your <strong>${openEye} open</strong>.</li><li>Stare at the <strong>+</strong> cross on the ${fixSide} with the open eye, <em>without moving your eyes</em>.</li><li>Click or press <strong>Space</strong> the instant the dot disappears (it moves ${direction}).</li></ol><p class="hint">We repeat ${BS_TRIALS} times.</p>`,
    blindZoneInstruction: (closedEye, openEye, fixSide) => `Close your ${closedEye}. Stare at the cross on the ${fixSide} with your ${openEye}.`,
    eyeOpenShort: "open",
    eyeClosedShort: "closed",
    bsProgressText: "measurements done",
    bsSwitchEye: "Switch eyes, then start the next measurement.",
    startEyeTestLabel: (eye) => eye === "both" ? "Start the test (both eyes)" : `Start the ${eye === "right" ? "right-eye" : "left-eye"} test`,
    lineLabel: (d, i, n) => `Line 6/${fmt(d)} — optotype ${i}/${n}`,
    thumbWidthCaption: (mm) => `Adjusted width: ${mm} mm.`,
    thumbWidthConfirmed: (mm, deg) => `✓ Thumb measured at ${mm} mm (estimated visual angle: ${deg}°). This value is now used to refine the bar above.`,
    bsTrial: (i, n) => `Measure ${i}/${n} — stare at the cross, press Space or click as soon as the dot disappears.`,
    bsEdge: (m) => `⚠️ Missed that trial (max measurable here: ~${m} m) — trying again.`,
    bsTooFar: "⚠️ The dot went too far based on the thumb estimate — trying again.",
    bsResult: (m) => `Distance measured via the blind spot: about <strong>${m} m</strong>.`,
    bsOneDone: (eye, m) => `Measurement with the ${eye === "right" ? "right eye" : "left eye"}: about <strong>${m} m</strong>. Now measure the other eye.`,
    bsOneInvalid: (eye) => `Measurement with the ${eye === "right" ? "right eye" : "left eye"} was not valid. Now measure the other eye.`,
    bsBothResult: (r, l, avg) => `Measured distance — right eye: ${r}; left eye: ${l}. Average used: <strong>${avg} m</strong>.`,
    bsCompare: (pct, target) => ` That is ${pct}% away from the ${target} m thumb estimate.`,
    bsMismatchWarning: (pct) => `⚠️ Large gap (${pct}%) between the thumb estimate and the blind-spot measurement. Make sure you're staring at the cross without moving your eyes, or measure again.`,
    bsNone: "No valid measurement — repeat the blind-spot measurement to start the test.",
    bsRequired: "Complete the blind-spot measurement first to confirm the distance.",
    useMeasured: (m) => `✓ The test will use the measured distance: ${m} m.`,
    usePending: (m) => `Thumb-estimated distance: ${m} m.`,
    useNominal: (m) => `The test will use the nominal distance: ${m} m (blind spot not measured).`,
    rightEyeResult: (txt) => `Right eye: ${txt}.`,
    approx: (d, ft) => `about 6/${fmt(d)} (${ft})`,
    worse: "worse than 6/60 under these test conditions",
    rowWorse: "Worse than 6/60 — cannot be estimated with this test",
    rightEye: "Right eye",
    leftEye: "Left eye",
    bothEyes: "Both eyes",
    resultsDistance: (r, l) => `Distance used — right eye: ${r} m; left eye: ${l} m.`,
    resultsDistanceBoth: (m) => `Distance used: ${m} m.`,
    resultsDistanceComplete: (r, l, b) => `Distance used — right eye: ${r} m; left eye: ${l} m; both eyes: ${b} m.`,
    resultsPrecisionWarning: (items) => `ℹ️ For ${items}, some letters were close to your screen's pixel limit at this distance. Failing the smallest lines may therefore be partly explained by display rendering, not only by vision.`,
    commentGood: "Both eyes reach 6/6 (20/20) or better on this test — that is so-called “normal” vision.",
    commentBad: "At least one eye is clearly below 6/12 on this test. That is a good reason to book an appointment with an eye-care professional.",
    commentMid: "Close to normal but not perfect. If you notice discomfort day to day, a professional exam is worth it.",

    "cam.title": "📷 Camera tracking — Optional",
    "cam.text": "The camera checks your distance from the screen and the alignment of your head during the test. The analysis runs on your device and no image is sent to a server.",
    "cam.enable": "Enable camera",
    "cam.disable": "Disable camera",
    "cam.requesting": "Requesting camera access…",
    "cam.loadingModel": "Loading face-detection model…",
    "cam.tracking": "✓ Tracking active — stay in this position.",
    "cam.denied": "Camera access denied. You can continue without this tracking.",
    "cam.error": "Camera tracking could not start (model unavailable or unsupported browser). You can continue without it.",
    "cam.noFace": "📷 Face not detected",
    "cam.headAngled": "🧭 Horiz. angle",
    "cam.tooFar": "📷 Too far",
    "cam.tooClose": "📷 Too close",
    "cam.eyesUnknown": "👁️ Follow the eye instruction",
    "cam.rejectedTrial": "⚠️ You moved too close or too far — get back into position and try again.",

    "mic.title": "🎤 Voice answers — Optional · Beta",
    "mic.text": "Answer out loud without using the keyboard. For the tumbling E, say \"up\", \"down\", \"left\" or \"right\". For Sloan letters, simply say the letter shown.",
    "mic.textNote": "Speech recognition is handled by your browser and may use its servers.",
    "mic.enable": "Enable microphone",
    "mic.disable": "Disable microphone",
    "mic.listening": "✓ Microphone active — answer out loud during the test.",
    "mic.denied": "Microphone access denied. You can continue without voice answers.",
    "mic.unsupported": "Speech recognition is not available in this browser (try Chrome or Edge). You can continue without it.",
    "mic.error": "Speech recognition could not start. You can continue without it.",
    "mic.tryItLabel": "Try it: say one of the words above →",
    micIdle: "🎤 Listening…",
    micHeard: (word) => `🎤 "${word}"`,
    micExpectedDirections: "The microphone understands: \"up\", \"down\", \"left\", \"right\" during the test, and \"yes\" to confirm the dot disappeared during distance measurement.",
    micExpectedLetters: (letters) => `The microphone understands: the letters ${letters} during the test, and "yes" to confirm the dot disappeared during distance measurement.`,
    camLiveDistance: (m) => `📷 ≈ ${m} m`,
    camLiveAngle: (deg) => `🧭 horiz. ${deg}°`,
    camEyeInstruction: (openSide, closedSide) => `👁️ ${openSide === "left" ? "L" : "R"} open / ${closedSide === "left" ? "L" : "R"} closed`,
    camBothEyesInstruction: "👁️ Both open",
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
  renderThumbWidthResult();
  if (document.getElementById("step-blindspot").classList.contains("active") && state.currentEye) {
    renderBlindSpotCopy();
  }
  if (document.getElementById("step-test").classList.contains("active") && state.currentEye) {
    renderTestHeader();
    renderPrecisionNote(document.getElementById("test-precision-note"), state.precisionLimitedAt, d => `6/${fmt(d)}`);
  }
  if (document.getElementById("step-eye").classList.contains("active")) {
    renderEyeStep();
  }
  if (document.getElementById("step-switch").classList.contains("active") && state.pendingEye) {
    goToSwitchStep(state.pendingEye);
  }
  if (document.getElementById("step-chart").classList.contains("active") && state.currentEye) {
    showChartStep(state.currentEye);
  }
  renderManualDistanceWarning();
  renderDistanceNote();
  renderBsResult();
  document.getElementById("btn-cam-enable").textContent = cam.enabled ? t("cam.disable") : t("cam.enable");
  renderCamStatus();
  document.getElementById("btn-mic-enable").textContent = mic.enabled ? t("mic.disable") : t("mic.enable");
  renderMicStatus();
  renderMicBadge();
}

document.querySelectorAll("#lang-toggle .btn").forEach(btn =>
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    localStorage.setItem("snellen.lang", lang);
    applyI18n();
    // la reconnaissance vocale doit écouter dans la nouvelle langue
    restartMicForLanguage();
  })
);

/* ============================================================
 * État global / Global state
 * ============================================================ */
const state = {
  pxPerMm: null,        // issu de la calibration / from calibration
  calibrationDpr: null, // zoom/densité au moment de la calibration
  thumbWidthMm: parseFloat(localStorage.getItem("snellen.thumbWidthMm")) || null, // largeur du pouce mesurée (facultatif) / measured thumb width (optional)
  distanceMm: 1500,     // distance nominale choisie / chosen nominal distance
  measuredMm: null,     // distance mesurée par la tache aveugle / blind-spot measurement
  measuredByEye: { right: null, left: null, both: null },
  manualDistanceMm: null, // distance entrée directement (mode chart) / directly entered distance (chart mode)
  testMode: "tumblingE", // "chart" | "tumblingE" | "letters"
  eyeMode: "monocular",  // "monocular" | "binocular" | "complete"
  currentEye: null,     // "right" | "left" | "both"
  pendingEye: null,
  results: {},
  usableLines: LINES,   // lignes présentées pour la passe en cours
  precisionLimitedAt: null, // première ligne où le rendu écran peut devenir limite
  lineIndex: 0,
  trial: 0,
  correctCount: 0,
  currentDir: null,
  currentLetter: null,
  lastPassedIndex: -1,
  failedAt: null,
  lineScores: [],
};

// distance réellement utilisée pour dimensionner les optotypes
function testDistanceMm(eye = state.currentEye) {
  return (eye && state.measuredByEye[eye]) ?? state.distanceMm;
}

function currentZoomSignature() {
  return (window.devicePixelRatio || 1) * (window.visualViewport?.scale || 1);
}

function zoomChangedSinceCalibration() {
  return state.calibrationDpr !== null
    && Math.abs(currentZoomSignature() - state.calibrationDpr) > 0.01;
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

function precisionSensitiveStepActive() {
  return ["step-test", "step-chart"].some(id => document.getElementById(id).classList.contains("active"));
}

function refreshVisiblePrecisionNote() {
  if (document.getElementById("step-test").classList.contains("active") && state.currentEye) {
    renderPrecisionNote(document.getElementById("test-precision-note"), state.precisionLimitedAt, d => `6/${fmt(d)}`);
  }
  if (document.getElementById("step-chart").classList.contains("active") && state.currentEye) {
    renderPrecisionNote(document.getElementById("chart-precision-note"), state.precisionLimitedAt, feetNotation);
  }
}

function blockPageZoomEvents() {
  document.addEventListener("wheel", e => {
    if (precisionSensitiveStepActive() && (e.ctrlKey || e.metaKey)) e.preventDefault();
  }, { passive: false });
  document.addEventListener("keydown", e => {
    if (!precisionSensitiveStepActive() || !(e.ctrlKey || e.metaKey)) return;
    if (["+", "-", "=", "_", "0"].includes(e.key)) e.preventDefault();
  }, true);
  ["gesturestart", "gesturechange"].forEach(type => {
    document.addEventListener(type, e => {
      if (precisionSensitiveStepActive()) e.preventDefault();
    }, { passive: false });
  });
  window.addEventListener("resize", refreshVisiblePrecisionNote);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", refreshVisiblePrecisionNote);
  }
}

blockPageZoomEvents();

/* ============================================================
 * Étape 1 — Calibration
 * ============================================================ */
const cardEl = document.getElementById("credit-card");
const slider = document.getElementById("card-slider");
const distanceSlider = document.getElementById("distance-slider");

function renderCard(widthPx) {
  const markSizePx = Math.round(Math.min(120, Math.max(34, widthPx * 0.075)));
  const markLinePx = Math.round(Math.min(6, Math.max(2, markSizePx / 18)));
  const markGapPx = markLinePx / 2;
  cardEl.style.width = widthPx + "px";
  cardEl.style.height = widthPx * CARD_RATIO + "px";
  cardEl.style.fontSize = widthPx / 20 + "px";
  cardEl.style.setProperty("--mark-size", markSizePx + "px");
  cardEl.style.setProperty("--mark-line", markLinePx + "px");
  cardEl.style.setProperty("--mark-gap", markGapPx + "px");
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
  state.calibrationDpr = currentZoomSignature();
  localStorage.setItem("snellen.pxPerMm", state.pxPerMm);
  renderThumbBar();
  renderDistanceNote();
  show("step-mode");
});

/* ============================================================
 * Étape 2a — Distance : méthode du pouce / thumb method
 * ============================================================ */
function renderThumbBar() {
  const angleDeg = estimateThumbAngleDeg(state.thumbWidthMm);
  const barMm = 2 * state.distanceMm * Math.tan((angleDeg / 2) * Math.PI / 180);
  const barPx = barMm * state.pxPerMm;
  document.getElementById("thumb-bar").style.width = barPx + "px";
  distanceSlider.value = state.distanceMm;
  document.getElementById("distance-value").textContent = fmtM(state.distanceMm) + " m";
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

/* ------------------------------------------------------------
 * Mesure facultative de la largeur du pouce / optional thumb-width measurement
 * ------------------------------------------------------------ */
const thumbWidthSlider = document.getElementById("thumb-width-slider");
const thumbWidthBar = document.getElementById("thumb-width-bar");
const thumbWidthCaption = document.getElementById("thumb-width-caption");
const thumbMeasureToggle = document.getElementById("thumb-measure-toggle");
const thumbMeasurePanel = document.getElementById("thumb-measure-panel");
const thumbWidthResult = document.getElementById("thumb-width-result");
const thumbWidthConfirm = document.getElementById("thumb-width-confirm");
const thumbVwidthLeft = document.getElementById("thumb-vwidth-left");
const thumbVwidthRight = document.getElementById("thumb-vwidth-right");
const thumbVwidthBarLeft = document.getElementById("thumb-vwidth-bar-left");
const thumbVwidthBarRight = document.getElementById("thumb-vwidth-bar-right");

function renderThumbWidthBar() {
  const mm = thumbWidthSlider.valueAsNumber;
  const sizePx = (mm * state.pxPerMm) + "px";
  thumbWidthBar.style.width = sizePx;
  thumbVwidthBarLeft.style.height = sizePx;
  thumbVwidthBarRight.style.height = sizePx;
  thumbWidthCaption.textContent = t("thumbWidthCaption")(fmt(mm.toFixed(1)));
}

function renderThumbWidthResult() {
  if (state.thumbWidthMm === null) {
    thumbWidthResult.hidden = true;
    return;
  }
  const angleDeg = estimateThumbAngleDeg(state.thumbWidthMm);
  thumbWidthResult.hidden = false;
  thumbWidthResult.textContent =
    t("thumbWidthConfirmed")(fmt(state.thumbWidthMm.toFixed(1)), fmt(angleDeg.toFixed(2)));
}

thumbWidthSlider.addEventListener("input", renderThumbWidthBar);

function setThumbMeasureExpanded(expanded) {
  thumbMeasurePanel.hidden = !expanded;
  thumbMeasureToggle.setAttribute("aria-expanded", String(expanded));
  thumbVwidthLeft.hidden = !expanded;
  thumbVwidthRight.hidden = !expanded;
  if (expanded) {
    thumbWidthSlider.value = state.thumbWidthMm ?? 20;
    renderThumbWidthBar();
    document.getElementById("thumb-measure-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function toggleThumbMeasure() {
  setThumbMeasureExpanded(thumbMeasurePanel.hidden);
}

thumbMeasureToggle.addEventListener("click", toggleThumbMeasure);
document.querySelector("#thumb-measure-card h3").addEventListener("click", toggleThumbMeasure);

thumbWidthConfirm.addEventListener("click", () => {
  state.thumbWidthMm = thumbWidthSlider.valueAsNumber;
  localStorage.setItem("snellen.thumbWidthMm", state.thumbWidthMm);
  renderThumbBar();
  renderThumbWidthResult();
  setThumbMeasureExpanded(false);
});

renderThumbWidthResult();

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
  plausibleMaxOffsetPx: null,
  direction: 1,
  speed: 0,       // px/s courant (pour reconstituer une position passée)
  trialStartedAt: 0, // horodatage du début de l'essai en cours, pour borner la correction
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
  renderMicBadge();
}

function showBlindSpotPreview() {
  bsStopAnim();
  bsZone.hidden = false;
  bsZone.classList.add("preview");
  bsGoneControls.hidden = true;
  document.body.classList.remove("bs-dimmed");
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

// Fenêtre plausible autour de la distance attendue selon l'estimation au
// pouce : on commence à 60 % pour éviter un long trajet inutile, et on reprend
// l'essai à 140 % si la personne a probablement oublié de cliquer.
const BS_THUMB_START_FACTOR = 0.6;
const BS_THUMB_RETRY_FACTOR = 1.4;

function positionBlindSpotStart() {
  const zoneRect = bsZone.getBoundingClientRect();
  if (!zoneRect.width) return false;
  bs.direction = bs.measureEye === "left" ? -1 : 1;
  bs.crossX = positionBlindSpotCross() ?? (bsCross.offsetLeft + bsCross.offsetWidth / 2);
  bs.maxX = zoneRect.width - 40;
  bs.minX = 40;
  const nearStart = Math.max(60, 0.04 * zoneRect.width);
  const available = bs.direction > 0 ? (bs.maxX - bs.crossX) : (bs.crossX - bs.minX);
  const expectedBlindSpotOffset = state.pxPerMm
    ? state.distanceMm * Math.tan(BLINDSPOT_ANGLE_DEG * Math.PI / 180) * state.pxPerMm
    : 0;
  const thumbStart = expectedBlindSpotOffset * BS_THUMB_START_FACTOR;
  const thumbRetryOffset = expectedBlindSpotOffset * BS_THUMB_RETRY_FACTOR;
  bs.plausibleMaxOffsetPx = thumbRetryOffset > 0 && thumbRetryOffset < available
    ? thumbRetryOffset
    : null;
  const startOffset = Math.min(Math.max(nearStart, thumbStart), available * 0.8);
  bs.dotX = bs.crossX + bs.direction * startOffset;
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
  document.body.classList.add("bs-dimmed");
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
  bs.speed = SPEED;
  bs.trialStartedAt = performance.now();
  let last = performance.now();
  function step(now) {
    if (!bs.running) return;
    bs.dotX += bs.direction * SPEED * (now - last) / 1000;
    last = now;
    const offset = Math.abs(bs.dotX - bs.crossX);
    if (bs.plausibleMaxOffsetPx !== null && offset >= bs.plausibleMaxOffsetPx) return bsTooFarReached();
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

// atTime : instant réel où le point a disparu du point de vue de la personne
// (par défaut maintenant, pour le clic/Espace qui réagissent sans délai).
// La réponse vocale, elle, n'est confirmée par le navigateur qu'après un
// délai de traitement — on reconstitue donc la position du point à l'instant
// où la personne a commencé à parler plutôt qu'à l'instant où la
// reconnaissance a fini de traiter cette réponse, sans quoi la mesure serait
// systématiquement biaisée vers une tache aveugle trop grande.
function bsGone(atTime = performance.now()) {
  if (!bs.running) return;
  const clampedAtTime = Math.min(performance.now(), Math.max(bs.trialStartedAt, atTime));
  const dotXAtTime = bs.dotX - bs.direction * bs.speed * (performance.now() - clampedAtTime) / 1000;
  bsStopAnim();
  bs.samples.push(Math.abs(dotXAtTime - bs.crossX));
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

function bsTooFarReached() {
  bsStopAnim();
  document.getElementById("bs-result").innerHTML =
    `<span class="bs-warn">${t("bsTooFar")}</span>`;
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

// Retire l'essai le plus court et le plus long, puis moyenne les autres —
// plus robuste qu'une simple médiane contre un clignement ou un clic tardif.
function trimmedMeanPx(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const trimmed = sorted.length >= 5 ? sorted.slice(1, -1) : sorted;
  return trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length;
}

function bsFinish() {
  bsGoneControls.hidden = true;
  document.getElementById("bs-status").textContent = "";
  document.getElementById("btn-bs-start").innerHTML = t("dist.blindRestart");
  bs.attempted[bs.measureEye] = true;
  if (bs.samples.length === 0) {
    bs.distances[bs.measureEye] = null;
  } else {
    const trimmedPx = trimmedMeanPx(bs.samples);
    bs.distances[bs.measureEye] = (trimmedPx / state.pxPerMm) / Math.tan(BLINDSPOT_ANGLE_DEG * Math.PI / 180);
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
    document.body.classList.remove("bs-dimmed");
    const valid = [bs.distances.right, bs.distances.left].filter(v => v !== null);
    state.measuredMm = valid.length
      ? valid.reduce((sum, value) => sum + value, 0) / valid.length
      : null;
    state.measuredByEye[state.currentEye] = state.measuredMm;
    document.getElementById("btn-start-eye-test").disabled = state.measuredMm === null;
    if (state.measuredMm !== null) calibrateCameraAnchor(state.measuredMm);
  }

  renderBsResult();
  renderDistanceNote();
}

function renderBsResult() {
  const el = document.getElementById("bs-result");
  const right = bs.distances.right;
  const left = bs.distances.left;
  if (bs.attempted.right && bs.attempted.left && state.measuredMm !== null) {
    let html = t("bsBothResult")(
      right === null ? "—" : fmtM(right) + " m",
      left === null ? "—" : fmtM(left) + " m",
      fmtM(state.measuredMm)
    );
    const pct = Math.round(Math.abs(state.measuredMm - state.distanceMm) / state.distanceMm * 100);
    html += pct >= BS_MISMATCH_PCT
      ? `<br><span class="bs-warn">${t("bsMismatchWarning")(fmt(pct))}</span>`
      : t("bsCompare")(fmt(pct), fmtM(state.distanceMm));
    el.innerHTML = html;
  } else if (bs.attempted.right && right !== null && !bs.attempted.left) {
    el.innerHTML = t("bsOneDone")("right", fmtM(right));
  } else if (bs.attempted.right && right === null && !bs.attempted.left) {
    el.innerHTML = `<span class="bs-warn">${t("bsOneInvalid")("right")}</span>`;
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
document.getElementById("btn-bs-gone").addEventListener("click", () => bsGone());
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
  document.body.classList.remove("bs-dimmed");
  renderEyeStep();
  show("step-eye");
});

/* ============================================================
 * Étape 3 — Type de test (chart / E / lettres) × yeux (1 ou 2)
 * ============================================================ */
document.querySelectorAll("#mode-type-choices .mode-choice").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#mode-type-choices .mode-choice").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.testMode = btn.dataset.testmode;
  });
});

document.querySelectorAll("#mode-eyes-choices .mode-choice").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#mode-eyes-choices .mode-choice").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.eyeMode = btn.dataset.eyemode;
  });
});

document.getElementById("btn-mode-next").addEventListener("click", () => {
  show(state.testMode === "chart" ? "step-manual-distance" : "step-distance");
});

/* ============================================================
 * Étape 3b — Distance mesurée manuellement (mode chart)
 * ============================================================ */
const RECOMMENDED_MANUAL_DISTANCE_MM = 1500;
const manualDistanceInput = document.getElementById("manual-distance-input");

function renderManualDistanceWarning() {
  const cm = manualDistanceInput.valueAsNumber;
  const el = document.getElementById("manual-distance-warning");
  el.textContent = (cm && cm > 0 && cm * 10 < RECOMMENDED_MANUAL_DISTANCE_MM)
    ? t("manualWarningShort")(cm)
    : "";
}
manualDistanceInput.addEventListener("input", renderManualDistanceWarning);

document.getElementById("btn-manual-distance-next").addEventListener("click", () => {
  const cm = manualDistanceInput.valueAsNumber;
  if (!cm || cm <= 0) return;
  const mm = cm * 10;
  state.manualDistanceMm = mm;
  state.measuredByEye.right = mm;
  state.measuredByEye.left = mm;
  state.measuredByEye.both = mm;
  renderEyeStep();
  show("step-eye");
});

/* ============================================================
 * Étape 4 — Préparation (texte dynamique selon le mode choisi)
 * ============================================================ */
function renderEyeStep() {
  const isChart = state.testMode === "chart";
  const isBinocular = state.eyeMode === "binocular";
  const isComplete = state.eyeMode === "complete";
  document.getElementById("eye-title").textContent = t("eye.title");
  document.getElementById("eye-p1").innerHTML = isComplete ? t("eye.p1Complete") : isBinocular ? t("eye.p1Bi") : t("eye.p1Mono");
  document.getElementById("eye-p2").innerHTML = isChart ? t("eye.p2Chart") : t("eye.p2Interactive");
  document.getElementById("btn-first-pass").innerHTML = isBinocular ? t("eye.startBoth") : t("eye.startRight");
  document.getElementById("camera-card").hidden = isChart;
  // La réponse vocale ne sert que pour les optotypes interactifs (directions
  // du E, noms de lettres) — pas pour la lecture auto-déclarée du tableau.
  document.getElementById("mic-card").hidden = isChart;
  renderMicExpectedWords();
}

function initCollapsible(toggleId, bodyId) {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  const header = toggle.closest(".collapsible-header");
  const setExpanded = (expanded) => {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "▲" : "▼";
    body.hidden = !expanded;
  };
  const toggleExpanded = () => setExpanded(toggle.getAttribute("aria-expanded") !== "true");
  toggle.addEventListener("click", toggleExpanded);
  header.querySelector("h3").addEventListener("click", toggleExpanded);
}

initCollapsible("camera-toggle", "camera-body");
initCollapsible("mic-toggle", "mic-body");

function firstEyeForMode() {
  return state.eyeMode === "binocular" ? "both" : "right";
}

function nextEyeAfter(eye) {
  if (state.eyeMode === "complete") {
    if (eye === "right") return "left";
    if (eye === "left") return "both";
    return null;
  }
  if (state.eyeMode === "monocular" && eye === "right") return "left";
  return null;
}

function prepareBothEyesDistance() {
  if (state.measuredByEye.both !== null) return;
  const valid = [state.measuredByEye.right, state.measuredByEye.left].filter(v => v !== null);
  state.measuredByEye.both = valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : state.distanceMm;
}

function startPassForEye(eyeKey) {
  if (state.testMode === "chart") {
    if (eyeKey === "both") prepareBothEyesDistance();
    showChartStep(eyeKey);
  } else {
    showBlindSpotStep(eyeKey);
  }
}

function startFirstPass() {
  startPassForEye(firstEyeForMode());
}
document.getElementById("btn-first-pass").addEventListener("click", startFirstPass);

function startSecondPass() {
  if (!state.pendingEye) return;
  const eye = state.pendingEye;
  state.pendingEye = null;
  startPassForEye(eye);
}
document.getElementById("btn-second-pass").addEventListener("click", startSecondPass);

const letterGrid = document.getElementById("letter-grid");
letterGrid.innerHTML = LETTERS
  .map(letter => `<button class="btn letter-choice" data-letter="${letter}">${letter}</button>`)
  .join("");

/* ============================================================
 * Suivi caméra (optionnel) — webcam face-mesh tracking
 *
 * Principe : MediaPipe Face Landmarker détecte le visage dans le flux
 * webcam et donne la position des deux iris. On mesure leur séparation
 * en pixels (l'écart interpupillaire, IPD). Comme on connaît déjà une
 * distance de référence fiable (la mesure de tache aveugle qui vient
 * d'être faite), on calibre la caméra sur CETTE distance plutôt que de
 * supposer un IPD moyen de 63 mm à l'aveugle : ipdPx0 à distanceMm0
 * connue donne ensuite, à tout instant, distance = distanceMm0 * ipdPx0 / ipdPx.
 * Si aucune calibration n'est encore disponible, on retombe sur l'IPD
 * moyen adulte (63 mm) et un champ de vision webcam typique, pour une
 * estimation grossière mais toujours utile en aperçu.
 * Tout le traitement vidéo reste local au navigateur ; seuls le modèle
 * et le runtime WASM sont chargés depuis un CDN externe.
 * ============================================================ */
const CAMERA_IPD_MM = 63;
const CAMERA_TOLERANCE_PCT = 15; // au-delà, l'essai en cours est rejeté
const CAMERA_FADE_PCT = CAMERA_TOLERANCE_PCT * 2; // écart à partir duquel le badge atteint son opacité/couleur la plus "froide"
const CAMERA_MIN_OPACITY = 0.4; // ne descend jamais en dessous : le texte doit rester lisible
const EYE_OPEN_WARN_THRESHOLD = 0.35; // score de clignement MediaPipe en-dessous duquel l'œil "fermé" semble en fait ouvert
const EYE_CLOSED_WARN_THRESHOLD = 0.65; // au-dessus de ce score, l'œil qui devrait rester ouvert semble fermé
// Un visage tourné (lacet) rapproche optiquement les deux iris par un effet de
// raccourci en cosinus : à 15°, l'IPD projeté rétrécit d'environ cos(15°)≈0.97,
// soit ~3-4 %. On ignore l'angle vertical, car la caméra peut être plus haute
// ou plus basse que le centre de l'écran sans que la tête soit mal alignée.
const HEAD_YAW_WARN_DEG = 15;
const FACE_LANDMARKER_VERSION = "0.10.14";
const FACE_LANDMARKER_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${FACE_LANDMARKER_VERSION}/wasm`;
const FACE_LANDMARKER_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const RIGHT_IRIS_INDEX = 468;
const LEFT_IRIS_INDEX = 473;
const EYE_GEOM_CLOSED_RATIO = 0.11;
const EYE_GEOM_OPEN_RATIO = 0.22;
const EYE_GEOM_POINTS = {
  left: { outer: 362, inner: 263, upperA: 385, lowerA: 380, upperB: 386, lowerB: 374 },
  right: { outer: 33, inner: 133, upperA: 160, lowerA: 144, upperB: 159, lowerB: 145 },
};

const cam = {
  enabled: false,
  status: "idle", // idle | requesting | loading | tracking | denied | error
  video: null,
  landmarker: null,
  rafId: null,
  ipdPx: null,
  anchorIpdPx: null,
  anchorDistanceMm: null,
  blinkLeft: null,  // score de clignement de l'œil gauche du sujet (0 = grand ouvert, 1 = fermé)
  blinkRight: null,
  geomBlinkLeft: null,
  geomBlinkRight: null,
  yawDeg: null,     // rotation gauche/droite de la tête (lacet)
  flagged: false,
};

// Les scores de clignement MediaPipe sont nommés selon le côté de l'image dans
// plusieurs flux webcam, alors que nos consignes parlent du côté anatomique de
// la personne. Avec l'aperçu miroir, l'accès doit donc être inversé ici.
const BLINK_SCORE_KEY_FOR_USER_EYE = {
  left: "right",
  right: "left",
};

// Extrait seulement le lacet horizontal (yaw) de la matrice de transformation
// faciale 4×4 de MediaPipe (colonne-majeure, comme en WebGL/three.js) :
// l'élément (ligne r, colonne c) est à data[c*4 + r].
function computeHeadYawDeg(matrix) {
  return Math.atan2(matrix[8], matrix[10]) * 180 / Math.PI;
}

function isHeadAngled() {
  return cam.yawDeg !== null && Math.abs(cam.yawDeg) > HEAD_YAW_WARN_DEG;
}

function landmarkDistancePx(a, b) {
  if (!a || !b || !cam.video) return null;
  const dx = (a.x - b.x) * cam.video.videoWidth;
  const dy = (a.y - b.y) * cam.video.videoHeight;
  return Math.hypot(dx, dy);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function geometricBlinkScore(lm, side) {
  const p = EYE_GEOM_POINTS[side];
  if (!lm || !p) return null;
  const width = landmarkDistancePx(lm[p.outer], lm[p.inner]);
  const gapA = landmarkDistancePx(lm[p.upperA], lm[p.lowerA]);
  const gapB = landmarkDistancePx(lm[p.upperB], lm[p.lowerB]);
  if (!width || gapA === null || gapB === null) return null;
  const openRatio = ((gapA + gapB) / 2) / width;
  return clamp01((EYE_GEOM_OPEN_RATIO - openRatio) / (EYE_GEOM_OPEN_RATIO - EYE_GEOM_CLOSED_RATIO));
}

// Formate une distance en mètres avec toujours exactement 2 décimales (jamais
// "0,8" un coup et "0,77" le suivant) : sans ça, la largeur du texte varie à
// chaque mise à jour et le badge — donc toute la ligne d'en-tête — semble
// trembler pendant le suivi en direct.
function fmtCamM(mm) {
  const meters = (Math.round(mm / 10) / 100).toFixed(2);
  return lang === "fr" ? meters.replace(".", ",") : meters;
}

// Quel œil est censé être ouvert en ce moment, selon l'étape active.
function expectedOpenEye() {
  if (document.getElementById("step-test").classList.contains("active")) {
    // "both" = les deux yeux doivent être ouverts, donc aucun œil "fermé" à vérifier
    return state.currentEye === "both" ? null : state.currentEye;
  }
  if (document.getElementById("step-blindspot").classList.contains("active")) return bs.measureEye;
  return null;
}

async function toggleCamera() {
  if (cam.enabled) {
    disableCamera();
    return;
  }
  cam.status = "requesting";
  renderCamStatus();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
  } catch {
    cam.status = "denied";
    renderCamStatus();
    return;
  }

  cam.video = document.getElementById("cam-video");
  cam.video.srcObject = stream;
  cam.video.hidden = false;
  try {
    await cam.video.play();
    cam.status = "loading";
    renderCamStatus();

    const vision = await import(/* webpackIgnore: true */ `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${FACE_LANDMARKER_VERSION}`);
    const filesetResolver = await vision.FilesetResolver.forVisionTasks(FACE_LANDMARKER_WASM);
    try {
      cam.landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    } catch {
      cam.landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    }
  } catch {
    stream.getTracks().forEach(tr => tr.stop());
    cam.video.hidden = true;
    cam.status = "error";
    renderCamStatus();
    return;
  }

  cam.enabled = true;
  cam.status = "tracking";
  renderCamStatus();
  document.getElementById("btn-cam-enable").textContent = t("cam.disable");
  trackCameraLoop();
}

function trackCameraLoop() {
  if (!cam.enabled) return;
  if (cam.video.readyState >= 2) {
    const result = cam.landmarker.detectForVideo(cam.video, performance.now());
    const lm = result.faceLandmarks && result.faceLandmarks[0];
    if (lm) {
      const l = lm[LEFT_IRIS_INDEX], r = lm[RIGHT_IRIS_INDEX];
      const dx = (l.x - r.x) * cam.video.videoWidth;
      const dy = (l.y - r.y) * cam.video.videoHeight;
      cam.ipdPx = Math.hypot(dx, dy);
      cam.geomBlinkLeft = geometricBlinkScore(lm, "left");
      cam.geomBlinkRight = geometricBlinkScore(lm, "right");
    } else {
      cam.ipdPx = null;
      cam.geomBlinkLeft = null;
      cam.geomBlinkRight = null;
    }
    const categories = result.faceBlendshapes && result.faceBlendshapes[0] && result.faceBlendshapes[0].categories;
    cam.blinkLeft = categories ? (categories.find(c => c.categoryName === "eyeBlinkLeft")?.score ?? null) : null;
    cam.blinkRight = categories ? (categories.find(c => c.categoryName === "eyeBlinkRight")?.score ?? null) : null;
    const matrix = result.facialTransformationMatrixes && result.facialTransformationMatrixes[0] && result.facialTransformationMatrixes[0].data;
    if (matrix) {
      cam.yawDeg = computeHeadYawDeg(matrix);
    } else {
      cam.yawDeg = null;
    }
    updateCameraFeedback();
  }
  cam.rafId = requestAnimationFrame(trackCameraLoop);
}

// Ancre la caméra sur une distance déjà mesurée (tache aveugle) : appelé
// juste après chaque mesure réussie, pendant que la personne est encore
// en place à cette distance connue.
function calibrateCameraAnchor(distanceMm) {
  if (!cam.enabled || cam.ipdPx === null || !distanceMm) return;
  // Un visage tourné au moment précis de l'ancrage fausserait la distance de
  // référence pour toute la suite de la session — mieux vaut rater cette
  // calibration et retomber sur l'hypothèse générique (63 mm) que d'ancrer sur
  // une lecture biaisée par l'angle.
  if (isHeadAngled()) return;
  cam.anchorIpdPx = cam.ipdPx;
  cam.anchorDistanceMm = distanceMm;
}

function currentCameraDistanceMm() {
  if (!cam.enabled || cam.ipdPx === null) return null;
  if (cam.anchorIpdPx && cam.anchorDistanceMm) {
    return cam.anchorDistanceMm * cam.anchorIpdPx / cam.ipdPx;
  }
  // Repli avant toute calibration : IPD adulte moyen + champ de vision webcam ~60°.
  const assumedFocalPx = (cam.video.videoWidth / 2) / Math.tan(30 * Math.PI / 180);
  return (CAMERA_IPD_MM * assumedFocalPx) / cam.ipdPx;
}

function oppositeEye(eye) {
  return eye === "right" ? "left" : "right";
}

function blinkScoreForEye(eye) {
  const key = BLINK_SCORE_KEY_FOR_USER_EYE[eye];
  const blendScore = key === "left" ? cam.blinkLeft : key === "right" ? cam.blinkRight : null;
  const geomScore = key === "left" ? cam.geomBlinkLeft : key === "right" ? cam.geomBlinkRight : null;
  if (blendScore === null) return geomScore;
  if (geomScore === null) return blendScore;
  return Math.max(blendScore, geomScore);
}

function resetEyeTrackingScores() {
  cam.blinkLeft = null;
  cam.blinkRight = null;
  cam.geomBlinkLeft = null;
  cam.geomBlinkRight = null;
}

// Yeux qui devraient être ouverts/fermés en ce moment, et leurs scores de
// clignement — utilisé à la fois par le badge de l'étape de test et par
// l'indice de la tache aveugle.
function expectedEyeState() {
  const openEye = expectedOpenEye();
  if (!openEye) return { openSide: null, openScore: null, closedSide: null, closedScore: null };
  const closedSide = oppositeEye(openEye);
  return {
    openSide: openEye,
    openScore: blinkScoreForEye(openEye),
    closedSide,
    closedScore: blinkScoreForEye(closedSide),
  };
}

function setBadgeNeutral(badge, textEl, text) {
  badge.classList.remove("eye-warn");
  badge.style.removeProperty("--cam-hue");
  badge.style.opacity = 1;
  textEl.textContent = text;
}

function setBadgeEyeWarning(badge, textEl, text) {
  badge.classList.add("eye-warn");
  badge.style.removeProperty("--cam-hue");
  badge.style.opacity = 1;
  textEl.textContent = text;
}

// Retour "chaud/froid" continu, réutilisé pour la distance ET l'angle : à la
// valeur cible, badge vert et 100% opaque ; plus l'écart grandit (par rapport
// à sa propre tolérance), plus la couleur glisse vers l'orange puis le rouge
// et plus le badge devient transparent (jamais sous CAMERA_MIN_OPACITY, pour
// rester lisible).
function setBadgeHotCold(badge, textEl, k, text) {
  badge.classList.remove("eye-warn");
  const hue = k <= 0.5 ? 142 - (142 - 40) * (k / 0.5) : 40 - 40 * ((k - 0.5) / 0.5);
  badge.style.setProperty("--cam-hue", hue.toFixed(0));
  badge.style.opacity = (1 - k * (1 - CAMERA_MIN_OPACITY)).toFixed(2);
  textEl.textContent = text;
}

function updateCameraFeedback() {
  const { openSide, closedSide } = expectedEyeState();
  const angleWarning = cam.ipdPx !== null && isHeadAngled();

  const testActive = document.getElementById("step-test").classList.contains("active");
  const badges = document.getElementById("cam-badges");
  const distBadge = document.getElementById("cam-badge");
  const distText = document.getElementById("cam-badge-text");
  const angleBadge = document.getElementById("cam-badge-angle");
  const angleText = document.getElementById("cam-badge-angle-text");
  const eyeBadge = document.getElementById("cam-badge-eye");
  const eyeText = document.getElementById("cam-badge-eye-text");
  let distanceOutOfTolerance = false;

  if (testActive) {
    badges.hidden = false;
    distBadge.hidden = false;
    angleBadge.hidden = false;
    eyeBadge.hidden = false;

    // Badge distance : il reste toujours dédié à la distance. Les problèmes
    // d'angle et d'œil ont leurs propres espaces séparés juste à côté.
    if (cam.ipdPx === null) {
      setBadgeNeutral(distBadge, distText, t("cam.noFace"));
    } else {
      const d = currentCameraDistanceMm();
      if (d === null) {
        setBadgeNeutral(distBadge, distText, t("cam.noFace"));
      } else {
        const refMm = cam.anchorDistanceMm ?? state.distanceMm;
        const pct = Math.abs(d - refMm) / refMm * 100;
        distanceOutOfTolerance = pct > CAMERA_TOLERANCE_PCT;
        if (distanceOutOfTolerance) {
          setBadgeEyeWarning(distBadge, distText, d > refMm ? t("cam.tooFar") : t("cam.tooClose"));
        } else {
          const k = Math.min(1, pct / CAMERA_FADE_PCT);
          setBadgeHotCold(distBadge, distText, k, t("camLiveDistance")(fmtCamM(d)));
        }
      }
    }

    // Badge angle, indépendant : sa propre lecture chaud/froid, remplacée par
    // un avertissement texte seulement au-delà du seuil de tolérance.
    if (cam.ipdPx === null || cam.yawDeg === null) {
      setBadgeNeutral(angleBadge, angleText, t("camLiveAngle")("—"));
    } else if (angleWarning) {
      setBadgeEyeWarning(angleBadge, angleText, t("cam.headAngled"));
    } else {
      const yawRatio = Math.abs(cam.yawDeg) / HEAD_YAW_WARN_DEG;
      const k = Math.min(1, yawRatio / 2);
      setBadgeHotCold(angleBadge, angleText, k, t("camLiveAngle")(Math.round(cam.yawDeg)));
    }

    // Badge œil : consigne stable seulement. La détection webcam d'un seul œil
    // fermé est trop variable pour être présentée comme une validation.
    if (!openSide && !closedSide) {
      setBadgeNeutral(eyeBadge, eyeText, t("camBothEyesInstruction"));
    } else if (!openSide || !closedSide) {
      setBadgeNeutral(eyeBadge, eyeText, t("cam.eyesUnknown"));
    } else {
      setBadgeNeutral(eyeBadge, eyeText, t("camEyeInstruction")(openSide, closedSide));
    }
  } else {
    badges.hidden = true;
    distBadge.hidden = true;
    angleBadge.hidden = true;
    eyeBadge.hidden = true;
  }

  // La détection d'œil fermé reste affichée comme aide, mais elle n'est pas
  // assez fiable d'un côté à l'autre pour rejeter les réponses du test.
  cam.flagged = angleWarning || distanceOutOfTolerance;

  // Indice léger et non bloquant pendant la mesure de la tache aveugle : les
  // mêmes vérifications y sont encore plus importantes, puisqu'un œil mal
  // fermé ou une tête tournée y faussent directement la mesure de distance.
  const bsHint = document.getElementById("cam-eye-hint-bs");
  if (bsHint) {
    const bsActive = document.getElementById("step-blindspot").classList.contains("active");
    bsHint.textContent = !bsActive ? ""
      : angleWarning ? t("cam.headAngled")
      : openSide && closedSide ? t("camEyeInstruction")(openSide, closedSide)
      : "";
  }
}

function showCamRejection() {
  const banner = document.getElementById("cam-reject-banner");
  banner.hidden = false;
  banner.textContent = t("cam.rejectedTrial");
  clearTimeout(showCamRejection._timer);
  showCamRejection._timer = setTimeout(() => { banner.hidden = true; }, 1800);
}

function disableCamera() {
  cam.enabled = false;
  cam.status = "idle";
  cam.ipdPx = null;
  cam.anchorIpdPx = null;
  cam.anchorDistanceMm = null;
  resetEyeTrackingScores();
  cam.flagged = false;
  if (cam.rafId) cancelAnimationFrame(cam.rafId);
  if (cam.video) {
    if (cam.video.srcObject) cam.video.srcObject.getTracks().forEach(tr => tr.stop());
    cam.video.srcObject = null;
    cam.video.hidden = true;
  }
  const badge = document.getElementById("cam-badge");
  if (badge) badge.hidden = true;
  const angleBadge = document.getElementById("cam-badge-angle");
  if (angleBadge) angleBadge.hidden = true;
  const eyeBadge = document.getElementById("cam-badge-eye");
  if (eyeBadge) eyeBadge.hidden = true;
  const badges = document.getElementById("cam-badges");
  if (badges) badges.hidden = true;
  const bsHint = document.getElementById("cam-eye-hint-bs");
  if (bsHint) bsHint.textContent = "";
  const btn = document.getElementById("btn-cam-enable");
  if (btn) btn.textContent = t("cam.enable");
  renderCamStatus();
}

function renderCamStatus() {
  const el = document.getElementById("cam-status");
  if (!el) return;
  const map = {
    idle: "",
    requesting: t("cam.requesting"),
    loading: t("cam.loadingModel"),
    tracking: t("cam.tracking"),
    denied: t("cam.denied"),
    error: t("cam.error"),
  };
  el.textContent = map[cam.status] || "";
}

document.getElementById("btn-cam-enable").addEventListener("click", toggleCamera);

/* ============================================================
 * Réponse vocale (optionnelle) — Web Speech API
 *
 * Le micro règle le problème du clavier à distance : on répond à voix
 * haute. La reconnaissance est fournie par le navigateur
 * (SpeechRecognition) ; selon le navigateur, l'audio peut transiter par
 * ses serveurs — c'est indiqué dans le texte d'activation. On ne traite
 * les transcriptions que pendant l'étape de test, et on ne réagit qu'aux
 * mots attendus par le mode en cours (directions pour le E, noms de
 * lettres pour le mode lettres) : les homophones fréquents sont mappés
 * (« eau » → O en mode lettres, mais → « haut » en mode E, etc.).
 * ============================================================ */
const mic = {
  enabled: false,
  status: "idle", // idle | listening | denied | unsupported | error
  recognition: null,
  restartTimer: null,
  lastHeardTimer: null,
  practiceFadeTimer: null,
  startedAt: 0,      // horodatage du dernier rec.start() réussi, pour détecter les fins prématurées
  rapidEndCount: 0,  // nombre de fins quasi immédiates consécutives (signe d'une boucle qui échoue)
  // File des horodatages "onspeechstart" (un par bout de parole détecté),
  // consommée en FIFO à chaque résultat final pour retrouver l'instant où la
  // personne a commencé à parler plutôt que l'instant, plus tardif, où la
  // reconnaissance a fini de traiter cette réponse (cf. tache aveugle).
  speechStartQueue: [],
};

const MIC_SPEECH_QUEUE_MAX = 5; // borne défensive : évite toute croissance illimitée

// Homophones de transcription par langue et par mode. Les deux modes sont
// disjoints (jamais actifs en même temps), donc « oh » peut vouloir dire
// O en mode lettres et « haut » en mode E sans conflit.
const VOICE_DIRECTIONS = {
  fr: {
    up: ["haut", "en haut", "eau", "au", "oh", "ho"],
    down: ["bas", "en bas", "bat", "bah"],
    left: ["gauche", "a gauche", "à gauche"],
    right: ["droite", "droit", "a droite", "à droite"],
  },
  en: {
    up: ["up", "top"],
    down: ["down", "bottom"],
    left: ["left"],
    right: ["right"],
  },
};

// Doit rester synchronisé avec LETTERS (alphabet Sloan : C D H K N O R S V Z).
const VOICE_LETTERS = {
  fr: {
    C: ["c", "cé", "ces", "c'est", "sait", "ses"],
    D: ["d", "dé", "des", "dais"],
    H: ["h", "hache", "ash"],
    K: ["k", "ka"],
    N: ["n", "enne", "haine", "aine"],
    O: ["o", "eau", "au", "oh", "ho", "os"],
    R: ["r", "erre", "air", "aire", "ère"],
    S: ["s", "esse", "aisse"],
    V: ["v", "vé"],
    Z: ["z", "zède", "zed"],
  },
  en: {
    C: ["c", "see", "sea", "si"],
    D: ["d", "dee", "de"],
    H: ["h", "aitch", "age"],
    K: ["k", "kay"],
    N: ["n", "en"],
    O: ["o", "oh", "owe"],
    R: ["r", "are"],
    S: ["s", "ess"],
    V: ["v", "vee"],
    Z: ["z", "zee", "zed"],
  },
};

function normalizeVoiceToken(raw) {
  // minuscules + suppression des accents (é -> e) pour tolérer les variantes
  // de transcription du navigateur
  return raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Distance de Levenshtein classique (nombre minimal d'insertions/suppressions/
// substitutions pour passer de a à b) — sert de repli flou ci-dessous.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prevDiag : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = tmp;
    }
  }
  return dp[n];
}

// Cherche la transcription dans une table {valeur: [variantes...]} : essaie
// d'abord la correspondance exacte (phrase entière, puis mot par mot — la
// reconnaissance renvoie parfois « la lettre e » ou « vers le haut » —, puis
// les bigrammes pour « en haut », « à gauche »...). Si rien ne correspond
// exactement, tente une correspondance floue (distance d'édition) contre les
// variantes d'au moins 3 lettres : la reconnaissance vocale du navigateur
// transcrit souvent un mot proche mais pas identique (ex. « ka » entendu
// « cas »). On exclut les variantes à 1-2 lettres du flou, sinon presque
// n'importe quel son à une lettre finirait par « matcher » une mauvaise
// lettre par accident (K et D ont une distance de 1, par exemple).
// Retourne null si rien n'est reconnu.
function matchVoiceTable(transcript, table) {
  const lookup = {};
  for (const [answerValue, variants] of Object.entries(table)) {
    for (const v of variants) lookup[normalizeVoiceToken(v)] = answerValue;
  }
  const whole = normalizeVoiceToken(transcript);
  if (lookup[whole] !== undefined) return lookup[whole];
  const words = whole.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    if (lookup[words[i]] !== undefined) return lookup[words[i]];
  }
  for (let i = words.length - 2; i >= 0; i--) {
    const pair = words[i] + " " + words[i + 1];
    if (lookup[pair] !== undefined) return lookup[pair];
  }

  let bestValue = null;
  let bestDist = Infinity;
  for (const [candidate, answerValue] of Object.entries(lookup)) {
    if (candidate.length < 3) continue; // trop court pour un flou fiable
    const tolerance = candidate.length <= 4 ? 1 : 2;
    for (const word of [whole, ...words]) {
      if (word.length < 3) continue;
      const dist = levenshtein(word, candidate);
      if (dist <= tolerance && dist < bestDist) {
        bestDist = dist;
        bestValue = answerValue;
      }
    }
  }
  return bestValue;
}

// Transforme une transcription en réponse ("up"/"down"/... ou une lettre),
// selon le mode de test actif. Retourne null si rien d'attendu n'est reconnu.
function parseVoiceAnswer(transcript, testMode = state.testMode, language = lang) {
  const table = testMode === "letters" ? VOICE_LETTERS[language] : VOICE_DIRECTIONS[language];
  if (!table) return null;
  return matchVoiceTable(transcript, table);
}

// Mot de confirmation pour la tache aveugle : dire « oui »/« yes » quand le
// point disparaît, plutôt que de cliquer ou d'appuyer sur Espace (utile
// puisqu'on ne doit pas bouger la tête/les mains pendant la mesure).
const VOICE_CONFIRM = {
  fr: { yes: ["oui", "ouais", "ouai", "wi"] },
  en: { yes: ["yes", "yeah", "yep", "yup"] },
};

function parseVoiceConfirm(transcript, language = lang) {
  const table = VOICE_CONFIRM[language];
  if (!table) return null;
  return matchVoiceTable(transcript, table);
}

function speechRecognitionLang() {
  return lang === "fr" ? "fr-FR" : "en-US";
}

// Une reconnaissance qui se termine moins de 800 ms après son démarrage n'a
// pas pu être coupée par un silence normal (le navigateur laisse largement
// plus de temps que ça) — c'est le signe d'un échec qui se répète en boucle
// (souvent lié à la permission micro qui redemande sans cesse). Fonction pure
// pour rester testable indépendamment du minutage réel du navigateur.
function isRapidMicEnd(startedAt, now = performance.now()) {
  return (now - startedAt) < 800;
}

// Grammaire JSGF listant tout le vocabulaire attendu (réponses du mode de
// test + « oui »/« yes ») pour la langue donnée. Le support réel de
// SpeechGrammarList varie beaucoup selon le navigateur (souvent ignoré en
// pratique), donc ceci est un indice best-effort, pas une garantie.
function buildVoiceGrammar(language) {
  const answerTable = state.testMode === "letters" ? VOICE_LETTERS[language] : VOICE_DIRECTIONS[language];
  const words = new Set();
  for (const table of [answerTable, VOICE_CONFIRM[language]]) {
    if (!table) continue;
    for (const variants of Object.values(table)) {
      for (const v of variants) words.add(v.replace(/'/g, ""));
    }
  }
  return `#JSGF V1.0; grammar snellen; public <snellen> = ${[...words].join(" | ")} ;`;
}

function toggleMic() {
  if (mic.enabled) {
    disableMic();
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    mic.status = "unsupported";
    renderMicStatus();
    return;
  }
  const rec = new SR();
  rec.lang = speechRecognitionLang();
  rec.continuous = true;
  rec.interimResults = false;
  // Plus d'alternatives = plus de chances qu'une des hypothèses du moteur de
  // reconnaissance corresponde à un mot attendu, même si la meilleure ne l'est pas.
  rec.maxAlternatives = 6;
  // Indice de grammaire (vocabulaire attendu) : la plupart des navigateurs
  // l'ignorent largement en pratique, mais c'est standard, gratuit, et peut
  // aider sur les moteurs qui en tiennent compte — sans jamais faire de mal.
  const SGL = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  if (SGL) {
    try {
      const grammarList = new SGL();
      grammarList.addFromString(buildVoiceGrammar(rec.lang.startsWith("fr") ? "fr" : "en"), 1);
      rec.grammars = grammarList;
    } catch { /* grammaire non supportée : on continue sans */ }
  }

  rec.onresult = (event) => {
    const testActive = document.getElementById("step-test").classList.contains("active");
    const blindspotActive = document.getElementById("step-blindspot").classList.contains("active");
    const eyeStepActive = document.getElementById("step-eye").classList.contains("active");
    if (!testActive && !blindspotActive && !eyeStepActive) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) continue;
      // Un seul bout de parole (donc un seul horodatage "onspeechstart") par
      // résultat final, quel que soit le nombre d'hypothèses alternatives.
      const speechStartedAt = mic.speechStartQueue.length ? mic.speechStartQueue.shift() : performance.now();
      for (const alt of result) {
        if (testActive) {
          const parsed = parseVoiceAnswer(alt.transcript);
          if (parsed !== null) {
            showMicHeard(alt.transcript.trim());
            answer(parsed);
            break;
          }
        } else if (blindspotActive && bs.running && parseVoiceConfirm(alt.transcript) !== null) {
          // « oui »/« yes » = équivalent vocal du clic ou de la touche Espace
          // quand le point disparaît ; bsGone() se re-garde déjà avec bs.running.
          // On utilise l'instant où la personne a commencé à parler plutôt que
          // l'instant, plus tardif, où la reconnaissance a fini de traiter la
          // réponse — sinon la mesure serait biaisée vers une tache aveugle
          // trop grande à cause du délai de traitement vocal.
          showMicHeard(alt.transcript.trim());
          bsGone(speechStartedAt);
          break;
        } else if (eyeStepActive) {
          // Zone d'essai avant le test : on teste la transcription contre les
          // deux vocabulaires possibles (réponses du mode choisi + « oui »/
          // « yes ») et on affiche le résultat, reconnu ou non, pour que la
          // personne puisse ajuster sa prononciation avant de commencer.
          const transcript = alt.transcript.trim();
          const recognized = parseVoiceAnswer(transcript) !== null || parseVoiceConfirm(transcript) !== null;
          showMicPracticeFeedback(transcript, recognized);
          break;
        }
      }
    }
  };
  rec.onstart = () => {
    mic.startedAt = performance.now();
  };
  rec.onspeechstart = () => {
    mic.speechStartQueue.push(performance.now());
    if (mic.speechStartQueue.length > MIC_SPEECH_QUEUE_MAX) mic.speechStartQueue.shift();
  };
  rec.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      disableMic();
      mic.status = "denied";
      renderMicStatus();
      return;
    }
    if (event.error === "audio-capture") {
      // Aucun micro détecté matériellement : inutile de continuer à réessayer.
      disableMic();
      mic.status = "error";
      renderMicStatus();
    }
    // "no-speech" / "aborted" / "network" : bénins, onend relancera l'écoute
  };
  rec.onend = () => {
    if (!(mic.enabled && mic.recognition === rec)) return;
    // Le navigateur coupe l'écoute après un silence même en mode continu :
    // c'est normal, on relance. Mais si la reconnaissance se termine presque
    // instantanément à répétition, ce n'est plus du silence — c'est un échec
    // en boucle (souvent un souci de permission qui redemande sans cesse
    // côté navigateur). Mieux vaut s'arrêter proprement que de continuer à
    // solliciter le navigateur indéfiniment.
    mic.rapidEndCount = isRapidMicEnd(mic.startedAt) ? mic.rapidEndCount + 1 : 0;
    if (mic.rapidEndCount >= 4) {
      disableMic();
      mic.status = "error";
      renderMicStatus();
      return;
    }
    clearTimeout(mic.restartTimer);
    // Délai minimal avant de relancer : pendant cette fenêtre, le micro
    // n'écoute plus du tout — plus elle est longue, plus on risque de
    // manquer une réponse dite juste à ce moment-là.
    mic.restartTimer = setTimeout(() => {
      if (mic.enabled && mic.recognition === rec) {
        try { rec.start(); } catch { /* déjà démarré, onend se redéclenchera */ }
      }
    }, 80);
  };

  try {
    rec.start();
  } catch {
    mic.status = "error";
    renderMicStatus();
    return;
  }
  mic.recognition = rec;
  mic.enabled = true;
  mic.status = "listening";
  mic.rapidEndCount = 0;
  renderMicStatus();
  renderMicBadge();
  document.getElementById("btn-mic-enable").textContent = t("mic.disable");
}

function disableMic() {
  mic.enabled = false;
  mic.status = "idle";
  clearTimeout(mic.restartTimer);
  clearTimeout(mic.lastHeardTimer);
  if (mic.recognition) {
    try { mic.recognition.stop(); } catch { /* déjà arrêté */ }
    mic.recognition = null;
  }
  mic.speechStartQueue = [];
  renderMicStatus();
  renderMicBadge();
  const btn = document.getElementById("btn-mic-enable");
  if (btn) btn.textContent = t("mic.enable");
}

// Changement de langue pendant que le micro tourne : on redémarre la
// reconnaissance dans la nouvelle langue.
function restartMicForLanguage() {
  if (!mic.enabled) return;
  disableMic();
  toggleMic();
}

function renderMicStatus() {
  const el = document.getElementById("mic-status");
  if (!el) return;
  const map = {
    idle: "",
    listening: t("mic.listening"),
    denied: t("mic.denied"),
    unsupported: t("mic.unsupported"),
    error: t("mic.error"),
  };
  el.textContent = map[mic.status] || "";
}

function renderMicBadge() {
  const testActive = document.getElementById("step-test").classList.contains("active");
  const blindspotActive = document.getElementById("step-blindspot").classList.contains("active");

  const row = document.getElementById("mic-badge-row");
  if (row) {
    row.hidden = !(mic.enabled && testActive);
    if (!row.hidden) document.getElementById("mic-badge-text").textContent = t("micIdle");
  }

  const rowBs = document.getElementById("mic-badge-row-bs");
  if (rowBs) {
    rowBs.hidden = !(mic.enabled && blindspotActive);
    if (!rowBs.hidden) document.getElementById("mic-badge-bs-text").textContent = t("micIdle");
  }

  // Zone d'essai sur l'écran de préparation : visible dès que le micro est
  // actif, pour que la personne puisse tester sa prononciation avant de
  // commencer réellement le test.
  const practiceRow = document.getElementById("mic-practice-row");
  if (practiceRow) practiceRow.hidden = !mic.enabled;

  renderMicExpectedWords();
}

// Affiche brièvement le dernier mot entendu dans la pastille active, puis
// revient à « À l'écoute… ».
function showMicHeard(word) {
  const testActive = document.getElementById("step-test").classList.contains("active");
  const textId = testActive ? "mic-badge-text" : "mic-badge-bs-text";
  const textEl = document.getElementById(textId);
  if (!textEl) return;
  textEl.textContent = t("micHeard")(word);
  clearTimeout(mic.lastHeardTimer);
  mic.lastHeardTimer = setTimeout(() => {
    if (mic.enabled) textEl.textContent = t("micIdle");
  }, 1500);
}

// Sur l'écran de préparation, précise les mots que la reconnaissance
// attend — combinaison des directions (ou lettres) du mode de test choisi,
// plus le mot de confirmation « oui »/« yes » utilisé pendant la tache
// aveugle. N'a de sens que si un micro est actif.
function renderMicExpectedWords() {
  const el = document.getElementById("mic-expected-words");
  if (!el) return;
  if (!mic.enabled) {
    el.textContent = "";
    return;
  }
  el.textContent = state.testMode === "letters"
    ? t("micExpectedLetters")(LETTERS.join(", "))
    : t("micExpectedDirections");
}

// Feedback de « zone d'essai » : affiche ce que le micro vient de capter à
// côté de la pastille, en vert si ça correspond à un mot attendu (direction,
// lettre ou « oui »/« yes »), en rouge sinon — puis laisse le texte
// s'estomper tout seul (transition CSS) plutôt que de disparaître d'un coup.
function showMicPracticeFeedback(transcript, recognized) {
  const el = document.getElementById("mic-practice-feedback");
  if (!el) return;
  el.textContent = recognized ? `« ${transcript} » ✓` : `« ${transcript} »`;
  el.classList.remove("recognized", "unrecognized", "visible");
  // force un reflow pour que le retrait de "visible" prenne effet avant
  // qu'on le remette (sinon pas de fondu si le même mot est redit vite)
  void el.offsetWidth;
  el.classList.add(recognized ? "recognized" : "unrecognized");
  el.classList.add("visible");
  clearTimeout(mic.practiceFadeTimer);
  mic.practiceFadeTimer = setTimeout(() => {
    el.classList.remove("visible");
  }, 1400);
}

document.getElementById("btn-mic-enable").addEventListener("click", toggleMic);

/* ============================================================
 * Étapes 3–4 — Test
 * ============================================================ */
function optotypeHeightPx(denominator, distanceMm = testDistanceMm()) {
  // À 6/6, l'optotype sous-tend 5 minutes d'arc à la distance de test.
  // Pour 6/d, l'angle est multiplié par d/6. On applique le facteur AVANT le
  // tan() pour garder la formule géométrique exacte, même sur les grandes lignes.
  const visualAngleRad = ARCMIN_5 * (denominator / 6);
  const heightMm = 2 * distanceMm * Math.tan(visualAngleRad / 2);
  return heightMm * state.pxPerMm;
}

const letterHeightRatioCache = new Map();

function letterGlyphHeightRatio(letter) {
  if (letterHeightRatioCache.has(letter)) return letterHeightRatioCache.get(letter);
  const canvas = letterGlyphHeightRatio.canvas || (letterGlyphHeightRatio.canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = `${LETTER_METRIC_FONT_SIZE}px ${LETTER_OPTOTYPE_FONT}`;
  const metrics = ctx.measureText(letter);
  const measuredHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const ratio = measuredHeight > 0 ? measuredHeight / LETTER_METRIC_FONT_SIZE : 1;
  letterHeightRatioCache.set(letter, ratio);
  return ratio;
}

// Facteur d'échelle UNIQUE pour toute la police, basé sur la hauteur du E
// (lettre plate de référence, cap height). Les polices optotypes dessinent
// volontairement les lettres rondes (C, O) ~4 % plus hautes — le « dépassement
// optique » qui les fait paraître de la même taille que les lettres plates.
// Normaliser chaque glyphe individuellement à la même hauteur physique
// écraserait ce dépassement et rétrécirait C et O par rapport au dessin voulu ;
// on mesure donc une seule fois sur le E et on applique ce ratio partout.
function letterFontSizeForHeight(letter, targetHeightPx) {
  return targetHeightPx / letterGlyphHeightRatio("E");
}

function applyLetterOptotypeSize(el, letter, targetHeightPx) {
  el.style.fontSize = letterFontSizeForHeight(letter, targetHeightPx) + "px";
  el.style.width = targetHeightPx * 1.35 + "px";
  el.style.height = targetHeightPx * 1.35 + "px";
}

function applyCrowdingSize(targetHeightPx) {
  const frame = document.getElementById("crowding-frame");
  const gapPx = targetHeightPx * 0.5;
  const barPx = Math.max(2, targetHeightPx / 5);
  frame.style.setProperty("--optotype-size", targetHeightPx + "px");
  frame.style.setProperty("--crowding-gap", gapPx + "px");
  frame.style.setProperty("--crowding-bar", barPx + "px");
  frame.style.setProperty("--crowding-pad", (gapPx + barPx) + "px");
}

// Largeur de trait minimale, en pixels PHYSIQUES de l'écran (pas en pixels CSS),
// pour qu'un trait de l'optotype existe comme élément distinct plutôt que de
// disparaître dans l'anti-crénelage. Le E (grille 5×5) et les lettres ont tous
// deux un trait d'environ 1/5 de la hauteur totale de l'optotype.
// NB : un écran haute densité (Retina, devicePixelRatio > 1) donne PLUS de
// pixels physiques pour la même taille en pixels CSS, donc rend la coupure
// moins agressive, pas plus — si le test s'arrête trop tôt, ce n'est pas la
// densité d'écran qui manque, c'est ce seuil qui était trop prudent : 1 px
// physique est déjà suffisant pour qu'un trait antialiasé reste net et
// discernable sur un écran moderne, et le E/lettres testés restent de toute
// façon validés par le taux de réussite (3/5) en mode interactif.
const MIN_STROKE_DEVICE_PX = 1;

function reliableAtDenom(denom, distanceMm) {
  const strokeCssPx = optotypeHeightPx(denom, distanceMm) / 5;
  const strokeDevicePx = strokeCssPx * (window.devicePixelRatio || 1);
  return strokeDevicePx >= MIN_STROKE_DEVICE_PX;
}

// Lignes présentées à l'utilisateur. On ne masque plus les petites lignes :
// le seuil de pixels sert seulement à avertir que l'affichage peut expliquer
// un échec aux lignes les plus fines.
function usableLinesFor(distanceMm, lines = LINES) {
  return [...lines];
}

function firstUnreliableDenomFor(distanceMm, lines = LINES) {
  return lines.find(d => !reliableAtDenom(d, distanceMm)) ?? null;
}

function nextHarderLineAfter(denom, lines) {
  const idx = lines.indexOf(denom);
  return idx >= 0 ? (lines[idx + 1] ?? null) : null;
}

function startEyeTest(eye) {
  state.currentEye = eye;
  state.usableLines = usableLinesFor(testDistanceMm(eye));
  state.precisionLimitedAt = firstUnreliableDenomFor(testDistanceMm(eye));
  state.lineIndex = 0;
  state.lastPassedIndex = -1;
  state.failedAt = null;
  state.lineScores = [];
  renderTestMode();
  renderTestEyeIcons();
  renderPrecisionNote(document.getElementById("test-precision-note"), state.precisionLimitedAt, d => `6/${fmt(d)}`);
  startLine();
  show("step-test");
  renderTestHeader();
  renderMicBadge();
}

// Avertit si la résolution de l'écran (à la distance de test) empêche
// d'afficher de façon fiable les lignes les plus petites — sinon on risque de
// présenter un optotype qui ressemble à un flou plutôt qu'à une forme nette,
// et de faire "échouer" quelqu'un à cause de l'écran plutôt que de sa vue.
function renderPrecisionNote(el, firstUnreliable, formatFraction) {
  if (!el) return;
  if (zoomChangedSinceCalibration()) {
    el.textContent = t("zoomChangedWarning");
    return;
  }
  el.textContent = firstUnreliable
    ? t("precisionCapNote")(formatFraction(firstUnreliable))
    : "";
}

function renderTestHeader() {
  document.getElementById("test-eye-label").textContent =
    state.currentEye === "both" ? t("bothEyesOpenLabel")
      : state.currentEye === "right" ? t("eyeRightLabel") : t("eyeLeftLabel");
  document.getElementById("test-line-label").textContent =
    t("lineLabel")(state.usableLines[state.lineIndex], state.trial + 1, TRIALS_PER_LINE);
  renderTestEyeIcons();
}

function renderTestEyeIcons() {
  if (!state.currentEye) return;
  if (state.currentEye === "both") {
    testEyeLeftSide.hidden = false;
    testEyeRightSide.hidden = false;
    setBlindSpotEyeIcon(testEyeLeftSide, true);
    setBlindSpotEyeIcon(testEyeRightSide, true);
    return;
  }
  testEyeLeftSide.hidden = false;
  testEyeRightSide.hidden = false;
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
  const denom = state.usableLines[state.lineIndex];
  const px = optotypeHeightPx(denom);
  applyCrowdingSize(px);

  if (state.testMode === "letters") {
    let letter;
    do { letter = LETTERS[Math.floor(Math.random() * LETTERS.length)]; } while (letter === state.currentLetter);
    state.currentLetter = letter;
    const letterEl = document.getElementById("letter-optotype");
    letterEl.textContent = letter;
    applyLetterOptotypeSize(letterEl, letter, px);
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
  if (cam.enabled && cam.flagged) {
    showCamRejection();
    return; // essai non compté ; on redemande le même optotype une fois repositionné
  }
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
  state.lineScores.push({
    denominator: state.usableLines[state.lineIndex],
    correct: state.correctCount,
    trials: state.trial,
    passed: true,
  });
  state.lastPassedIndex = state.lineIndex;
  if (state.lineIndex + 1 >= state.usableLines.length) {
    state.failedAt = null;
    return endEyeTest();
  }
  state.lineIndex++;
  startLine();
}

function failLine() {
  state.failedAt = state.usableLines[state.lineIndex] ?? null;
  state.lineScores.push({
    denominator: state.failedAt,
    correct: state.correctCount,
    trials: state.trial,
    passed: false,
  });
  endEyeTest();
}

function endEyeTest() {
  const failedScore = state.lineScores.find(s => s.denominator === state.failedAt && !s.passed) ?? null;
  state.results[state.currentEye] = {
    denominator: state.lastPassedIndex >= 0 ? state.usableLines[state.lastPassedIndex] : null,
    precisionLimitedAt: state.precisionLimitedAt,
    failedAt: state.failedAt,
    failedCorrect: failedScore?.correct ?? 0,
    lineScores: [...state.lineScores],
  };
  const nextEye = nextEyeAfter(state.currentEye);
  if (nextEye) {
    goToSwitchStep(nextEye);
  } else {
    showResults();
  }
}

// Interlude entre les passes : droit -> gauche, puis optionnellement gauche -> deux yeux.
// En binoculaire simple, il n'y a qu'une seule passe "both".
function goToSwitchStep(nextEye) {
  state.pendingEye = nextEye;
  const completedEye = state.currentEye;
  const completedResult = state.results[completedEye];
  const resultLabel = completedEye === "right"
    ? t("rightEye")
    : completedEye === "left"
      ? t("leftEye")
      : t("bothEyes");
  document.getElementById("switch-result").textContent = `${resultLabel} : ${
    completedResult.denominator !== null
      ? t("approx")(completedResult.denominator, feetNotation(completedResult.denominator))
      : t("worse")
  }.`;
  document.getElementById("switch-text").innerHTML = nextEye === "both"
    ? t("switch.textBoth")
    : state.testMode === "chart" ? t("switch.textChart") : t("switch.textBlindspot");
  document.getElementById("btn-second-pass").textContent = nextEye === "both"
    ? t("switch.btnBoth")
    : t("switch.btn");
  show("step-switch");
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
  const logmar = fmt(resultLogmar(res).toFixed(2));
  return `<tr><td>${label}</td><td>6/${fmt(d)}</td><td>${feetNotation(d)}</td><td>${decimal}</td><td>${logmar}</td></tr>`;
}

function resultLogmar(res) {
  const base = Math.log10(res.denominator / 6);
  const failedCorrect = Number.isFinite(res.failedCorrect) ? res.failedCorrect : 0;
  return base - (failedCorrect * 0.02);
}

function resultTouchesPrecisionLimit(res) {
  if (!res || !res.precisionLimitedAt) return false;
  if (res.failedAt !== null && res.failedAt !== undefined) {
    return res.failedAt <= res.precisionLimitedAt;
  }
  return res.denominator !== null && res.denominator <= res.precisionLimitedAt;
}

function showResults() {
  disableCamera();
  disableMic();
  const resultEyes = state.eyeMode === "binocular"
    ? ["both"]
    : state.eyeMode === "complete"
      ? ["right", "left", "both"]
      : ["right", "left"];
  document.getElementById("results-distance").textContent = state.eyeMode === "binocular"
    ? t("resultsDistanceBoth")(fmtM(testDistanceMm("both")))
    : state.eyeMode === "complete"
      ? t("resultsDistanceComplete")(fmtM(testDistanceMm("right")), fmtM(testDistanceMm("left")), fmtM(testDistanceMm("both")))
      : t("resultsDistance")(fmtM(testDistanceMm("right")), fmtM(testDistanceMm("left")));

  const tbody = document.querySelector("#results-table tbody");
  tbody.innerHTML = resultEyes
    .map(eye => resultRow(resultLabelForEye(eye), state.results[eye]))
    .join("");

  const precisionEyes = resultEyes
    .filter(eye => resultTouchesPrecisionLimit(state.results[eye]))
    .map(eye => resultLabelForEye(eye).toLowerCase());
  const precisionWarning = document.getElementById("results-precision-warning");
  precisionWarning.hidden = precisionEyes.length === 0;
  precisionWarning.innerHTML = precisionEyes.length
    ? `<strong>${t("results.precisionTitle")}.</strong> ${t("resultsPrecisionWarning")(precisionEyes.join(", "))}`
    : "";

  const denoms = resultEyes.map(eye => state.results[eye]?.denominator ?? null);
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

function resultLabelForEye(eye) {
  if (eye === "right") return t("rightEye");
  if (eye === "left") return t("leftEye");
  return t("bothEyes");
}

/* ============================================================
 * Mode Chart — tableau Snellen complet, lecture auto-déclarée
 * ============================================================ */
const CHART_LETTERS_PER_LINE = 5;

function showChartStep(eye) {
  state.currentEye = eye;
  state.usableLines = usableLinesFor(testDistanceMm(eye), CHART_LINES);
  state.precisionLimitedAt = firstUnreliableDenomFor(testDistanceMm(eye), CHART_LINES);
  document.getElementById("chart-eye-label").textContent =
    eye === "both" ? t("chartEyeBoth") : t("chartEyeMono")(eye);
  document.getElementById("chart-instructions").textContent = t("chart.instructions");
  renderPrecisionNote(document.getElementById("chart-precision-note"), state.precisionLimitedAt, feetNotation);
  buildChartRows();
  buildChartLineButtons();
  show("step-chart");
}

function buildChartRows() {
  const container = document.getElementById("chart-rows");
  container.innerHTML = "";
  state.usableLines.forEach((denom, i) => {
    const px = optotypeHeightPx(denom);
    const row = document.createElement("div");
    row.className = "chart-row";

    const letters = document.createElement("span");
    letters.className = "chart-row-letters";
    letters.style.gap = (px * 0.35) + "px";
    const pool = [...LETTERS];
    for (let j = 0; j < CHART_LETTERS_PER_LINE; j++) {
      const idx = Math.floor(Math.random() * pool.length);
      const letter = pool.splice(idx, 1)[0];
      const span = document.createElement("span");
      span.textContent = letter;
      span.style.fontSize = letterFontSizeForHeight(letter, px) + "px";
      letters.appendChild(span);
    }

    // Étiquette flottante à droite (numéro de ligne + fraction), en dehors du
    // flux normal : n'affecte pas le centrage des lettres sur la ligne, comme
    // sur un vrai tableau Snellen.
    const label = document.createElement("span");
    label.className = "chart-row-label";
    label.innerHTML =
      `<span class="chart-row-index">${i + 1}</span><span class="chart-row-frac">${feetNotation(denom)}</span>`;

    row.appendChild(letters);
    row.appendChild(label);
    container.appendChild(row);
  });
}

function refreshLetterMetricSizing() {
  letterHeightRatioCache.clear();
  if (document.getElementById("step-test").classList.contains("active")
    && state.testMode === "letters"
    && state.currentLetter
    && state.usableLines[state.lineIndex] !== undefined) {
    const px = optotypeHeightPx(state.usableLines[state.lineIndex]);
    applyLetterOptotypeSize(document.getElementById("letter-optotype"), state.currentLetter, px);
    applyCrowdingSize(px);
  }
  if (document.getElementById("step-chart").classList.contains("active") && state.currentEye) {
    buildChartRows();
  }
}

if (document.fonts) {
  document.fonts.load(`${LETTER_METRIC_FONT_SIZE}px ${LETTER_OPTOTYPE_FONT}`)
    .then(refreshLetterMetricSizing)
    .catch(() => {});
  document.fonts.ready.then(refreshLetterMetricSizing);
}

function buildChartLineButtons() {
  const container = document.getElementById("chart-line-buttons");
  container.innerHTML = state.usableLines
    .map(denom => `<button class="btn chart-line" data-denom="${denom}">${feetNotation(denom)}</button>`)
    .join("");
  container.querySelectorAll(".chart-line").forEach(btn =>
    btn.addEventListener("click", () => chartAnswer(parseFloat(btn.dataset.denom)))
  );
}

function chartAnswer(denominator) {
  state.results[state.currentEye] = {
    denominator,
    precisionLimitedAt: state.precisionLimitedAt,
    failedAt: denominator === null ? state.usableLines[0] : nextHarderLineAfter(denominator, state.usableLines),
    failedCorrect: 0,
    lineScores: [],
  };
  const nextEye = nextEyeAfter(state.currentEye);
  if (nextEye) {
    goToSwitchStep(nextEye);
  } else {
    showResults();
  }
}
document.getElementById("btn-chart-none").addEventListener("click", () => chartAnswer(null));

/* ============================================================
 * Navigation générale / General navigation
 * ============================================================ */
document.getElementById("btn-start").addEventListener("click", () => {
  initCalibration();
  show("step-calibrate");
});
document.getElementById("btn-restart").addEventListener("click", () => {
  document.body.classList.remove("bs-dimmed");
  state.results = {};
  state.measuredMm = null;
  state.measuredByEye = { right: null, left: null, both: null };
  state.manualDistanceMm = null;
  state.testMode = "tumblingE";
  state.eyeMode = "monocular";
  state.pendingEye = null;
  state.precisionLimitedAt = null;
  state.failedAt = null;
  state.lineScores = [];
  document.querySelectorAll("#mode-type-choices .mode-choice").forEach(b =>
    b.classList.toggle("selected", b.dataset.testmode === state.testMode));
  document.querySelectorAll("#mode-eyes-choices .mode-choice").forEach(b =>
    b.classList.toggle("selected", b.dataset.eyemode === state.eyeMode));
  show("step-intro");
});

applyI18n();
