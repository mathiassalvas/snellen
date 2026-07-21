# Test Snellen - Mathias

Site statique bilingue FR/EN qui estime l'acuité visuelle à la maison. Tout le
test tourne dans le navigateur : HTML, CSS et JavaScript pur, sans serveur ni
dépendance de build.

> ⚠️ Ce projet n'est **pas un dispositif médical**. Il donne une estimation
> indicative seulement, sensible à la calibration, à la distance réelle, à
> l'éclairage, au zoom du navigateur et à la qualité de l'écran. Il ne remplace
> pas un examen par un professionnel de la vue.

## Fonctionnement

1. **Calibration de l'écran** — l'utilisateur pose une carte de crédit contre
   l'écran et ajuste un rectangle. Une carte ISO/IEC 7810 ID-1 mesure
   `85,60 mm × 53,98 mm`, ce qui permet de convertir les pixels CSS en
   millimètres physiques.
2. **Choix du test** — trois modes :
   - `Tableau Snellen` : tableau complet, distance entrée manuellement ;
   - `Tumbling E` : un E de Snellen tourne, réponse avec les flèches ;
   - `Lettres Sloan` : une lettre optotype isolée à la fois (recommandé).
3. **Choix des yeux** — un œil à la fois, deux yeux ensemble, ou test complet
   (œil droit, œil gauche, puis les deux yeux).
4. **Distance** — le tableau utilise une distance mesurée au ruban. Les tests
   interactifs mesurent la distance avec la **tache aveugle** avant chaque
   passe (voir plus bas).
5. **Résultats** — Snellen en mètres, équivalent 20 pieds, décimale et LogMAR
   ajusté.

### Options pendant le test

- **Réponse vocale (bêta)** — Web Speech API : dire « haut / bas / gauche /
  droite », le nom d'une lettre, ou « oui » quand le point de la tache aveugle
  disparaît. Les homophones fréquents sont mappés et une zone d'essai permet de
  vérifier sa prononciation avant de commencer. Selon le navigateur, l'audio
  peut transiter par ses serveurs (indiqué dans l'interface).
- **Suivi caméra** — MediaPipe Face Landmarker (chargé à la demande depuis un
  CDN) suit la distance et l'angle de tête pendant le test, ancré sur la mesure
  de tache aveugle. L'analyse vidéo reste locale au navigateur.

## Mathématiques

### Calibration écran

```text
pxParMm = largeurRectanglePx / 85,60
```

Toutes les tailles affichées utilisent ensuite cette valeur. Si le zoom du
navigateur change après la calibration, la relation pixel-millimètre change
aussi ; le site affiche alors un avertissement pendant les tests.

### Taille des optotypes Snellen

Un optotype `6/6` sous-tend `5 minutes d'arc` en hauteur ; une ligne `6/d`
grossit proportionnellement à `d / 6` :

```text
angleRad  = (5 / 60°) × π / 180 × (dénominateur / 6)
hauteurMm = 2 × distanceMm × tan(angleRad / 2)
hauteurPx = hauteurMm × pxParMm
```

Exemple à `1500 mm` : `6/6 → 2,182 mm`, `6/3,9 → 1,418 mm` (20/13),
`6/2,4 → 0,873 mm` (20/8).

### Tumbling E

Le `E` est un SVG avec `viewBox="0 0 5 5"` : la grille classique d'un optotype
de Snellen (hauteur 5 unités, traits et espaces de 1 unité). Sa taille CSS est
assignée directement, sans dépendre d'une police.

### Lettres Sloan

Une taille CSS `font-size: 40px` ne garantit pas un glyphe visible de `40px`.
Le site utilise Optician Sans et mesure le glyphe de référence `E` avec
`CanvasRenderingContext2D.measureText()` :

```text
ratio      = (actualBoundingBoxAscent + actualBoundingBoxDescent) / taillePolice
fontSizePx = hauteurPx / ratio(E)
```

Le ratio du `E` (hauteur de capitale) est appliqué à toutes les lettres pour
préserver le léger débordement optique voulu des lettres rondes (C, O). Des
barres d'encombrement (*crowding bars*) entourent l'optotype isolé.

### Tableau Snellen

Mêmes formules que le test interactif ; seules la présentation (5 lettres par
ligne) et la saisie (ligne auto-déclarée) changent. Lignes : 20/50, 20/40,
20/30, 20/25, 20/20, 20/15, 20/13, 20/10, 20/8.

### Tache aveugle (distance)

La tache aveugle est à environ `13,5°` du point de fixation (méthode du
« virtual chinrest », Li et al. 2020). Un point dérive pendant que l'utilisateur
fixe une croix ; la séparation croix-point au moment de la disparition donne :

```text
distanceMm = (séparationPx / pxParMm) / tan(13,5°)
```

Chaque œil est mesuré 5 fois ; on retire l'essai le plus court et le plus long
puis on moyenne le reste. Les essais suivants démarrent dans une fenêtre
adaptative centrée sur les mesures déjà acquises (élargie après un essai
manqué), avec une vitesse ralentie près du centre attendu. En réponse vocale,
la position retenue est celle du **début** du « oui » (rétro-datation via
l'historique des positions), pas celle de la fin du traitement vocal.

### LogMAR ajusté

Le LogMAR de base est `log10(d / 6)` de la dernière ligne réussie. Chaque
lettre lue sur la ligne échouée crédite `n/5` du pas logMAR **réel** entre la
ligne réussie et la ligne échouée (les pas de ce tableau ne sont pas des pas
uniformes de 0,1).

## Limites pratiques

- Le test n'est fiable que si la calibration et la distance sont bonnes.
- Le zoom du navigateur doit rester stable après la calibration.
- Les très petites lignes peuvent être limitées par la densité de pixels de
  l'écran ; le site l'indique dans les résultats plutôt que d'arrêter le test.
- La détection caméra d'un œil fermé est indicative seulement.

## Développement

Aucun build : servir le dossier tel quel, par exemple :

```bash
python3 -m http.server 8642
# puis http://localhost:8642
```

Les URL d'assets portent un paramètre `?v=` à incrémenter à chaque déploiement
pour invalider les caches.

## Déploiement

GitHub Actions (`.github/workflows/pages.yml`) publie `index.html`,
`style.css`, `app.js`, `assets/` et `fonts/` sur GitHub Pages à chaque push sur
`main`.

## Fichiers

- `index.html` — structure des écrans ;
- `style.css` — styles, responsive, optotypes, thème clair/sombre ;
- `app.js` — i18n, calibration, calculs physiques, tache aveugle, caméra,
  réponse vocale, logique des tests et résultats ;
- `fonts/` — police optotype Optician Sans (woff2 + licence) ;
- `assets/` — favicon, visuels de l'accueil, police OTF de secours.

## Vie privée

Le test tourne localement et ne transmet pas les résultats. Le suivi caméra
optionnel télécharge son modèle depuis un CDN au premier lancement, mais
l'analyse vidéo reste locale. La reconnaissance vocale optionnelle est fournie
par le navigateur et peut, selon celui-ci, utiliser ses serveurs.
