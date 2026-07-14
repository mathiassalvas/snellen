# Test Snellen - Mathias

Site statique bilingue FR/EN qui estime l'acuite visuelle a la maison. Tout le
test tourne dans le navigateur : HTML, CSS et JavaScript pur, sans serveur.

Ce projet n'est pas un dispositif medical. Il donne une estimation indicative
seulement, sensible a la calibration, a la distance reelle, a l'eclairage, au
zoom du navigateur et a la qualite de l'ecran.

## Fonctionnement

1. **Calibration de l'ecran** — l'utilisateur pose une carte de credit contre
   l'ecran et ajuste un rectangle. Une carte ISO/IEC 7810 ID-1 mesure
   `85,60 mm x 53,98 mm`, ce qui permet de convertir les pixels CSS en
   millimetres physiques.
2. **Choix du test** — trois modes sont disponibles :
   - `Tableau Snellen` : tableau complet, distance entree manuellement.
   - `E directionnel` : un E de Snellen tourne, reponse avec les fleches.
   - `Lettres Sloan` : une lettre optotype a la fois, reponse par lettre.
3. **Choix des yeux** — un oeil a la fois, deux yeux ensemble, ou test complet
   qui mesure l'oeil droit, l'oeil gauche, puis les deux yeux.
4. **Distance** — le tableau utilise une distance mesuree au ruban. Les tests
   interactifs utilisent d'abord le pouce pour une estimation, puis la tache
   aveugle pour confirmer la distance avant chaque passe.
5. **Resultats** — Snellen en metres, equivalent 20 pieds, decimal et LogMAR.

## Mathematiques

### Calibration ecran

La calibration donne le nombre de pixels CSS par millimetre :

```text
pxParMm = largeurRectanglePx / 85,60
```

Toutes les tailles affichees utilisent ensuite cette valeur. Si le zoom du
navigateur change apres la calibration, la relation pixel-millimetre change
aussi; le site affiche donc un avertissement pendant les tests.

### Taille des optotypes Snellen

Dans un test Snellen, un optotype `6/6` sous-tend `5 minutes d'arc` en hauteur.
Une ligne `6/d` grossit proportionnellement a `d / 6`.

Le site calcule donc l'angle visuel cible :

```text
angleRad = (5 / 60 degres) * pi / 180 * (denominateur / 6)
```

Puis convertit cet angle en hauteur physique a la distance de test :

```text
hauteurMm = 2 * distanceMm * tan(angleRad / 2)
hauteurPx = hauteurMm * pxParMm
```

Exemple a `1500 mm` de distance :

```text
6/6   -> 2,182 mm
6/3,9 -> 1,418 mm   (equivalent 20/13)
6/3   -> 1,091 mm   (equivalent 20/10)
6/2,4 -> 0,873 mm   (equivalent 20/8)
```

### E directionnel

Le `E` est un SVG avec `viewBox="0 0 5 5"`. Sa grille est donc exactement la
grille classique d'un optotype de Snellen : hauteur totale `5 unites`, traits
de `1 unite`, espacements de `1 unite`.

Le JavaScript assigne directement :

```text
largeurSvgPx = hauteurPx
hauteurSvgPx = hauteurPx
```

Le `E` directionnel ne depend donc pas d'une police.

### Lettres Sloan

Une taille CSS `font-size: 40px` ne garantit pas un glyphe visible de `40px`.
Pour les lettres, le site utilise Optician Sans et mesure chaque glyphe avec
`CanvasRenderingContext2D.measureText()` :

```text
hauteurGlyphe = actualBoundingBoxAscent + actualBoundingBoxDescent
ratioLettre = hauteurGlyphe / taillePoliceMesure
fontSizePx = hauteurPx / ratioLettre
```

Chaque lettre Sloan est donc ajustee pour que sa hauteur visible corresponde a
la meme `hauteurPx` que le `E` directionnel.

### Tableau Snellen

Le tableau reutilise exactement le meme calcul que les lettres interactives.
Les lignes affichees sont :

```text
20/50 = 6/15
20/40 = 6/12
20/30 = 6/9
20/25 = 6/7,5
20/20 = 6/6
20/15 = 6/4,5
20/13 = 6/3,9
20/10 = 6/3
20/8  = 6/2,4
```

Le mode tableau differe seulement dans la presentation : plusieurs lettres par
ligne sont affichees en meme temps, mais leur hauteur optique vient de la meme
formule.

### Pouce

Le pouce bras tendu est approxime a `2 degres` d'angle visuel. Pour une distance
candidate `D`, la barre affichee a cette largeur physique :

```text
largeurPouceMm = 2 * D * tan(1 degre)
largeurPoucePx = largeurPouceMm * pxParMm
```

Cette methode donne une premiere estimation pratique, pas la distance finale.
Elle sert aussi a verifier si la mesure de tache aveugle est plausible : si la
distance obtenue par la tache aveugle varie d'environ `30 %` ou plus par rapport
a l'estimation au pouce, le site avertit l'utilisateur.

L'estimation au pouce sert finalement de jalon pour rendre la tache aveugle plus
rapide. Le point ne part pas du centre : il commence environ a `60 %` de la
position attendue selon le pouce. Si le point depasse environ `140 %` de cette
position sans que l'utilisateur ait indique sa disparition, l'essai est repris.
Cela evite un long trajet inutile et aide quand l'utilisateur oublie de cliquer.

### Tache aveugle

La tache aveugle est approximee a `13,5 degres` du point de fixation. Le site
fait disparaitre un point en mouvement pendant que l'utilisateur fixe une croix.
La separation entre la croix et le point donne la distance :

```text
distanceMm = (separationPx / pxParMm) / tan(13,5 degres)
```

Chaque oeil est mesure 5 fois. Le site retire l'essai le plus court et le plus
long, puis moyenne les autres essais pour reduire l'effet d'un clic trop tot ou
trop tard.

## Limites pratiques

- Le test n'est fiable que si la calibration et la distance sont bonnes.
- Le zoom du navigateur doit rester stable apres la calibration.
- Les tres petites lignes peuvent etre limitees par la densite de pixels de
  l'ecran; le site avertit alors dans les resultats plutot que d'arreter le
  test trop tot.
- La camera optionnelle sert a suivre la distance et l'angle horizontal de la
  tete pendant le test interactif. Elle ne remplace pas les consignes visuelles
  d'ouverture/fermeture des yeux.

## Fichiers

- `index.html` — structure des ecrans.
- `style.css` — styles, responsive, optotypes et interface.
- `app.js` — i18n, calibration, calculs physiques, logique des tests et
  resultats.
- `assets/` — police Optician Sans et visuels de l'accueil.

## Vie privee

Le test tourne localement dans le navigateur et ne transmet pas les resultats.
Si l'utilisateur active le suivi camera optionnel, le modele de detection du
visage est telecharge depuis un CDN externe au premier lancement, mais l'analyse
video reste locale.
