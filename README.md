# Test de Snellen à la maison

Site statique (HTML/CSS/JS pur, aucune dépendance) qui estime l'acuité visuelle
à la maison en trois étapes :

1. **Calibration de l'écran** — l'utilisateur pose une carte de crédit contre
   l'écran et ajuste un rectangle jusqu'à correspondance. Une carte ISO/IEC 7810
   ID-1 mesure exactement 85,60 × 53,98 mm, ce qui donne le ratio pixels/mm de
   l'écran, indépendamment de la résolution ou du scaling de l'OS.
2. **Distance de vision** — le pouce au bout du bras tendu sous-tend environ 2°
   d'angle visuel. Le site affiche une barre dont la largeur physique vaut
   `2 × D × tan(1°)` pour la distance choisie (1 m / 1,5 m / 2 m) ; l'utilisateur
   recule jusqu'à ce que son pouce couvre exactement la barre.
3. **Test de Snellen** — optotype « E directionnel » (tumbling E), dessiné en SVG
   sur la grille 5×5 standard (traits = 1/5 de la hauteur), donc géométriquement
   exact sans dépendre d'une police. À 6/6, l'optotype sous-tend 5 minutes d'arc.
   Un œil à la fois, 5 essais par ligne, ≥ 3 corrects pour passer. Résultats en
   Snellen (m et pieds), décimale et LogMAR.

⚠️ **Ce n'est pas un dispositif médical** : estimation indicative seulement,
sensible à la calibration, à la distance réelle, à l'éclairage et à l'écran.

## Développement local

N'importe quel serveur statique fonctionne :

```bash
python3 -m http.server 8642
# puis ouvrir http://localhost:8642
```

## Déploiement sur GitHub Pages

1. Créez un dépôt sur GitHub (par ex. `snellen-test`) et poussez ce code :

   ```bash
   git remote add origin git@github.com:<votre-utilisateur>/snellen-test.git
   git push -u origin main
   ```

2. Sur GitHub : **Settings → Pages → Source : Deploy from a branch**,
   branche `main`, dossier `/ (root)`, puis **Save**.

3. Le site sera disponible sous
   `https://<votre-utilisateur>.github.io/snellen-test/` après une minute ou deux.

## Fichiers

- `index.html` — les six écrans (accueil, calibration, distance, préparation, test, résultats)
- `style.css` — styles (thème clair/sombre automatique)
- `app.js` — calibration, géométrie des optotypes, logique du test, résultats
