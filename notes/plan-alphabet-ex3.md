# Plan — Exercice 3 "Chantons l'alphabet" (Alphabet)

## 🎯 Objectif

Ajouter un **Exercice 3** sur la route `/alphabet/chanson` : l'enfant écoute la chanson alphabet (couplets ABCDEFG / HIJK / LMNOP / QRS / TUV / WX / YZ) avec Neuri qui "chante", défilement visuel des lettres et lettre courante mise en évidence en violet.

**Mode TTS temporaire** : 1 lettre par seconde, voix anglaise sélectionnée. Quand Wells aura le MP3 Suno, on remplacera juste la fonction d'audio par un `<audio>` HTML5 avec timestamps — toute la logique de défilement visuel et les contrôles player resteront identiques.

Les Ex 1 (`/alphabet`) et Ex 2 (`/alphabet/ecoute`) restent **fonctionnels**, on ajoute juste des boutons de navigation vers l'Ex 3.

---

## 📐 Maquette ASCII

```
┌──────────────────────────────────────────┐
│ ←   🇬🇧 FONDAMENTAUX                      │
│     Chantons l'alphabet                   │
├──────────────────────────────────────────┤
│  Progression           00:12 / 00:26     │
│  ▓▓▓▓▓░░░░░░░░░░░  ← barre violette      │
├──────────────────────────────────────────┤
│  ┌────┐                                   │
│  │🎧  │   💬 Chante avec moi !            │
│  │Neuri│      Appuie sur pause pour       │
│  │ 3D  │      répéter. 🎤                 │
│  └────┘                                   │
├──────────────────────────────────────────┤
│                                           │
│      A   B   C   D   E   F   G            │
│      ─   ─   ─   ─[V]─   ─   ─            │  ← couplet en gros
│                                           │     E en violet, autres blancs 60%
│     ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐           │
│     │A│ │B│ │C│ │D│ │E│ │F│ │G│           │  ← ligne cadres carrés
│     └─┘ └─┘ └─┘ └━┛ └─┘ └─┘ └─┘           │     cadre E plus visible
│                                           │
│     ▌▌█▌▌█▌▌▌▌█▌▌▌▌▌█▌▌  ← forme d'onde   │
│                                           │
├──────────────────────────────────────────┤
│         ⏮     ⏯     ⏭         🔁 Répéter │
│                                    couplet│
└──────────────────────────────────────────┘
```

### Écran de fin (après les 26 lettres)

```
┌──────────────────────────────────────────┐
│                                           │
│             ┌──────┐                      │
│             │  ✓   │  ← cercle vert       │
│             └──────┘                      │
│                                           │
│            Bravo ! 🎉                     │
│   Tu connais bien l'alphabet maintenant ! │
│                                           │
│       🌟 Révision de l'alphabet           │
│             terminée 🌟                   │
│                                           │
│   ┌─────────────────────────────────┐     │
│   │   Retour à l'apprentissage      │ ← vert
│   └─────────────────────────────────┘     │
│                                           │
│   ┌─────────────────────────────────┐     │
│   │           Rejouer                │ ← violet pâle
│   └─────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

---

## 📁 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/AlphabetChanson.jsx` | **Créer** — composant principal + écran de fin |
| `src/App.jsx` | **Modif** — 1 import + 1 route `/alphabet/chanson` |
| `src/pages/Alphabet.jsx` | **Modif** — ajout d'un 2ème bouton sous "🎧 Exercice 2" |
| `src/pages/AlphabetEcoute.jsx` | **Modif** — ajout d'un 3ème bouton "🎵 Exercice suivant" entre "Retour" et "Rejouer" sur le sous-composant `EcranFin` |

Aucune autre modification. Aucune dépendance. Aucune migration BDD. Aucun fichier supprimé.

---

## 🎮 Architecture state

### Constante en tête du fichier

```js
// À ajuster quand le MP3 sera prêt. Idéalement, on remplacera ce système
// setInterval par un <audio> HTML5 avec des timestamps par lettre.
const DUREE_PAR_LETTRE_MS = 1000

const COUPLETS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S'],
  ['T', 'U', 'V'],
  ['W', 'X'],
  ['Y', 'Z'],
]
const LETTRES = COUPLETS.flat()  // 26 lettres en ordre, A-Z
const NB_LETTRES = LETTRES.length  // 26
```

### State unique `lettreIndex` (proposition)

Wells suggère 3 états séparés (`lettreIndex`, `coupletIndex`, `indexDansCouplet`). **Je propose un seul état `lettreIndex` (0-25)** et de dériver les deux autres via une fonction. Avantages :
- Une seule source de vérité → impossible de désynchroniser
- Les boutons Précédent/Suivant/Répéter modifient juste `lettreIndex`
- Plus simple à déboguer

```js
function getPosition(lettreIndex) {
  let restant = lettreIndex
  for (let i = 0; i < COUPLETS.length; i++) {
    if (restant < COUPLETS[i].length) {
      return { coupletIndex: i, indexDansCouplet: restant }
    }
    restant -= COUPLETS[i].length
  }
  return { coupletIndex: COUPLETS.length - 1, indexDansCouplet: COUPLETS[COUPLETS.length - 1].length - 1 }
}

function getLettreIndexDebutCouplet(coupletIndex) {
  let total = 0
  for (let i = 0; i < coupletIndex; i++) total += COUPLETS[i].length
  return total
}
```

À chaque render, on calcule `{coupletIndex, indexDansCouplet} = getPosition(lettreIndex)` — léger.

### États React

| State | Type | Init | Rôle |
|---|---|---|---|
| `lettreIndex` | `number` | `0` | Position globale 0-25 (source de vérité unique) |
| `isPlaying` | `boolean` | `false` | True quand la chanson est en cours de lecture |
| `termine` | `boolean` | `false` | True après avoir lu la 26e lettre → écran de fin |
| `voix` | `SpeechSynthesisVoice \| null` | `null` | Voix anglaise sélectionnée |

`coupletIndex` et `indexDansCouplet` ne sont **pas** des states — ils sont dérivés de `lettreIndex` à chaque render.

---

## 🔁 Logique de défilement (TTS, mode temporaire)

Approche **déclarative** via `useEffect` (plus React-idiomatique qu'un `setInterval` impératif) :

```js
// TODO: Remplacer par lecture MP3 Suno + timestamps par lettre
// quand l'audio sera prêt.
useEffect(() => {
  if (!isPlaying) return
  if (termine) return
  if (lettreIndex >= NB_LETTRES) {
    setIsPlaying(false)
    setTermine(true)
    return
  }
  // Lire la lettre courante immédiatement
  if (voix) playLetter(LETTRES[lettreIndex], 'en', voix)
  // Programmer le passage à la suivante
  const t = setTimeout(() => {
    setLettreIndex((prev) => prev + 1)
  }, DUREE_PAR_LETTRE_MS)
  return () => clearTimeout(t)
}, [isPlaying, lettreIndex, voix, termine])
```

**Comment ça marche** :
- Chaque changement de `lettreIndex` re-déclenche le useEffect → lit la nouvelle lettre + programme la suivante
- Pause → `isPlaying = false` → useEffect ne fait rien + cleanup du timeout courant
- Reprise (Play) → useEffect re-tourne → relit la lettre courante (utile pour reprendre le fil) + repart
- Précédent/Suivant/Répéter → modifient `lettreIndex` → déclenche tout
- Fin (lettreIndex >= 26) → `setIsPlaying(false)` + `setTermine(true)` → écran de fin

**Subtilité Pause/Play** : à la reprise, la lettre courante est relue. C'est volontaire — aide l'enfant à reprendre le rythme.

---

## 🎛 Contrôles player

### Bouton Play/Pause (rond violet 60×60)

```js
function togglePlay() {
  if (termine) {
    // Rejouer depuis le début
    setLettreIndex(0)
    setTermine(false)
    setIsPlaying(true)
    return
  }
  setIsPlaying((prev) => !prev)
}
```

Icône : ▶ si pas en lecture, ⏸ si en lecture. Si termine → toujours ▶ (rejouer).

### Bouton Précédent (40×40, plus discret)

```js
function coupletPrecedent() {
  const { coupletIndex } = getPosition(lettreIndex)
  const cible = Math.max(0, coupletIndex - 1)
  setLettreIndex(getLettreIndexDebutCouplet(cible))
}
```

Si déjà au couplet 0, reste à la position 0.

### Bouton Suivant (40×40)

```js
function coupletSuivant() {
  const { coupletIndex } = getPosition(lettreIndex)
  const cible = Math.min(COUPLETS.length - 1, coupletIndex + 1)
  setLettreIndex(getLettreIndexDebutCouplet(cible))
}
```

Si déjà au dernier couplet, reste sur le dernier.

### Bouton "Répéter le couplet" (en bas à droite, texte + icône)

```js
function repeterCouplet() {
  const { coupletIndex } = getPosition(lettreIndex)
  setLettreIndex(getLettreIndexDebutCouplet(coupletIndex))
}
```

Remet `lettreIndex` au début du couplet courant. Si `isPlaying` est true, la lecture continue naturellement (useEffect redéclenche). Si paused, la lettre courante reste affichée en violet mais ne se lit pas (jusqu'à un Play).

---

## ⏱ Affichage du timer "00:12 / 00:26"

```js
function formatTemps(secondes) {
  const m = Math.floor(secondes / 60).toString().padStart(2, '0')
  const s = (secondes % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const totalSec = NB_LETTRES * DUREE_PAR_LETTRE_MS / 1000   // 26
const ecouleSec = lettreIndex * DUREE_PAR_LETTRE_MS / 1000  // 0-26
const tempsEcoule = formatTemps(ecouleSec)
const tempsTotal = formatTemps(totalSec)
```

### Barre de progression

`width: ${(lettreIndex / NB_LETTRES) * 100}%` avec `transition: 'width 1s linear'` → animation fluide pendant le tick d'une lettre à l'autre. Quand on Pause, la barre reste à sa valeur courante (pas d'animation en cours puisqu'on n'a pas re-render).

---

## 🎨 Composants visuels

### Bandeau Neuri + bulle "Chante avec moi !"

Layout flex row, gap 16px, marginBottom 24px :

```jsx
<div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
  <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
    <Neuri3D color="#8B5CF6" />
    {/* Overlay casque emoji */}
    <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🎧</span>
  </div>
  <div style={{ flex: 1, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '12px 14px' }}>
    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
      Chante avec moi&nbsp;! Appuie sur pause pour répéter. 🎤
    </p>
  </div>
</div>
```

**Note importante sur le casque** : Wells décrit "petit casque visuel" sur Neuri. Le composant `Neuri3D` actuel n'accepte que la prop `color` (pas de prop pour les accessoires 3D). Au lieu de modifier `Neuri3D` (refacto opportuniste interdite), je propose un **overlay emoji 🎧** en `position: absolute` par-dessus le Canvas. Solution minimale, non invasive, visuellement cohérente. À valider.

### Couplet en gros (au centre)

```jsx
<div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
  {COUPLETS[coupletIndex].map((lettre, i) => (
    <span key={i} style={{
      fontFamily: 'Nunito, sans-serif',
      fontSize: '36px',
      fontWeight: '900',
      color: i === indexDansCouplet ? '#A78BFA' : 'rgba(255,255,255,0.6)',
      transition: 'color 0.3s ease',
    }}>
      {lettre}
    </span>
  ))}
</div>
```

### Ligne de cadres carrés en dessous

```jsx
<div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
  {COUPLETS[coupletIndex].map((lettre, i) => {
    const courante = i === indexDansCouplet
    return (
      <div key={i} style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: courante ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
        border: courante ? '2px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '700',
        color: courante ? '#A78BFA' : 'rgba(255,255,255,0.5)',
        transition: 'all 0.3s ease',
      }}>
        {lettre}
      </div>
    )
  })}
</div>
```

### Forme d'onde violette animée (décoratif)

7 barres verticales qui pulsent en hauteur via `@keyframes pulseWave`, animation-delay décalé pour effet aléatoire. Largeur fixe au centre, pas de dépendance au state.

```jsx
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '24px', marginBottom: '24px' }}>
  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
    <div key={i} style={{
      width: '3px',
      background: 'linear-gradient(180deg, #8B5CF6, #A78BFA)',
      borderRadius: '2px',
      animation: `pulseWave 0.8s ease-in-out infinite`,
      animationDelay: `${i * 0.1}s`,
    }}/>
  ))}
</div>
```

Avec `<style>{`@keyframes pulseWave { 0%, 100% { height: 30%; } 50% { height: 100%; } }`}</style>` global dans le composant.

### Boutons player

Flex row centré, gap 24px, marginBottom 12px :

```jsx
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '12px' }}>
  <button onClick={coupletPrecedent} aria-label="Couplet précédent" style={{/* 40×40 rond violet pâle */}}>
    <svg>⏮ icône</svg>
  </button>
  <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Lecture'} style={{
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 0 24px rgba(139,92,246,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg>{isPlaying ? ⏸ : ▶ icône}</svg>
  </button>
  <button onClick={coupletSuivant} aria-label="Couplet suivant" style={{/* 40×40 rond violet pâle */}}>
    <svg>⏭ icône</svg>
  </button>
</div>
```

### Bouton "🔁 Répéter le couplet"

```jsx
<button onClick={repeterCouplet} style={{
  alignSelf: 'flex-end',
  background: 'rgba(139,92,246,0.12)',
  border: '1px solid rgba(139,92,246,0.25)',
  borderRadius: '20px',
  padding: '8px 14px',
  fontSize: '12px', color: '#A78BFA',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
}}>
  🔁 Répéter le couplet
</button>
```

---

## 🏁 Écran de fin

```jsx
function EcranFin({ onRetour, onRejouer }) {
  return (
    <div style={{ /* radial-gradient vert + flex column centré */ }}>
      <div style={{ /* cercle 80×80 vert + coche SVG */ }}>...</div>
      <h1>Bravo&nbsp;! 🎉</h1>
      <p>Tu connais bien l'alphabet maintenant&nbsp;!</p>
      <div style={{ /* carte spéciale */
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '32px',
        textAlign: 'center',
      }}>
        <p>🌟 Révision de l'alphabet terminée 🌟</p>
      </div>
      <button onClick={onRetour} style={{/* vert gradient */}}>Retour à l'apprentissage</button>
      <button onClick={onRejouer} style={{/* violet pâle */}}>Rejouer</button>
    </div>
  )
}
```

Cohérent avec l'écran de fin de l'Ex 2 (mêmes couleurs vertes/violettes, même structure de boutons), avec une carte spéciale "🌟 Révision terminée" en plus puisque l'Ex 3 conclut la révision de l'alphabet.

---

## 🔗 Modifs des fichiers existants

### `src/App.jsx`

```diff
 import AlphabetEcoute from './pages/AlphabetEcoute'
+import AlphabetChanson from './pages/AlphabetChanson'
 ...
 <Route path="/alphabet/ecoute" element={<AlphabetEcoute />} />
+<Route path="/alphabet/chanson" element={<AlphabetChanson />} />
```

### `src/pages/Alphabet.jsx`

Ajout d'un 2ème bouton **juste après** le bouton "🎧 Exercice 2" :

```jsx
<button onClick={() => navigate('/alphabet/chanson')} style={{
  marginTop: '12px',
  padding: '16px 20px',
  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  border: 'none', borderRadius: '16px',
  color: '#FFFFFF',
  fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
}}>
  🎵 Exercice 3 : Chantons l'alphabet
</button>
```

Mêmes styles que le bouton Ex 2 (cohérence visuelle). `marginTop: 12px` pour resserrer entre les deux boutons (au lieu de 20px qui sépare de la grille).

### `src/pages/AlphabetEcoute.jsx` (composant `EcranFin`)

Ajout d'un 3ème bouton **entre** "Retour à l'apprentissage" et "Rejouer". Signature du sous-composant et appel à modifier :

```diff
-function EcranFin({ score, total, onRetour, onRejouer }) {
+function EcranFin({ score, total, onRetour, onExerciceSuivant, onRejouer }) {
   ...
   <button onClick={onRetour}>Retour à l'apprentissage</button>
+  <button onClick={onExerciceSuivant} style={{
+    width: '100%', height: '48px', marginBottom: '12px',
+    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
+    color: '#FFFFFF', border: 'none', borderRadius: '14px',
+    fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '700',
+    cursor: 'pointer',
+    boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
+  }}>
+    🎵 Exercice suivant : Chantons l'alphabet
+  </button>
   <button onClick={onRejouer}>Rejouer</button>
```

Et dans le rendu principal `if (termine) return <EcranFin ... />`, ajouter `onExerciceSuivant={() => navigate('/alphabet/chanson')}`.

---

## ⚠️ Points d'attention

### 1. Chargement de la voix (dupliqué depuis AlphabetEcoute.jsx)

Même pattern : `useState voix` + `useEffect` qui écoute `voiceschanged`. Sans la voix, la première lecture est silencieuse (early return de `playLetter`). Le défilement visuel et le useEffect tournent quand même, mais l'audio attend la voix. **Mitigation** : on peut bloquer le démarrage de `isPlaying` tant que `voix === null` ? Non, trop conservateur. La voix arrive en quelques dizaines de ms. Si l'enfant tape Play immédiatement au montage, dans le pire des cas il rate la 1ère lettre audio (mais voit le défilement). Acceptable.

### 2. Cleanup au unmount

Le useEffect a déjà un cleanup du `setTimeout` (via le `return () => clearTimeout(t)`). Si l'enfant quitte la page pendant la lecture, le timeout est annulé proprement.

`speechSynthesis.cancel()` est aussi appelé par `playLetter()` à chaque nouvelle lecture → la lecture précédente est coupée si elle dépasse 1 seconde.

### 3. TTS "B" qui dure plus d'1 seconde sur certaines voix
Les lettres rapides ("E", "I") sont brèves, mais certaines voix lentes peuvent traîner sur "W" ("double-u") qui dure ~1,2s. Conséquence : avec `DUREE_PAR_LETTRE_MS = 1000`, on coupe parfois la fin du "W" avant qu'il finisse. Acceptable pour ce sprint exploratoire — le MP3 Suno final résoudra ça avec un timing musical précis.

### 4. Pause au milieu d'une lettre lente
Si l'enfant tape Pause pendant que "W" est en train d'être prononcé, `setIsPlaying(false)` est appliqué → cleanup du setTimeout. Mais la lecture TTS continue jusqu'à la fin (sauf si on appelle `cancel()` explicitement). **Décision** : ne pas appeler `cancel()` au Pause — laisser la lettre courante finir de se prononcer, ça paraît plus naturel à l'oreille.

### 5. Bouton Précédent/Suivant pendant la lecture
Si `isPlaying = true` et qu'on tape Suivant : `setLettreIndex(nouvelleValeur)` → useEffect re-tourne → cleanup ancien timeout + lecture nouvelle lettre. Pas de souci. Idem pour Précédent et Répéter.

### 6. Boutons Précédent désactivé au couplet 0 ?
Visuellement on peut afficher le bouton en opacity réduit quand `coupletIndex === 0`, sinon il "ne fait rien" au tap. Idem pour Suivant au dernier couplet. Détail UX — je vais l'implémenter (opacity 0.3 + `disabled` HTML).

### 7. Préparation MP3 (commentaires TODO)
Comme demandé : commentaires `// TODO: Remplacer par lecture MP3 Suno...` au-dessus du useEffect de défilement et de la constante `DUREE_PAR_LETTRE_MS`. La fonction `playLetter` reste comme aujourd'hui, c'est juste le useEffect qui sera remplacé.

### 8. Forme d'onde animée
Purement décorative. N'écoute pas le son. Pulse en continu via CSS `@keyframes`, ne se met pas en pause quand l'audio est en pause (volontaire — c'est juste un élément visuel d'ambiance "musical").

### 9. Accessibilité
- `aria-label` sur chaque bouton player ("Lecture" / "Pause" / "Couplet précédent" / "Couplet suivant" / "Répéter le couplet" / "Retour")
- Pas d'`aria-label` sur les spans/divs des lettres (juste du texte, lu naturellement)

---

## 🧪 Plan de test (après application)

1. `npm run dev` → naviguer sur `/alphabet` → vérifier le **nouveau bouton "🎵 Exercice 3"** sous le bouton Ex 2
2. Tap → arrive sur `/alphabet/chanson`
3. Tap **Play** : Neuri reste affiché, lecture A→Z avec :
   - lettre courante en violet, autres en blanc 60%
   - barre progression qui se remplit fluide
   - timer qui avance 00:00 → 00:26
   - forme d'onde qui pulse en arrière-plan
4. Tap **Pause** pendant "E" → la lecture s'arrête sur E, barre figée, timer figé
5. Tap **Play** → relit "E" puis enchaîne F, G…
6. Tap **Précédent** au couplet 3 → revient au début du couplet 2
7. Tap **Suivant** au couplet 0 → début du couplet 1
8. Tap **Répéter le couplet** au milieu d'un couplet → revient à la 1ère lettre du couplet courant
9. Lecture jusqu'au bout → écran "Bravo" avec carte "🌟 Révision terminée"
10. Tap **Rejouer** → revient au début, lecture peut redémarrer
11. Tap **Retour à l'apprentissage** → `/learn`
12. Aller sur `/alphabet/ecoute` → faire les 10 questions → arriver sur l'écran de fin
13. Voir le **nouveau 3ème bouton "🎵 Exercice suivant"** entre Retour et Rejouer → tap → arrive sur `/alphabet/chanson`
14. **Tests régression** : Ex 1 toujours fonctionnel, Ex 2 toujours fonctionnel

---

## ❓ Questions à valider avant exécution

1. **State unique `lettreIndex`** (avec dérivation `coupletIndex` + `indexDansCouplet` via fonction) **plutôt que 3 states séparés** → OK ?

2. **Casque visuel sur Neuri** : overlay emoji 🎧 en `position: absolute` par-dessus le Canvas Neuri3D (non invasif), **vs** modifier `Neuri3D` pour ajouter une prop d'accessoire 3D → mon choix est l'overlay. OK ?

3. **Pause → Play** : la lettre courante est **relue** à la reprise (par design — aide à reprendre le fil). OK ? Ou tu préfères ne pas re-lire la lettre où on s'est arrêté et passer directement à la suivante ?

4. **Lecture immédiate au premier Play** : la 1ère lettre se lit immédiatement quand on tape Play (pas de délai 500ms). Cohérent avec un player musical classique. OK ?

5. **Boutons Précédent/Suivant désactivés visuellement** aux extrémités (opacity 0.3 + `disabled`) → OK ?

Si OK, j'applique.
