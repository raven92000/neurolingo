# Plan — Généralisation de l'Ex 3 "Chantons l'alphabet" multi-langues

## 🎯 Objectif

Rendre `src/pages/AlphabetChanson.jsx` capable de chanter l'alphabet dans toutes les langues dont les couplets sont définis. Aujourd'hui : **EN** (26 lettres, 7 couplets) et **ES** (27 lettres avec Ñ, 8 couplets validés par Wells). Demain : DE/PT, par simple ajout d'une entrée dans `COUPLETS_PAR_LANGUE`.

**Fallback** : si la langue active n'a pas de couplets définis → retombe sur EN. Drapeau 🇬🇧 + contenu anglais (cohérent avec ce qui sera joué). Modèle identique à ce qu'on a fait pour l'Ex 2.

L'Ex 1 (`Alphabet.jsx`) et l'Ex 2 (`AlphabetEcoute.jsx`) **ne sont pas touchés** (consigne).

---

## 🎵 Couplets validés par Wells

```js
const COUPLETS_PAR_LANGUE = {
  en: [
    ['A','B','C','D','E','F','G'],   // 7
    ['H','I','J','K'],               // 4
    ['L','M','N','O','P'],           // 5
    ['Q','R','S'],                   // 3
    ['T','U','V'],                   // 3
    ['W','X'],                       // 2
    ['Y','Z'],                       // 2
  ],                                 // = 26 lettres, 7 couplets (inchangé)
  es: [
    ['A','B','C','D'],               // 4
    ['E','F','G'],                   // 3
    ['H','I','J','K'],               // 4
    ['L','M','N','Ñ'],               // 4 — Ñ casé en fin du 4e couplet
    ['O','P','Q'],                   // 3
    ['R','S','T'],                   // 3
    ['U','V','W'],                   // 3
    ['X','Y','Z'],                   // 3
  ],                                 // = 27 lettres, 8 couplets
}
```

---

## 🔍 Audit du code actuel — 7 occurrences à généraliser

```
L12  : const COUPLETS = [...]                                  ← constante globale
L21  : const LETTRES = COUPLETS.flat()                         ← constante globale
L22  : const NB_LETTRES = LETTRES.length                       ← constante globale
L63  : const langue = getLangueByCode('en')                    ← composant
L79  : const langExact = TTS_MAP.en                            ← useEffect voix
L82  : .startsWith('en')                                       ← useEffect voix
L100 : playLetter(LETTRES[lettreIndex], 'en', voix)            ← useEffect TTS auto
```

Plus toutes les références à `COUPLETS`, `LETTRES`, `NB_LETTRES` dans les fonctions utilitaires (`getPosition`, `getLettreIndexDebutCouplet`) et dans le rendu — elles devront pointer vers les variables locales dérivées de `codeLangue`.

---

## 🛠 Modifications proposées

### 1. Import

```diff
-import { getLangueByCode } from '../utils/languages'
+import { getLangueActive, getLangueByCode } from '../utils/languages'
```

### 2. Constante `COUPLETS` → `COUPLETS_PAR_LANGUE` + retrait de `LETTRES` / `NB_LETTRES` globaux

```diff
-const COUPLETS = [...]
-const LETTRES = COUPLETS.flat()
-const NB_LETTRES = LETTRES.length
+const COUPLETS_PAR_LANGUE = {
+  en: [...],
+  es: [...],
+}
```

Les `LETTRES` et `NB_LETTRES` ne peuvent plus être des constantes globales puisqu'ils dépendent de la langue. Ils deviennent des **variables locales calculées à chaque render** dans le composant (recalcul `.flat()` négligeable, ≈30 µs sur 27 éléments).

### 3. Fonctions utilitaires `getPosition` / `getLettreIndexDebutCouplet` — paramètre `couplets`

Choix : option A — passer `couplets` en argument (fonctions pures, hors composant).

```diff
-function getPosition(lettreIndex) {
+function getPosition(couplets, lettreIndex) {
   let restant = lettreIndex
-  for (let i = 0; i < COUPLETS.length; i++) {
-    if (restant < COUPLETS[i].length) return { coupletIndex: i, indexDansCouplet: restant }
-    restant -= COUPLETS[i].length
+  for (let i = 0; i < couplets.length; i++) {
+    if (restant < couplets[i].length) return { coupletIndex: i, indexDansCouplet: restant }
+    restant -= couplets[i].length
   }
   return {
-    coupletIndex: COUPLETS.length - 1,
-    indexDansCouplet: COUPLETS[COUPLETS.length - 1].length - 1,
+    coupletIndex: couplets.length - 1,
+    indexDansCouplet: couplets[couplets.length - 1].length - 1,
   }
 }

-function getLettreIndexDebutCouplet(coupletIndex) {
+function getLettreIndexDebutCouplet(couplets, coupletIndex) {
   let total = 0
-  for (let i = 0; i < coupletIndex; i++) total += COUPLETS[i].length
+  for (let i = 0; i < coupletIndex; i++) total += couplets[i].length
   return total
 }
```

### 4. État `codeLangue` figé au mount + variables locales dérivées

```js
export default function AlphabetChanson() {
  const navigate = useNavigate()

  // Langue figée au mount : changement de langue → sortir/revenir.
  // Fallback sur 'en' si pas de couplets définis pour la langue active.
  const [codeLangue] = useState(() => {
    const demandee = getLangueActive()
    return COUPLETS_PAR_LANGUE[demandee] ? demandee : 'en'
  })
  const langue = getLangueByCode(codeLangue)

  const couplets = COUPLETS_PAR_LANGUE[codeLangue]
  const lettres = couplets.flat()
  const nbLettres = lettres.length
  // ...
}
```

### 5. Adapter `useEffect` de chargement de voix

```diff
 function chargerVoix() {
   const liste = window.speechSynthesis.getVoices()
-  const langExact = TTS_MAP.en
+  const langExact = TTS_MAP[codeLangue] || 'en-US'
   let trouvee = liste.find((v) => v.lang === langExact)
   if (!trouvee) {
-    trouvee = liste.find((v) => v.lang.toLowerCase().startsWith('en'))
+    trouvee = liste.find((v) => v.lang.toLowerCase().startsWith(codeLangue))
   }
   if (trouvee) setVoix(trouvee)
 }
 ...
-}, [])
+}, [codeLangue])
```

### 6. Adapter `useEffect` de défilement TTS auto

```diff
 useEffect(() => {
   if (!isPlaying) return
-  if (lettreIndex >= NB_LETTRES) return
-  if (voix) playLetter(LETTRES[lettreIndex], 'en', voix)
+  if (lettreIndex >= nbLettres) return
+  if (voix) playLetter(lettres[lettreIndex], codeLangue, voix)
   const t = setTimeout(() => {
     setLettreIndex((prev) => prev + 1)
   }, DUREE_PAR_LETTRE_MS)
   return () => clearTimeout(t)
-}, [isPlaying, lettreIndex, voix])
+}, [isPlaying, lettreIndex, voix, codeLangue, lettres, nbLettres])
```

**Note importante sur les deps** : `lettres` et `nbLettres` sont recalculés à chaque render. Comme `codeLangue` est figé en state, le résultat de `couplets.flat()` est stable en valeur mais **pas en référence** (nouvelle référence à chaque render). ESLint demandera de les ajouter aux deps. Ça déclenchera le useEffect à chaque render → bug de boucle infinie potentiel.

**Solution** : utiliser `useMemo` pour stabiliser les références :

```js
const couplets = useMemo(() => COUPLETS_PAR_LANGUE[codeLangue], [codeLangue])
const lettres = useMemo(() => couplets.flat(), [couplets])
const nbLettres = lettres.length
```

`nbLettres` est un nombre primitif → stable par valeur, pas besoin de useMemo. Avec ces `useMemo`, les références sont stables tant que `codeLangue` ne change pas (jamais après le mount) → pas de boucle.

### 7. Adapter handlers Précédent/Suivant/Répéter

Passer `couplets` aux fonctions utilitaires :

```diff
 function coupletPrecedent() {
-  const { coupletIndex } = getPosition(lettreIndex)
+  const { coupletIndex } = getPosition(couplets, lettreIndex)
   if (coupletIndex === 0) return
-  setLettreIndex(getLettreIndexDebutCouplet(coupletIndex - 1))
+  setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex - 1))
 }

 function coupletSuivant() {
-  const { coupletIndex } = getPosition(lettreIndex)
-  if (coupletIndex >= COUPLETS.length - 1) return
-  setLettreIndex(getLettreIndexDebutCouplet(coupletIndex + 1))
+  const { coupletIndex } = getPosition(couplets, lettreIndex)
+  if (coupletIndex >= couplets.length - 1) return
+  setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex + 1))
 }

 function repeterCouplet() {
-  const { coupletIndex } = getPosition(lettreIndex)
-  setLettreIndex(getLettreIndexDebutCouplet(coupletIndex))
+  const { coupletIndex } = getPosition(couplets, lettreIndex)
+  setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex))
 }
```

### 8. Adapter le rendu

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

Et dans le JSX où on map sur `couplet` (le couplet courant) : pas de changement, juste utiliser `coupletCourant` au lieu de `couplet` (renommage local pour éviter la collision avec la variable `couplets` plurielle qui désigne le tableau de tous les couplets).

### 9. `termine` calculé avec `nbLettres`

```diff
-const termine = lettreIndex >= NB_LETTRES
+const termine = lettreIndex >= nbLettres
```

### 10. Affichage de Ñ

Visuellement, **aucune adaptation nécessaire** :
- La lettre Ñ s'affiche correctement avec la police Nunito 900 à 36px (couplet en gros) et 13px (cadres carrés).
- Les couplets ES contiennent au max 4 lettres (`L M N Ñ`), comme `H I J K` en EN → même densité visuelle, gap inchangé.
- Pas besoin de modifier `gap: 12px` ni `gap: 6px`.

À voir au test visuel. Si l'écart est gênant en ES, j'ajusterai à postériori.

---

## 📊 Récapitulatif des 10 changements

| # | Ce qui change |
|---|---|
| 1 | Import `getLangueActive` |
| 2 | `COUPLETS` → `COUPLETS_PAR_LANGUE`, retrait `LETTRES` / `NB_LETTRES` globaux |
| 3 | `getPosition` et `getLettreIndexDebutCouplet` acceptent `couplets` en param |
| 4 | État `codeLangue` figé au mount + dérivation `langue`, `couplets`, `lettres`, `nbLettres` (avec `useMemo`) |
| 5 | useEffect chargement voix : `TTS_MAP[codeLangue]` + `startsWith(codeLangue)` + dep |
| 6 | useEffect défilement TTS : `playLetter(lettres[lettreIndex], codeLangue, voix)` + utilise `nbLettres` + deps |
| 7 | Handlers Précédent/Suivant/Répéter : passent `couplets` aux fonctions utilitaires |
| 8 | Rendu : `couplets`, `lettres`, `nbLettres` au lieu des constantes globales |
| 9 | `termine` calculé avec `nbLettres` |
| 10 | Renommage local `couplet` → `coupletCourant` pour éviter collision avec `couplets` (tableau de tous) |

---

## ⚠️ Points d'attention

### A. `useMemo` pour stabiliser les références
Indispensable pour éviter une boucle infinie du useEffect TTS auto (qui dépend de `lettres` et `nbLettres`). Sans `useMemo`, à chaque render, `couplets.flat()` produit une nouvelle référence → ESLint demande les deps → boucle.

### B. Timer ES 27 secondes au lieu de 26
`nbLettres * DUREE_PAR_LETTRE_MS / 1000` = 27 secondes en ES. Affichage "00:00 / 00:27". Pas de souci, juste 1s de plus.

### C. Fallback DE/PT
Drapeau 🇬🇧 + couplets EN. Identique à ce qu'on a fait pour l'Ex 2.

### D. Voix Ñ
Le TTS espagnol prononce "Ñ" comme "eñe" (un peu d'1.2s, légèrement plus long que les autres lettres). Avec `DUREE_PAR_LETTRE_MS = 1000` on coupera la fin de la lecture si on enchaîne. Acceptable comme on l'a déjà accepté pour "W" en anglais ("double-u"). Le MP3 Suno final résoudra ça avec un timing musical précis.

### E. Lecture du caractère Ñ par TTS
`playLetter` utilise `letter.toLowerCase()` → `'ñ'`. Selon les moteurs TTS, certains pourraient avoir du mal avec ce caractère seul. Tests réels nécessaires (Mac Samantha/Mónica, Chrome Android).

### F. Rendu visuel ES — vérification UI
- Couplet en gros (36px) avec une seule Ñ : le diacritique fait ~10% de hauteur en plus, normalement pas de souci de cadrage
- Ligne de cadres carrés (32×32) : la Ñ peut sembler un peu plus haute, mais le `display: flex; alignItems: center` du div la centrera. À vérifier au visuel.

---

## 🧪 Plan de test (après application)

### Test EN (régression)
1. Langue active = anglais (par défaut)
2. `/alphabet/chanson`
3. ✔ Drapeau 🇬🇧, titre "Chantons l'alphabet"
4. ✔ Couplet en gros `A B C D E F G`, première A en violet
5. ✔ Timer 00:00 / 00:26
6. ✔ Play : défilement à 1s/lettre, voix en-US
7. ✔ Précédent/Suivant/Répéter le couplet : OK comme avant
8. ✔ Écran de fin "Bravo" inchangé

### Test ES (nouveau)
1. Basculer la langue active sur Espagnol
2. `/alphabet/chanson`
3. ✔ Drapeau 🇪🇸 dans le header
4. ✔ Premier couplet en gros = `A B C D` (4 lettres, pas 7), A en violet
5. ✔ Timer 00:00 / 00:27 (27 secondes)
6. ✔ Play : défilement à 1s/lettre, voix es-ES
7. ✔ Au tick 11 : on est sur Ñ dans le couplet `L M N Ñ`
8. ✔ Affichage de Ñ correct (gros + cadre)
9. ✔ Voix prononce "eñe"
10. ✔ Bouton Précédent au couplet 1 (`A B C D`) : désactivé/transparent
11. ✔ Bouton Suivant au dernier couplet (`X Y Z`) : désactivé/transparent
12. ✔ Répéter le couplet pendant le 4e couplet : revient à L

### Test DE/PT (fallback)
1. Basculer en allemand ou portugais
2. `/alphabet/chanson`
3. ✔ Drapeau 🇬🇧 dans le header (fallback)
4. ✔ Couplets et timer EN (26 secondes)

### Régression
- ✔ Ex 1 (`/alphabet`) toujours fonctionnel
- ✔ Ex 2 (`/alphabet/ecoute`) toujours fonctionnel (déjà multilingue)

---

## ❓ Questions à valider avant exécution

1. **Stabilisation des références via `useMemo`** pour `couplets` et `lettres` (nécessaire pour éviter une boucle infinie sur le useEffect TTS auto qui doit avoir `lettres`/`nbLettres` dans ses deps) → OK ?

2. **Fonctions utilitaires `getPosition` / `getLettreIndexDebutCouplet` reçoivent `couplets` en param** (option A — pures, hors composant) plutôt qu'en closure interne (option B) → OK ?

3. **Renommage local `couplet` → `coupletCourant`** (pour éviter collision avec `couplets` qui désigne maintenant le tableau de tous les couplets) → OK ?

4. **Pas d'ajustement du `gap` entre lettres pour le rendu ES** (je laisse les valeurs actuelles, on ajuste a posteriori si gênant) → OK ?

Si OK, j'applique.
