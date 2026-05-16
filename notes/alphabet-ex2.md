# Rapport — Exercice 2 "Écoute et choisis" (Alphabet)

## ✅ Résultat

L'Exercice 2 est en place sur la route `/alphabet/ecoute`. L'enfant entend une lettre prononcée à voix haute en anglais, choisit parmi 3 cartes, reçoit un feedback visuel (vert/rouge) et sonore (beep Web Audio), enchaîne 10 questions, puis arrive sur un écran de bravo avec score + 2 boutons (Retour à l'apprentissage / Rejouer).

L'Ex 1 (`/alphabet`) reste **strictement intact**, on a juste ajouté un bouton violet sous la grille pour aller vers l'Ex 2.

## 📁 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/AlphabetEcoute.jsx` | **Créé** — composant principal de l'exercice + écran de fin |
| `src/App.jsx` | **Modif** — 1 import `AlphabetEcoute` + 1 route `/alphabet/ecoute` |
| `src/pages/Alphabet.jsx` | **Modif** — 1 bouton ajouté juste avant le footer, rien d'autre |

Aucune dépendance ajoutée. Aucune migration BDD. Aucun fichier supprimé.

---

## 🔧 Détail de l'implémentation

### Architecture de la partie — pré-calcul au montage

Pour éviter tout shuffle accidentel des distracteurs pendant qu'on regarde une question, **toute la partie est pré-calculée en une fois** au montage via le lazy init de `useState` :

```js
const [partie, setPartie] = useState(genererPartie)
```

`genererPartie()` :
1. Mélange les 26 lettres anglaises et garde les 10 premières (cibles)
2. Pour chaque cible : mélange les 25 autres, garde 2 distracteurs, mélange l'ordre des 3 cartes
3. Retourne `Array<{ lettre, cartes }>` figé pour toute la partie

`shuffle()` utilise un **Fisher-Yates** propre (pas de `sort(() => random)` qui est biaisé).

### State (8 hooks d'état au total)

| State | Type | Init | Rôle |
|---|---|---|---|
| `partie` | `Array<{lettre, cartes}>` | `genererPartie` (lazy) | Les 10 questions figées |
| `questionActuelle` | `number` | `0` | Index 0-9 |
| `score` | `number` | `0` | Bonnes réponses |
| `feedback` | `'idle' \| 'ok' \| 'nok'` | `'idle'` | Phase d'animation |
| `lettreChoisie` | `string \| null` | `null` | Carte tapée à colorer pendant le feedback |
| `voix` | `SpeechSynthesisVoice \| null` | `null` | Voix anglaise sélectionnée |
| `termine` | `boolean` | `false` | Passe à `true` après la question 10 → écran de fin |
| `audioCtxRef` | `useRef` | `null` | AudioContext partagé pour les beeps |

### Flux d'une question

1. `useEffect [voix, questionActuelle, partie, termine]` → `setTimeout 500ms` → `playLetter(lettre, 'en', voix)` (annulé si unmount/re-render)
2. Enfant clique sur une carte → `repondre(lettre)`
3. Comparaison à `partie[questionActuelle].lettre` → set `feedback` + `lettreChoisie`, `score++` si OK, beep (`jouerSonOK` 800Hz/150ms ou `jouerSonNok` 200Hz/250ms)
4. `setTimeout 800ms` → reset feedback + `questionActuelle++` (ou `termine = true` à la 10e)

### Désactivation des clics pendant feedback

Triple sécurité :
- `disabled={feedback !== 'idle'}` sur le bouton (HTML natif)
- Early return `if (feedback !== 'idle') return` dans `repondre()`
- `cursor: 'default'` au lieu de `pointer` pendant le feedback

Le **bouton rejouer** n'a **pas** de `disabled` → reste actif en permanence, même pendant le feedback (consigne explicite).

### Sons feedback — Web Audio API

`AudioContext` créé **lazy** au premier appel (toujours après une interaction utilisateur → contourne les politiques d'autoplay mobile). Stocké dans `useRef` pour partager entre les clics. `resume()` appelé à chaque récupération au cas où il serait `'suspended'`.

```js
function jouerBeep(frequence, dureeMs) {
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequence
  gain.gain.value = 0.1  // volume bas
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dureeMs / 1000)
  osc.stop(ctx.currentTime + dureeMs / 1000)
}

function jouerSonOK()  { jouerBeep(800, 150) }
function jouerSonNok() { jouerBeep(200, 250) }
```

Le fade-out via `exponentialRampToValueAtTime` évite le "clic" parasite à l'arrêt brutal.

**Cleanup** : `useEffect` retour qui appelle `audioCtxRef.current.close()` au unmount → pas de fuite.

### TTS — duplication propre

`playLetter()`, `TTS_MAP` et le `useEffect` de chargement de voix sont **dupliqués** depuis `Alphabet.jsx` (≈30 lignes). Décision assumée pour ce sprint exploratoire — on factorisera plus tard dans `src/utils/tts.js` + hook `useVoixAnglaise` si besoin.

### Lecture auto à 500ms (uniforme)

`useEffect` avec deps `[voix, questionActuelle, partie, termine]` → setTimeout 500ms à chaque nouvelle question. Donne une respiration constante entre questions. Si l'enfant change vite de question (cas limite), le `clearTimeout` du return cleanup empêche les lectures parasites superposées.

### Accessibilité (cohérent avec Ex 1)

- `aria-label={lettre}` sur chaque bouton-réponse (force le name accessible à la lettre seule)
- `aria-label="Rejouer la lettre"` sur le bouton rond audio
- `aria-label="Retour"` sur la flèche du header
- `letter.toLowerCase()` dans `playLetter` → pas d'annonce "capital A" par macOS/iOS

### Écran de fin

Reproduit fidèlement la DA de `Lesson.jsx:359-389` :
- Fond `radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.15) 0%, #090E1A 55%)` → halo vert en haut
- Cercle vert avec coche (80×80, `rgba(88,204,2,0.15)`, border-radius 24)
- Titre "Bravo ! 🎉" 28px Nunito 900
- Sous-titre "Tu as bien écouté l'alphabet"
- 2 cartes côte à côte : `score / total` (vert) + `pourcentage%` (violet)
- Bouton principal vert pleine largeur `linear-gradient(135deg, #58CC02, #3DAD00)` → `/learn`
- Bouton secondaire violet `rgba(139,92,246,0.12)` → relance une nouvelle partie via `genererPartie()`

### Bouton vers Ex 2 dans `Alphabet.jsx`

Insertion **minimale** juste avant le footer, rien d'autre n'est touché dans ce fichier. Style :
- `linear-gradient(135deg, #8B5CF6, #7C3AED)`
- `padding: '16px 20px'`, `borderRadius: '16px'`
- Texte "🎧 Exercice 2 : Écoute et choisis"
- `marginTop: '20px'` pour respirer avec la grille

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur les 3 fichiers touchés
- [x] **Imports propres** : pas d'imports inutilisés
- [x] **Pas de `console.log`** oublié
- [x] **Aucune migration BDD**, aucun appel Supabase
- [x] **DA respectée** : fond `#090E1A`, glow violet (exercice) et glow vert (écran de fin), cartes arrondies, mobile-first 430px
- [x] **Ex 1 strictement intact** sauf l'ajout du bouton vers Ex 2 (rien d'autre n'a bougé)

---

## 🧪 À tester (Wells)

1. `npm run dev`
2. Naviguer sur `/alphabet` → vérifier que la grille EN est inchangée + nouveau bouton violet sous la grille
3. Cliquer sur le bouton → arrive sur `/alphabet/ecoute`
4. Après ≈500ms : entendre la 1ère lettre prononcée
5. Bouton rond violet : tap → relit la lettre (utile si pas entendu)
6. Bonne réponse → carte verte + petit "bip" aigu + barre violette qui avance + score++
7. Mauvaise réponse → carte rouge + "bip" grave + barre qui avance mais score inchangé
8. Re-tap rapide pendant les 800ms → bloqué (rien ne se passe)
9. Bouton rejouer **pendant** le feedback → fonctionne quand même (par design)
10. Après les 10 questions → écran "Bravo" avec score (ex : "8 / 10") + réussite (80%)
11. Bouton "Rejouer" → 10 nouvelles lettres tirées au hasard, score remis à 0
12. Bouton "Retour à l'apprentissage" → revient sur `/learn`
13. Test régression Ex 1 : retourner sur `/alphabet`, taper sur la carte "A" → toujours "ay" en anglais propre

---

## 🔮 Évolutions possibles (hors scope ce sprint)

- Factoriser TTS + chargement de voix dans `src/utils/tts.js` + hook `useVoixAnglaise` (réutilisé par Alphabet et AlphabetEcoute)
- Attribuer de l'XP en fin de partie (à harmoniser avec les leçons normales — table `progression`)
- Bouton "Question suivante" manuel au lieu d'auto-skip 800ms (pour les enfants plus lents)
- Mode "défi" avec timer
- Ex 3 (chanson alphabet) — prévu pour une 3e session
