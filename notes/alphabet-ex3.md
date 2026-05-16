# Rapport — Exercice 3 "Chantons l'alphabet" (Alphabet)

## ✅ Résultat

L'Exercice 3 est en place sur la route `/alphabet/chanson`. L'enfant écoute la chanson alphabet (couplets ABCDEFG / HIJK / LMNOP / QRS / TUV / WX / YZ) avec Neuri qui chante en TTS anglais (1 lettre / seconde, prêt à être remplacé par un MP3 Suno). Les lettres défilent visuellement : couplet en gros au centre avec la lettre courante en violet, ligne de cadres carrés en dessous, forme d'onde décorative qui pulse.

L'Ex 1 (`/alphabet`) et l'Ex 2 (`/alphabet/ecoute`) restent **fonctionnels**, on a ajouté les boutons de navigation vers l'Ex 3.

## 📁 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/AlphabetChanson.jsx` | **Créé** — composant principal + écran de fin |
| `src/App.jsx` | **Modif** — 1 import `AlphabetChanson` + 1 route `/alphabet/chanson` |
| `src/pages/Alphabet.jsx` | **Modif** — 2ème bouton "🎵 Exercice 3" sous le bouton "🎧 Exercice 2" |
| `src/pages/AlphabetEcoute.jsx` | **Modif** — 3ème bouton "🎵 Exercice suivant" inséré dans `EcranFin` entre Retour et Rejouer (nouvelle prop `onExerciceSuivant`) |

Aucune autre modification. Aucune dépendance. Aucune migration BDD.

---

## 🔧 Détail de l'implémentation

### Architecture state — un seul `lettreIndex`

Comme validé, **un seul état `lettreIndex` (0-25)** + dérivation à chaque render :
```js
const { coupletIndex, indexDansCouplet } = getPosition(lettreIndex)
```

`coupletIndex` et `indexDansCouplet` ne sont **pas** des states séparés → une seule source de vérité, impossible de désynchroniser.

### États React

| State | Type | Init | Rôle |
|---|---|---|---|
| `lettreIndex` | `number` | `0` | Position globale 0-25 (source de vérité unique) |
| `isPlaying` | `boolean` | `false` | True quand la chanson est en cours |
| `voix` | `SpeechSynthesisVoice \| null` | `null` | Voix anglaise sélectionnée |

**Note importante** : `termine` n'est **pas** un state mais un dérivé :
```js
const termine = lettreIndex >= NB_LETTRES
```

Ce choix vient d'une contrainte du linter React Compiler qui interdit les `setState` synchrones dans un `useEffect` (anti-pattern "cascading renders"). Le dérivé évite tout `setState` de fin de chanson dans le useEffect.

### Constantes

```js
const DUREE_PAR_LETTRE_MS = 1000
const COUPLETS = [
  ['A','B','C','D','E','F','G'],
  ['H','I','J','K'],
  ['L','M','N','O','P'],
  ['Q','R','S'],
  ['T','U','V'],
  ['W','X'],
  ['Y','Z'],
]
const LETTRES = COUPLETS.flat()  // 26 lettres
const NB_LETTRES = 26
```

### Logique de défilement (TTS, mode temporaire)

```js
// TODO: Remplacer par lecture MP3 Suno + timestamps par lettre quand l'audio sera prêt.
useEffect(() => {
  if (!isPlaying) return
  if (lettreIndex >= NB_LETTRES) return
  if (voix) playLetter(LETTRES[lettreIndex], 'en', voix)
  const t = setTimeout(() => {
    setLettreIndex((prev) => prev + 1)
  }, DUREE_PAR_LETTRE_MS)
  return () => clearTimeout(t)
}, [isPlaying, lettreIndex, voix])
```

**Fonctionnement** :
- Au Play : useEffect tourne → lit immédiatement la lettre courante + programme un `setTimeout(+1)`
- Toutes les 1000ms : `setLettreIndex` incrémente → useEffect re-tourne → lit la nouvelle lettre + reprogramme
- Pause : `isPlaying=false` → early return + cleanup du timeout
- Reprise : la lettre courante est relue (volontaire, aide à reprendre le fil)
- Fin atteinte (`lettreIndex >= 26`) : early return, `termine` dérivé devient `true`, l'écran de fin s'affiche

### Helpers

```js
function getPosition(lettreIndex) {
  let restant = lettreIndex
  for (let i = 0; i < COUPLETS.length; i++) {
    if (restant < COUPLETS[i].length) return { coupletIndex: i, indexDansCouplet: restant }
    restant -= COUPLETS[i].length
  }
  return { coupletIndex: COUPLETS.length - 1, indexDansCouplet: COUPLETS.at(-1).length - 1 }
}

function getLettreIndexDebutCouplet(coupletIndex) {
  let total = 0
  for (let i = 0; i < coupletIndex; i++) total += COUPLETS[i].length
  return total
}

function formatTemps(secondes) {
  const m = Math.floor(secondes / 60).toString().padStart(2, '0')
  const s = (secondes % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
```

### Handlers player

- **Play/Pause** : `togglePlay()` toggle `isPlaying`. Si `termine`, fait `setLettreIndex(0) + setIsPlaying(true)` (rejouer depuis le début).
- **Précédent** : `setLettreIndex(getLettreIndexDebutCouplet(coupletIndex - 1))`. Garde au couplet 0.
- **Suivant** : idem `coupletIndex + 1`. Garde au dernier couplet.
- **Répéter le couplet** : `setLettreIndex(getLettreIndexDebutCouplet(coupletIndex))`.

Tous les handlers modifient juste `lettreIndex` → le useEffect prend le relais.

### UI

- **Header** : bouton retour vers `/alphabet` + badge "FONDAMENTAUX" + titre "Chantons l'alphabet"
- **Bandeau progression** : "Progression" + timer "00:12 / 00:26" + barre violette `linear-gradient` avec `transition: 'width 1s linear'` pour avancée fluide
- **Neuri 3D 90×90** (couleur `#8B5CF6`) + bulle "Chante avec moi ! Appuie sur pause pour répéter. 🎤"
  - Décision validée : **pas d'emoji 🎧 overlay** sur Neuri. Wells remplacera plus tard par une image Neuri avec un vrai casque.
- **Couplet en gros** : `font-size 36px`, Nunito 900, lettre courante en `#A78BFA`, autres lettres `rgba(255,255,255,0.6)`. `flex-wrap` au cas où.
- **Ligne de cadres carrés** 32×32 : lettre courante avec bordure violette plus visible (`2px solid rgba(139,92,246,0.6)`), autres en bordure neutre
- **Forme d'onde décorative** : 7 barres verticales 3×24 qui pulsent en hauteur via `@keyframes pulseWave` (animation-delay décalé de 0.1s par barre). Purement décoratif, ne dépend pas du state.
- **Boutons player** : Précédent (40×40 rond violet pâle) / Play-Pause central (60×60 rond violet gradient) / Suivant (40×40) — avec icônes SVG inline (pas d'emojis)
  - Précédent/Suivant : `opacity: 0.3` + `disabled` aux extrémités (validé)
  - Play-Pause : animation `scale(0.95)` au mousedown
- **Bouton "🔁 Répéter le couplet"** : pastille violet pâle en bas à droite (`alignSelf: 'flex-end'`)

### Écran de fin

```jsx
function EcranFin({ onRetour, onRejouer })
```

Style cohérent avec celui de l'Ex 2 :
- Fond `radial-gradient` vert clair
- Cercle vert + coche SVG
- Titre "Bravo ! 🎉" + sous-titre "Tu connais bien l'alphabet maintenant !"
- **Carte spéciale violette** : `🌟 Révision de l'alphabet terminée 🌟` (texte 15px Nunito 800, couleur `#C4B5FD`, fond `rgba(139,92,246,0.12)`)
- Bouton principal vert "Retour à l'apprentissage" → `/learn`
- Bouton secondaire violet pâle "Rejouer" → `rejouerChanson()` qui revient à `lettreIndex=0` + `isPlaying=true`

### Modifs des fichiers existants

**`App.jsx`** : 1 import + 1 route — 2 lignes ajoutées, rien d'autre.

**`Alphabet.jsx`** : 1 bouton ajouté juste après le bouton Ex 2, avec `marginTop: 12px` (au lieu de 20px) pour resserrer entre les deux boutons. Style identique au bouton Ex 2.

**`AlphabetEcoute.jsx`** :
- Signature `EcranFin` : ajout de la prop `onExerciceSuivant`
- Appel `<EcranFin ...>` : ajout de `onExerciceSuivant={() => navigate('/alphabet/chanson')}`
- Insertion du bouton "🎵 Exercice suivant : Chantons l'alphabet" **entre** Retour et Rejouer (style violet gradient, hauteur 48px, marginBottom 12px)

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur les 4 fichiers touchés
- [x] **Note technique** : le linter React Compiler interdit les `setState` synchrones dans un `useEffect` → refacto initial : `termine` passé de state à dérivé de `lettreIndex`. Code plus simple, une seule source de vérité.
- [x] **Imports propres** : pas d'imports inutilisés
- [x] **Pas de `console.log`** oublié
- [x] **Aucune migration BDD**, aucun appel Supabase
- [x] **DA respectée** : fond `#090E1A`, glow violet, cartes arrondies, mobile-first 430px, écran de fin avec radial vert + cercle vert
- [x] **Ex 1 et Ex 2 strictement intacts** sauf les ajouts de boutons de navigation
- [x] **Préparation MP3** : constante `DUREE_PAR_LETTRE_MS = 1000` + 2 commentaires `// TODO: Remplacer par lecture MP3 Suno...` (un sur la constante, un sur le useEffect de défilement)

---

## 🧪 À tester (Wells)

1. `npm run dev`
2. Naviguer sur `/alphabet` → vérifier qu'il y a maintenant **2 boutons** sous la grille : "🎧 Exercice 2" puis "🎵 Exercice 3"
3. Cliquer sur "🎵 Exercice 3" → arrive sur `/alphabet/chanson`
4. **Player** :
   - ✔ Header + bandeau progression "00:00 / 00:26" + barre violette à 0
   - ✔ Neuri 3D à gauche (90×90) + bulle "Chante avec moi !"
   - ✔ Couplet `A B C D E F G` en gros, première lettre A en violet
   - ✔ Cadres carrés en dessous, cadre A plus visible
   - ✔ Forme d'onde qui pulse en bas
   - ✔ Bouton Précédent désactivé (transparent) car coupletIndex=0
5. **Tap Play** :
   - ✔ "A" se lit immédiatement (anglais), puis B, C, D... à 1 sec d'intervalle
   - ✔ Lettre courante change de couleur en violet, autres redeviennent blanc 60%
   - ✔ Quand on passe de "G" à "H" : le couplet change à `H I J K`
   - ✔ Barre progression s'anime fluide, timer avance
   - ✔ Bouton Précédent redevient actif après le 1er couplet
6. **Tap Pause** pendant une lettre : lecture stoppe, état figé sur la lettre courante
7. **Tap Play à nouveau** : la lettre courante est **relue** (consigne validée), puis enchaîne
8. **Tap Suivant** au couplet 2 → saute au début du couplet 3
9. **Tap Précédent** → revient au couplet précédent
10. **Tap "🔁 Répéter le couplet"** au milieu d'un couplet → revient à sa 1ère lettre
11. **Bouton Suivant au dernier couplet (Y Z)** : désactivé, transparent
12. Lecture jusqu'à Z → écran "Bravo" avec carte "🌟 Révision de l'alphabet terminée 🌟"
13. **Tap Rejouer** → revient au début, possible de relancer
14. **Tap Retour à l'apprentissage** → `/learn`
15. **Régression Ex 2** : aller sur `/alphabet/ecoute`, faire les 10 questions, arriver sur l'écran de fin
16. Voir le **3ème bouton "🎵 Exercice suivant : Chantons l'alphabet"** entre Retour et Rejouer → tap → arrive sur `/alphabet/chanson` ✔
17. **Régression Ex 1** : revenir sur `/alphabet`, tester carte "A" → toujours "ay" propre

---

## 🔮 Quand le MP3 Suno sera prêt

Le code est prêt à recevoir un fichier audio. Marche à suivre :

1. Uploader le MP3 dans `public/audio/alphabet-en.mp3` (ou Supabase Storage)
2. Remplacer le `useEffect` de défilement par une logique `<audio>` HTML5 avec timestamps :

```js
// Tableau des timestamps de chaque lettre dans le MP3 (à mesurer une fois)
const TIMESTAMPS_MP3 = [0, 0.8, 1.6, 2.5, 3.3, 4.1, 5.0, /* ... 26 valeurs */]

const audioRef = useRef(null)

useEffect(() => {
  if (!isPlaying || lettreIndex >= NB_LETTRES) return
  const audio = audioRef.current
  audio.currentTime = TIMESTAMPS_MP3[lettreIndex]
  audio.play()
  // Détecter quand on atteint la lettre suivante via timeupdate
  const onTimeUpdate = () => {
    if (audio.currentTime >= TIMESTAMPS_MP3[lettreIndex + 1]) {
      setLettreIndex((prev) => prev + 1)
    }
  }
  audio.addEventListener('timeupdate', onTimeUpdate)
  return () => audio.removeEventListener('timeupdate', onTimeUpdate)
}, [isPlaying, lettreIndex])
```

3. Retirer `playLetter()`, `voix`, le `useEffect` de chargement de voix, et `DUREE_PAR_LETTRE_MS`
4. Tout le reste (handlers, UI, écran de fin) reste **identique** car la logique de UI ne dépend que de `lettreIndex` et `isPlaying`.

---

## 🔧 Évolutions possibles (hors scope)

- Image Neuri avec un vrai casque (sur la page Ex 3, à la place du Neuri3D actuel)
- Karaoke style : surligner la syllabe en cours dans le mot lu
- Indication visuelle "vous chantez !" si on détecte le micro de l'utilisateur (Web Audio API analyser)
- Bouton "Mode lent" pour passer DUREE_PAR_LETTRE_MS à 1500ms
- Ajout d'XP en fin de partie (cohérent avec les chapitres normaux)
