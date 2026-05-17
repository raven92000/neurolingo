# Rapport — Généralisation Ex 3 "Chantons l'alphabet" multi-langues

## ✅ Résultat

`src/pages/AlphabetChanson.jsx` chante désormais l'alphabet dans toutes les langues dont les couplets sont définis. Aujourd'hui : **EN** (26 lettres, 7 couplets) et **ES** (27 lettres avec Ñ, 8 couplets validés par Wells).

Pour les langues sans couplets définis (DE/PT actuellement) → **fallback transparent sur EN**. Drapeau 🇬🇧 + contenu anglais. Modèle identique à l'Ex 2.

L'Ex 1 (`Alphabet.jsx`) et l'Ex 2 (`AlphabetEcoute.jsx`) n'ont **pas été touchés**.

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/pages/AlphabetChanson.jsx` | 10 changements ponctuels : imports, constantes, fonctions utilitaires, état, useEffects, handlers, rendu |

Aucun autre fichier touché. Aucune dépendance. Aucune migration BDD.

---

## 🔧 Détail des changements

### 1. Imports

```diff
-import { useEffect, useState } from 'react'
+import { useEffect, useMemo, useState } from 'react'
 import { useNavigate } from 'react-router-dom'
-import { getLangueByCode } from '../utils/languages'
+import { getLangueActive, getLangueByCode } from '../utils/languages'
 import Neuri3D from '../components/Neuri3D'
```

### 2. Constante `COUPLETS` → `COUPLETS_PAR_LANGUE`

Les 7 couplets EN deviennent une entrée d'un objet indexé par code langue, avec 8 couplets ES ajoutés :

```js
const COUPLETS_PAR_LANGUE = {
  en: [
    ['A','B','C','D','E','F','G'],
    ['H','I','J','K'],
    ['L','M','N','O','P'],
    ['Q','R','S'],
    ['T','U','V'],
    ['W','X'],
    ['Y','Z'],
  ],
  es: [
    ['A','B','C','D'],
    ['E','F','G'],
    ['H','I','J','K'],
    ['L','M','N','Ñ'],
    ['O','P','Q'],
    ['R','S','T'],
    ['U','V','W'],
    ['X','Y','Z'],
  ],
}
```

Les constantes globales `LETTRES` et `NB_LETTRES` sont **supprimées** : elles dépendent de la langue donc deviennent des variables locales au composant.

### 3. Fonctions utilitaires — paramètre `couplets`

```diff
-function getPosition(lettreIndex) { ...  COUPLETS  ... }
+function getPosition(couplets, lettreIndex) { ...  couplets  ... }

-function getLettreIndexDebutCouplet(coupletIndex) { ...  COUPLETS  ... }
+function getLettreIndexDebutCouplet(couplets, coupletIndex) { ...  couplets  ... }
```

Restent pures, testables, hors composant.

### 4. État `codeLangue` figé au mount + variables dérivées avec `useMemo`

```js
const [codeLangue] = useState(() => {
  const demandee = getLangueActive()
  return COUPLETS_PAR_LANGUE[demandee] ? demandee : 'en'
})
const langue = getLangueByCode(codeLangue)

// useMemo pour stabiliser les références entre renders → évite que le
// useEffect TTS auto se ré-exécute en boucle.
const couplets = useMemo(() => COUPLETS_PAR_LANGUE[codeLangue], [codeLangue])
const lettres = useMemo(() => couplets.flat(), [couplets])
const nbLettres = lettres.length
```

`nbLettres` n'a pas besoin de `useMemo` (primitif, stable par valeur). `couplets` et `lettres` en ont besoin sinon le useEffect TTS auto (qui les a dans ses deps) boucle à chaque render.

### 5. `useEffect` chargement voix — généralisé

```diff
-const langExact = TTS_MAP.en
+const langExact = TTS_MAP[codeLangue] || 'en-US'
 let trouvee = liste.find((v) => v.lang === langExact)
 if (!trouvee) {
-  trouvee = liste.find((v) => v.lang.toLowerCase().startsWith('en'))
+  trouvee = liste.find((v) => v.lang.toLowerCase().startsWith(codeLangue))
 }
 ...
-}, [])
+}, [codeLangue])
```

### 6. `useEffect` défilement TTS auto

```diff
-if (lettreIndex >= NB_LETTRES) return
-if (voix) playLetter(LETTRES[lettreIndex], 'en', voix)
+if (lettreIndex >= nbLettres) return
+if (voix) playLetter(lettres[lettreIndex], codeLangue, voix)
 ...
-}, [isPlaying, lettreIndex, voix])
+}, [isPlaying, lettreIndex, voix, codeLangue, lettres, nbLettres])
```

### 7. Handlers Précédent/Suivant/Répéter

Tous reçoivent maintenant `couplets` aux fonctions utilitaires :

```diff
- const { coupletIndex } = getPosition(lettreIndex)
+ const { coupletIndex } = getPosition(couplets, lettreIndex)

- setLettreIndex(getLettreIndexDebutCouplet(coupletIndex - 1))
+ setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex - 1))

- if (coupletIndex >= COUPLETS.length - 1) return
+ if (coupletIndex >= couplets.length - 1) return
```

### 8. Rendu — variables locales + renommage `couplet → coupletCourant`

```diff
-const { coupletIndex, indexDansCouplet } = getPosition(Math.min(lettreIndex, NB_LETTRES - 1))
-const couplet = COUPLETS[coupletIndex]
+const { coupletIndex, indexDansCouplet } = getPosition(couplets, Math.min(lettreIndex, nbLettres - 1))
+const coupletCourant = couplets[coupletIndex]

-const totalSec = Math.round((NB_LETTRES * DUREE_PAR_LETTRE_MS) / 1000)
+const totalSec = Math.round((nbLettres * DUREE_PAR_LETTRE_MS) / 1000)

-const progression = (lettreIndex / NB_LETTRES) * 100
+const progression = (lettreIndex / nbLettres) * 100

-const peutAvancer = coupletIndex < COUPLETS.length - 1
+const peutAvancer = coupletIndex < couplets.length - 1
```

Dans le JSX : les 2 `{couplet.map(...)}` (couplet en gros + ligne de cadres) sont devenus `{coupletCourant.map(...)}`.

### 9. `termine` dérivé avec `nbLettres`

```diff
-const termine = lettreIndex >= NB_LETTRES
+const termine = lettreIndex >= nbLettres
```

### 10. Vérification — aucune référence orpheline

```bash
grep "\\bCOUPLETS\\b\|\\bLETTRES\\b\|\\bNB_LETTRES\\b" AlphabetChanson.jsx
# → 0 résultats
```

Toutes les occurrences pointent maintenant vers `couplets` / `lettres` / `nbLettres` (variables locales) ou `COUPLETS_PAR_LANGUE` (objet global).

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur `AlphabetChanson.jsx`. Les deps des `useEffect` sont satisfaites (`codeLangue`, `lettres`, `nbLettres` ajoutés là où nécessaire).
- [x] **Aucune référence orpheline** aux anciennes constantes globales (`COUPLETS`, `LETTRES`, `NB_LETTRES`)
- [x] **`useMemo`** stabilise les références de `couplets` et `lettres` → pas de boucle infinie du useEffect TTS auto
- [x] **`EcranFin` sous-composant non touché** (ne dépend pas de la langue)
- [x] **L'Ex 1 et l'Ex 2 non touchés**
- [x] **Le commentaire TODO MP3 Suno** est toujours en place pour faciliter la migration future

---

## 🧪 À tester (Wells)

### Test EN (régression)
1. `npm run dev`, langue active = anglais
2. `/alphabet/chanson`
3. ✔ Drapeau 🇬🇧 dans le header
4. ✔ Couplet en gros `A B C D E F G`, A en violet
5. ✔ Timer 00:00 / 00:26
6. ✔ Tap Play → défilement 1s/lettre avec voix en-US
7. ✔ Précédent / Suivant / Répéter le couplet : OK comme avant
8. ✔ Écran de fin "Bravo" + carte 🌟 Révision terminée 🌟

### Test ES (nouveau)
1. Basculer langue active = espagnol
2. `/alphabet/chanson`
3. ✔ Drapeau 🇪🇸 dans le header
4. ✔ Premier couplet = `A B C D` (4 lettres), A en violet
5. ✔ Timer 00:00 / 00:27
6. ✔ Tap Play → défilement avec voix es-ES
7. ✔ Au lettreIndex 11 → couplet `L M N Ñ`, Ñ s'affiche correctement
8. ✔ Voix prononce "eñe" sur Ñ
9. ✔ Bouton Précédent désactivé/transparent sur le 1er couplet
10. ✔ Bouton Suivant désactivé sur le dernier couplet `X Y Z`
11. ✔ Couplets ES dans l'ordre : ABCD / EFG / HIJK / LMNÑ / OPQ / RST / UVW / XYZ

### Test fallback DE/PT
1. Basculer langue active = allemand ou portugais
2. `/alphabet/chanson`
3. ✔ Drapeau 🇬🇧 (fallback)
4. ✔ Couplets EN + voix anglaise, pas de crash

### Régression
- ✔ Ex 1 (`/alphabet`) : EN + ES fonctionnels
- ✔ Ex 2 (`/alphabet/ecoute`) : EN + ES fonctionnels

---

## 🔮 Quand DE et PT seront prêts

1. Ajouter une entrée `de:` et `pt:` dans `COUPLETS_PAR_LANGUE` (avec les couplets adaptés à chaque alphabet, ex: DE inclut Ä Ö Ü ß à la fin)
2. Bascule automatique — aucune modif de code logique nécessaire
3. **Cohérence à viser** : remplir aussi `ALPHABET_DATA.de/.pt` dans `src/data/alphabetData.js` pour activer les Ex 1 et 2 dans ces langues en même temps. Sinon : on aurait l'Ex 3 fonctionnel en DE mais les Ex 1/2 toujours en fallback EN → incohérent.

## 🔮 Quand le MP3 Suno arrivera

Le commentaire TODO sur la constante `DUREE_PAR_LETTRE_MS` reste valide. Le useEffect de défilement sera remplacé par une logique `<audio>` HTML5 + timestamps. Tout le reste (state, handlers, rendu) restera identique car il ne dépend que de `lettreIndex`, `isPlaying`, `couplets`. La logique de couplets multi-langues s'intègrera naturellement avec un audio par langue (ex: `audio-en.mp3` / `audio-es.mp3`).
