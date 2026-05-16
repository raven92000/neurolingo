# Plan — Exercice 2 "Écoute et choisis" (Alphabet)

## 🎯 Objectif

Ajouter un **Exercice 2** sur la route `/alphabet/ecoute` :
- 10 questions générées au hasard parmi les 26 lettres anglaises
- À chaque question : TTS lit la lettre → 3 cartes-lettres → l'enfant tape la bonne
- Feedback couleur + son (Web Audio API) immédiat
- Écran de fin "Bravo" avec score (style cohérent avec `Lesson.jsx`)

L'Ex 1 actuel (`/alphabet`) reste **strictement intact**, on ajoute juste un bouton vers l'Ex 2 en bas de page.

---

## 📐 Maquette ASCII

### Page d'exercice

```
┌──────────────────────────────────────────┐
│ ←   🇬🇧 FONDAMENTAUX                      │
│     Écoute et choisis                     │
├──────────────────────────────────────────┤
│  Score : 3              4 / 10            │
│  ▓▓▓▓░░░░░░  ← barre violette 40%         │
├──────────────────────────────────────────┤
│  💬 Écoute bien le son…                   │
│     Tu vas y arriver ! 💪                 │
├──────────────────────────────────────────┤
│                                           │
│            ┌─────────┐                    │
│            │   🔊    │  ← gros bouton    │
│            │  rond   │     violet        │
│            └─────────┘                    │
│                                           │
│      Quelle lettre as-tu entendue ?       │
│                                           │
├──────────────────────────────────────────┤
│   ┌────────┐ ┌────────┐ ┌────────┐        │
│   │        │ │        │ │        │        │
│   │   F    │ │   A    │ │   K    │        │
│   │        │ │        │ │        │        │
│   └────────┘ └────────┘ └────────┘        │
└──────────────────────────────────────────┘
```

### Écran de fin (cohérent avec `Lesson.jsx`)

```
┌──────────────────────────────────────────┐
│                                           │
│             ┌──────┐                      │
│             │  ✓   │  ← cercle vert      │
│             └──────┘                      │
│                                           │
│            Bravo ! 🎉                     │
│      Tu as bien écouté l'alphabet         │
│                                           │
│   ┌─────────────┐    ┌─────────────┐      │
│   │     8       │    │    80 %     │      │
│   │   Score     │    │   Réussite  │      │
│   └─────────────┘    └─────────────┘      │
│                                           │
│   ┌─────────────────────────────────┐     │
│   │   Retour à l'apprentissage      │     │
│   └─────────────────────────────────┘     │
│                                           │
│   ┌─────────────────────────────────┐     │
│   │       Rejouer                    │     │
│   └─────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

Style repris de `Lesson.jsx:359-389` : fond `radial-gradient` vert clair en haut sur `#090E1A`, cercle vert avec coche (80×80, `rgba(88,204,2,0.15)`, border-radius 24), titre 28px 900, 2 cartes stats côte à côte, bouton gradient `linear-gradient(135deg, #58CC02, #3DAD00)`.

Bouton secondaire "Rejouer" en plus du bouton principal "Retour à l'apprentissage" (utile pour les enfants qui veulent recommencer).

---

## 📁 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/AlphabetEcoute.jsx` | **Créer** — composant principal de l'exercice |
| `src/App.jsx` | **Modif** — 1 import + 1 route `/alphabet/ecoute` |
| `src/pages/Alphabet.jsx` | **Modif** — bouton vers `/alphabet/ecoute` sous la grille |

Aucune autre modification. Aucune dépendance. Aucune migration. Aucun fichier supprimé.

---

## 🎮 Logique de jeu détaillée

### Architecture — pré-calcul de la partie au montage

Pour éviter tout problème de **re-render qui rebattrait les distracteurs** au milieu d'une question (bug classique), on pré-calcule **toute la partie en une fois** au montage : un tableau de 10 objets `{ lettre, cartes }` où `cartes` est l'ordre figé des 3 boutons affichés.

```js
function genererPartie() {
  const toutesLesLettres = ALPHABET_DATA.en.map(item => item.lettre)
  // 1. 10 lettres cibles sans répétition
  const cibles = shuffle(toutesLesLettres).slice(0, 10)
  // 2. Pour chaque cible, 2 distracteurs uniques + mélange
  return cibles.map(lettre => {
    const candidatsDistracteurs = toutesLesLettres.filter(l => l !== lettre)
    const distracteurs = shuffle(candidatsDistracteurs).slice(0, 2)
    const cartes = shuffle([lettre, ...distracteurs])
    return { lettre, cartes }
  })
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// State initialisé en lazy (s'exécute UNE FOIS au montage)
const [partie] = useState(genererPartie)
```

### State

| State | Type | Init | Rôle |
|---|---|---|---|
| `partie` | `Array<{lettre, cartes}>` | `genererPartie()` (lazy) | Les 10 questions pré-calculées |
| `questionActuelle` | `number` | `0` | Index de la question en cours (0-9) |
| `score` | `number` | `0` | Bonnes réponses |
| `feedback` | `'idle' \| 'ok' \| 'nok'` | `'idle'` | Phase d'animation/feedback |
| `lettreChoisie` | `string \| null` | `null` | Pour colorer la carte tapée pendant le feedback |
| `voix` | `SpeechSynthesisVoice \| null` | `null` | Voix anglaise (dupliquée depuis Alphabet.jsx) |
| `termine` | `boolean` | `false` | True après la question 10 → affiche l'écran de fin |

### Flux d'une question

```
[question N affichée] 
   ↓ useEffect [questionActuelle]
   → playLetter(partie[N].lettre, 'en', voix)   ← lecture auto
   ↓
[enfant tape une carte]
   ↓
   feedback = 'ok' ou 'nok'
   lettreChoisie = <lettre tapée>
   (si ok) score += 1
   jouerSonOK() ou jouerSonNok()
   ↓ setTimeout 800ms
   feedback = 'idle'
   lettreChoisie = null
   questionActuelle = N + 1   ← déclenche le useEffect → TTS nouvelle lettre
   
   Si N + 1 === 10 → termine = true → écran de fin
```

### Désactivation des clics pendant feedback

Sur chaque bouton-carte : `disabled={feedback !== 'idle'}`. Le `onClick` ne fait rien si `feedback` est déjà `'ok'` ou `'nok'` (sécurité double). Le bouton rejouer le son reste **toujours actif** (consigne explicite).

### Lecture auto initiale (500ms de délai)

```js
useEffect(() => {
  if (!voix) return  // attend que la voix soit chargée
  const t = setTimeout(() => {
    playLetter(partie[questionActuelle].lettre, 'en', voix)
  }, 500)
  return () => clearTimeout(t)
}, [voix, questionActuelle, partie])
```

Le `setTimeout` 500ms vaut pour la **première** lecture (au montage), pour laisser le navigateur charger la voix. Les lectures suivantes (changement de question) ne nécessitent pas vraiment ce délai, mais le garder uniformément est plus simple et donne aussi un petit temps de respiration entre les questions.

Note : le déclenchement écoute aussi `voix` → si la voix arrive après le montage (cas async `voiceschanged`), la lecture se déclenchera dès que `voix` est prête.

---

## 🔊 Sons de feedback (Web Audio API)

Pas de fichier MP3 à uploader, pas d'asset externe. On utilise `AudioContext` + `OscillatorNode` natifs.

### Subtilité importante

`AudioContext` doit souvent être **créé après une interaction utilisateur** (politiques d'autoplay des navigateurs, surtout Safari/Chrome mobile). Sinon il reste en état `'suspended'`. Solution propre :

```js
// useRef pour partager le même AudioContext sur tous les sons
const audioCtxRef = useRef(null)

function getAudioCtx() {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume()
  }
  return audioCtxRef.current
}

function jouerBeep(frequence, dureeMs) {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequence
  gain.gain.value = 0.1   // volume bas
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  // Petit fade-out pour éviter le "clic" en fin de son
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dureeMs / 1000)
  osc.stop(ctx.currentTime + dureeMs / 1000)
}

function jouerSonOK() { jouerBeep(800, 150) }
function jouerSonNok() { jouerBeep(200, 250) }
```

Le `getAudioCtx` est appelé pour la **première fois au moment du premier clic** (toujours après interaction utilisateur), donc pas de blocage par le navigateur. ✔

### Cleanup

`audioCtxRef.current.close()` au unmount pour libérer les ressources. Petit `useEffect` cleanup.

---

## 🔁 Réutilisation vs duplication de `playLetter`

Wells laisse le choix entre **importer** depuis `Alphabet.jsx` (export nommé) ou **dupliquer** localement.

**Recommandation : dupliquer** dans `AlphabetEcoute.jsx`. Raisons :
- `Alphabet.jsx` est une **page**, pas un module utilitaire — exporter `playLetter` et `TTS_MAP` depuis une page crée un couplage déroutant.
- Wells a explicitement écrit : *"on factorisera dans un hook custom `useVoixAnglaise` plus tard si Wells veut"* → on est dans une **phase exploratoire**, la duplication est OK temporairement.
- Aucun risque de divergence puisque la duplication est triviale (12 lignes).

Si plus tard on veut un vrai refacto : créer `src/utils/tts.js` avec `playLetter` + `TTS_MAP` + hook `useVoixAnglaise`. Un seul sprint dédié.

**Le même raisonnement vaut pour le `useEffect` de chargement de voix** (≈20 lignes) → dupliqué dans `AlphabetEcoute.jsx`.

---

## 🔗 Modif minimale de `Alphabet.jsx` (bouton vers Ex 2)

Une seule addition, juste avant le footer "X lettres · langue", pour ne pas casser le flux visuel :

```jsx
{/* Lien vers l'Exercice 2 */}
<button
  onClick={() => navigate('/alphabet/ecoute')}
  style={{
    marginTop: '20px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    border: 'none',
    borderRadius: '16px',
    color: '#FFFFFF',
    fontFamily: 'Nunito, sans-serif',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
  }}
>
  🎧 Exercice 2 : Écoute et choisis
</button>
```

**Rien d'autre n'est touché dans `Alphabet.jsx`** — pas de refacto, pas de réorganisation, on insère juste 1 bouton.

---

## 🛣 Modif `App.jsx`

```diff
 import Alphabet from './pages/Alphabet'
+import AlphabetEcoute from './pages/AlphabetEcoute'
 ...
 <Route path="/alphabet" element={<Alphabet />} />
+<Route path="/alphabet/ecoute" element={<AlphabetEcoute />} />
```

2 lignes ajoutées. Aucune ligne supprimée.

---

## ⚠️ Points d'attention

### 1. Voix non chargée au tout début
La voix est chargée de façon async (`voiceschanged`). Si l'enfant arrive sur la page très vite, `voix` est `null` pendant qq ms. **Mitigation** : le useEffect de lecture auto attend `voix` (early return si null) et redéclenche quand la voix arrive. L'enfant verra peut-être "rien ne se passe pendant 300 ms" puis le son démarrera — acceptable. Pas de blocage UI.

### 2. AudioContext suspendu sur mobile
Géré : `getAudioCtx()` appelle `resume()` à chaque récupération. Et il est créé lazy au premier clic (qui est déjà une interaction utilisateur).

### 3. Bouton rejouer toujours actif
Consigne explicite. Implémenté en n'appliquant **pas** `disabled` au bouton rejouer (contrairement aux cartes-réponses).

### 4. Re-tap rapide sur la même carte
Si l'enfant tape 2 fois très vite avant que `feedback` ne passe à `'ok'`, les 2 clics passent. **Mitigation** : double sécurité via `disabled={feedback !== 'idle'}` + early return dans le handler `if (feedback !== 'idle') return`. Suffit pour bloquer les doubles taps.

### 5. Navigation arrière pendant une partie
Si l'enfant tape le bouton retour `←`, la partie est perdue (state React local non persisté). C'est le comportement attendu — pas de partie en cours sauvegardée. Pas de confirmation modale (overkill pour cet âge).

### 6. Accessibilité (cohérent avec Ex 1)
- Sur chaque bouton-carte : `aria-label={lettre}` (forcé à la lettre seule)
- Sur le bouton rejouer : `aria-label="Rejouer la lettre"`
- `letter.toLowerCase()` passé à `SpeechSynthesisUtterance` (pour éviter "capital A" sur macOS/iOS, déjà appliqué dans Alphabet.jsx)

### 7. Style de la carte audio (gros bouton rond)
- Dimensions : 120×120 px (suffisamment gros pour être facile à taper pour un enfant)
- Fond : `linear-gradient(135deg, #8B5CF6, #7C3AED)`
- Border-radius : 50% (cercle)
- Icône haut-parleur SVG blanche au centre (40×40)
- Glow violet : `boxShadow: '0 0 24px rgba(139,92,246,0.4)'`
- Animation tap : `scale(0.95)` cohérent avec Ex 1

### 8. Pas d'XP attribué
Confirmé dans la consigne : on n'enregistre rien en BDD, on affiche juste le score à l'écran de fin. On harmonisera plus tard avec les chapitres normaux.

### 9. Score visuel en haut
La barre violette = `width: (questionActuelle / 10) * 100%` avec animation `transition: width 0.4s ease` pour un effet doux. Score textuel "Score : X" + "Y / 10" de chaque côté.

---

## 🧪 Plan de test (après application)

1. `npm run dev` → naviguer sur `/alphabet` → vérifier que la grille EN est toujours affichée correctement + nouveau bouton violet "🎧 Exercice 2 : Écoute et choisis" visible
2. Tap sur le bouton → arrive sur `/alphabet/ecoute`
3. Après ≈500ms : entendre la première lettre prononcée
4. Taper sur la bonne lettre → carte verte + petit "bip" aigu + barre avance + score augmente
5. Question suivante après 800ms → nouvelle lettre annoncée
6. Taper sur une mauvaise → carte rouge + "bip" grave + barre avance mais score n'augmente pas
7. Tap sur le bouton rejouer pendant le feedback → la lettre est relue
8. Après les 10 questions → écran "Bravo" avec score + bouton retour + bouton rejouer
9. Bouton "Rejouer" → relance une nouvelle partie (10 nouvelles lettres au hasard)
10. Bouton "Retour à l'apprentissage" → revient sur `/learn`

---

## ❓ Questions à valider avant exécution

1. **Duplication de `playLetter` + useEffect voix dans `AlphabetEcoute.jsx`** (vs import nommé depuis `Alphabet.jsx`) → OK ?
2. **Bouton secondaire "Rejouer" sur l'écran de fin** → OK ? (Sinon je mets juste le bouton "Retour à l'apprentissage".)
3. **Bouton retour `←` pendant une partie** : pas de confirmation modale, on perd la partie silencieusement → OK ?
4. **Lecture auto à 500ms** au montage (puis instantanée aux changements de question) → OK, ou tu préfères 500ms uniforme à chaque changement de question pour donner un temps de respiration ?

Si OK, j'applique.
