# Rapport — Fix Ex 2 Alphabet : révéler la bonne réponse en cas d'erreur

## 🐛 Bug constaté

Sur la page `/alphabet/ecoute`, quand l'enfant se trompait, seule sa carte tapée devenait rouge. Il passait à la question suivante **sans savoir quelle était la bonne lettre** → opportunité d'apprentissage manquée.

## ✅ Comportement après fix

- **Bonne réponse** : la carte tapée devient verte (inchangé) → délai 800ms.
- **Mauvaise réponse** : la carte tapée devient rouge **ET** la carte avec la bonne réponse devient verte en même temps → l'enfant voit clairement "ah, la bonne réponse c'était ça !" → délai 1200ms pour laisser le temps de voir la révélation.

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/pages/AlphabetEcoute.jsx` | 2 modifs locales : logique couleur des cartes + délai variable |

Aucun autre fichier touché. Aucun impact sur l'Ex 1.

---

## 🔧 Détail des changements

### 1. Révélation de la bonne réponse dans le rendu

Ajout d'une troisième branche dans la logique de coloration des cartes :

```diff
 const estChoisie = lettreChoisie === lettre
+const estBonneReponse = lettre === question.lettre
 let borderColor = 'rgba(139,92,246,0.25)'
 let background = 'rgba(255,255,255,0.04)'

 if (estChoisie && feedback === 'ok') {
   // carte tapée + bonne → vert
   borderColor = 'rgba(88,204,2,0.6)'
   background = 'rgba(88,204,2,0.12)'
 } else if (estChoisie && feedback === 'nok') {
   // carte tapée + mauvaise → rouge
   borderColor = 'rgba(239,68,68,0.6)'
   background = 'rgba(239,68,68,0.12)'
+} else if (feedback === 'nok' && estBonneReponse) {
+  // Révèle la bonne réponse à l'enfant qui s'est trompé
+  borderColor = 'rgba(88,204,2,0.6)'
+  background = 'rgba(88,204,2,0.12)'
 }
```

**Important** : l'ordre des branches garantit qu'on n'écrase pas le rouge sur la carte tapée. Si l'enfant a tapé la mauvaise carte, c'est elle qui est rouge ; les **autres** cartes vérifient si elles sont la bonne réponse → seule la vraie bonne lettre devient verte. Pas de conflit.

### 2. Délai variable selon le résultat

```diff
+// Plus long quand l'enfant s'est trompé, pour qu'il ait le temps de
+// voir la bonne réponse révélée en vert.
+const delaiFeedback = bonneReponse ? 800 : 1200

 setTimeout(() => {
   ...
-}, 800)
+}, delaiFeedback)
```

- Bonne réponse → 800ms (inchangé, ne pas ralentir l'enthousiasme)
- Mauvaise réponse → 1200ms (laisse le temps de voir la révélation et l'intégrer)

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur `AlphabetEcoute.jsx`
- [x] **Comportement bonne réponse** strictement inchangé
- [x] **Triple sécurité clics pendant feedback** toujours en place (`disabled`, early return, cursor)
- [x] **Bouton rejouer** toujours actif pendant le feedback (consigne préservée)
- [x] **Aucun impact sur l'Ex 1** ni sur le reste de l'app

## 🧪 À tester (Wells)

1. Naviguer sur `/alphabet/ecoute`
2. Attendre la lecture de la 1ère lettre
3. **Bonne réponse** : taper la bonne carte → verte 800ms → question suivante (inchangé)
4. **Mauvaise réponse** : taper une mauvaise carte
   - ✔ Carte tapée devient **rouge**
   - ✔ Carte avec la **bonne lettre** devient **verte** en même temps
   - ✔ On reste 1200ms avant de passer à la suivante (perceptible : un peu plus de temps pour absorber)
5. Bénéfice pédagogique : l'enfant apprend la bonne lettre même quand il se trompe.
