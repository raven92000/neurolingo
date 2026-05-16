# Plan — Refonte feedback Ex 2 Alphabet pour aligner sur la DA de Lesson.jsx

## 🎯 Objectif

Migrer le système de feedback de `AlphabetEcoute.jsx` pour reproduire **exactement** la DA et l'UX de `EcranExercice` dans [Lesson.jsx](src/pages/Lesson.jsx) (lignes 185-272). Cohérence visuelle sur toute l'app.

L'Ex 1 (`/alphabet`) reste **strictement intact**. `Lesson.jsx` n'est **pas modifié** — on s'en sert juste comme référence.

---

## 🔍 Référence : ce que fait `EcranExercice` (Lesson.jsx:185-272)

Synthèse du flow pédagogique observé :

1. À l'arrivée sur la question : `setTimeout 400ms` puis TTS de la cible
2. Au tap sur une réponse :
   - `setSelected(c)` + `setFeedback('correct' | 'wrong')`
   - `setTimeout 400ms` → `setShowNeuri(true)` (apparition Neuri 3D avec petit délai)
   - `startCountdown(secondes)` → 3s si correct, 5s si wrong (`settings.feedbackCorrect/Erreur`)
3. Pendant le feedback :
   - **Toutes les cartes** : la bonne réponse passe verte, la tapée mauvaise passe orange
   - **Sous les cartes** : Neuri 3D 52×52 + bulle texte ("Bien joué !" ou "Presque ! C'était X.")
   - **Sous Neuri** : "Continuer dans X..." + barre qui se vide (`@keyframes shrink`)
   - **Sous la barre** : bouton "Continuer" désactivé pendant le countdown, activé à la fin
   - **Si wrong** : texte "Chaque erreur te fait progresser." en bas
4. Cleanup `clearInterval` au unmount via `useEffect`

---

## 🎨 Palette à reprendre depuis Lesson.jsx

| Élément | Couleur |
|---|---|
| Carte bonne réponse (révélée) — bordure | `2px solid rgba(88,204,2,0.5)` |
| Carte bonne réponse — fond | `rgba(88,204,2,0.1)` |
| Carte bonne réponse — texte | `#86EFAC` |
| Carte mauvaise réponse (tapée) — bordure | `2px solid rgba(245,158,11,0.5)` ← **ORANGE pas rouge** |
| Carte mauvaise réponse — fond | `rgba(245,158,11,0.08)` |
| Carte mauvaise réponse — texte | `#FCD34D` |
| Carte neutre — bordure | `1.5px solid rgba(255,255,255,0.08)` |
| Carte neutre — fond | `rgba(255,255,255,0.04)` |
| Neuri vert (correct) | `#58CC02` |
| Neuri violet (wrong) | `#8B5CF6` |
| Barre countdown — fond | `rgba(255,255,255,0.06)` |
| Barre countdown — rempli correct | `#58CC02` |
| Barre countdown — rempli wrong | `#8B5CF6` |
| Bouton Continuer correct | `linear-gradient(135deg, #58CC02, #3DAD00)` |
| Bouton Continuer wrong | `linear-gradient(135deg, #7C3AED, #6D28D9)` |
| Bouton Continuer désactivé | `rgba(255,255,255,0.06)` + couleur texte `rgba(255,255,255,0.25)` |

---

## 🔧 Changements détaillés sur `AlphabetEcoute.jsx`

### 1. Imports

Ajouter `useCallback` (utile pour `handleSelect`) et `Neuri3D` :

```diff
-import { useEffect, useRef, useState } from 'react'
+import { useCallback, useEffect, useRef, useState } from 'react'
 import { useNavigate } from 'react-router-dom'
 import { getLangueByCode } from '../utils/languages'
 import { ALPHABET_DATA } from '../data/alphabetData'
+import Neuri3D from '../components/Neuri3D'
```

### 2. State — migration

| Avant | Après | Note |
|---|---|---|
| `feedback: 'idle' \| 'ok' \| 'nok'` | `feedback: null \| 'correct' \| 'wrong'` | Alignement nommage Lesson.jsx |
| `lettreChoisie` | `lettreChoisie` (conservé) | Reste en français, sert comme `selected` de Lesson |
| — | `showNeuri: boolean` | Apparition retardée de Neuri (400ms) |
| — | `showContinue: boolean` | Active le bouton Continuer à la fin du countdown |
| — | `countdown: number \| null` | Compteur affiché "Continuer dans X..." |
| — | `countdownRef = useRef(null)` | Référence intervalle pour cleanup |

### 3. Fonctions nouvelles / refondues

**`startCountdown(seconds)`** — réplique de Lesson.jsx:203-208

```js
function startCountdown(seconds) {
  setCountdown(seconds)
  countdownRef.current = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(countdownRef.current)
        setShowContinue(true)
        return null
      }
      return prev - 1
    })
  }, 1000)
}
```

**`repondre(lettre)` refonte** — basée sur Lesson.jsx:210-218

```js
const repondre = useCallback((lettre) => {
  if (lettreChoisie) return  // bloque les double-clics
  if (termine) return
  const cible = partie[questionActuelle].lettre
  const correct = lettre === cible
  setLettreChoisie(lettre)
  setFeedback(correct ? 'correct' : 'wrong')
  if (correct) {
    setScore((s) => s + 1)
    jouerSonOK()
  } else {
    jouerSonNok()
  }
  setTimeout(() => setShowNeuri(true), 400)
  startCountdown(correct ? 3 : 5)
}, [lettreChoisie, termine, partie, questionActuelle])
```

Note : on **retire** le `setTimeout auto` qui faisait avancer la question. C'est maintenant le bouton "Continuer" qui déclenche la suite.

**`onContinuer()`** — nouveau handler du bouton Continuer

```js
function onContinuer() {
  if (!showContinue) return
  const suivante = questionActuelle + 1
  if (suivante >= partie.length) {
    setTermine(true)
  } else {
    setQuestionActuelle(suivante)
  }
  // Reset tous les states de feedback pour la question suivante
  setLettreChoisie(null)
  setFeedback(null)
  setShowNeuri(false)
  setShowContinue(false)
  setCountdown(null)
  if (countdownRef.current) {
    clearInterval(countdownRef.current)
    countdownRef.current = null
  }
}
```

### 4. Cleanup au unmount

Étendre le useEffect d'AudioContext OU ajouter un useEffect dédié :

```js
useEffect(() => {
  return () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
  }
}, [])
```

### 5. Rendu — refonte complète du bloc feedback

#### Couleurs des 3 cartes-réponses (remplace la logique actuelle)

```jsx
{question.cartes.map((lettre) => {
  const isSelected = lettreChoisie === lettre
  const isCorrect = feedback && lettre === question.lettre
  const isWrong = feedback === 'wrong' && isSelected && lettre !== question.lettre

  return (
    <button
      key={lettre}
      onClick={() => repondre(lettre)}
      disabled={feedback !== null}
      aria-label={lettre}
      style={{
        aspectRatio: '1',
        background: isCorrect ? 'rgba(88,204,2,0.1)' : isWrong ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
        border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: '18px',
        fontSize: '40px',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: '900',
        color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF',
        cursor: feedback ? 'default' : 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: '0 0 16px rgba(139,92,246,0.05)',
      }}
    >
      {lettre}
    </button>
  )
})}
```

Remarques :
- **`disabled={feedback !== null}`** : bloque les clics dès qu'une réponse est donnée
- **`isCorrect`** se déclenche dès qu'il y a un feedback (révélation toujours, comme Lesson.jsx)
- **`isWrong`** uniquement sur la carte tapée et seulement si elle est mauvaise → coloration orange UNIQUEMENT sur celle-là
- Pas d'animation `transform: scale` au tap dans Lesson.jsx → on retire aussi les `onMouseDown/Up/Leave` actuels pour rester fidèle au modèle

#### Bloc Neuri (apparaît à 400ms après la réponse)

```jsx
{showNeuri && (
  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '24px', marginBottom: '16px' }}>
    <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
      <Neuri3D color={feedback === 'correct' ? '#58CC02' : '#8B5CF6'} />
    </div>
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 14px', flex: 1 }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
        {feedback === 'correct' ? 'Bien joué !' : `Presque ! C'était ${question.lettre}.`}
      </p>
    </div>
  </div>
)}
```

#### Bloc bouton Continuer + countdown

```jsx
{feedback && (
  <div style={{ width: '100%' }}>
    {countdown !== null && (
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: '0 0 6px', textAlign: 'center' }}>
          Continuer dans {countdown}...
        </p>
        <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: feedback === 'correct' ? '#58CC02' : '#8B5CF6',
            borderRadius: '99px',
            animation: `shrink ${feedback === 'correct' ? 3 : 5}s linear forwards`,
            transformOrigin: 'left',
          }}/>
        </div>
      </div>
    )}
    <button
      onClick={onContinuer}
      disabled={!showContinue}
      style={{
        width: '100%',
        height: '54px',
        background: !showContinue ? 'rgba(255,255,255,0.06)' : feedback === 'correct' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
        color: !showContinue ? 'rgba(255,255,255,0.25)' : '#FFFFFF',
        border: 'none',
        borderRadius: '16px',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '17px',
        fontWeight: '800',
        cursor: showContinue ? 'pointer' : 'not-allowed',
        transition: 'all 0.4s ease',
      }}
    >
      Continuer
    </button>
    {feedback === 'wrong' && (
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '12px 0 0' }}>
        Chaque erreur te fait progresser.
      </p>
    )}
  </div>
)}
```

#### Animation CSS shrink

```jsx
<style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
```

Note technique : j'ajoute `transformOrigin: 'left'` sur le div animé (pas dans Lesson.jsx qui n'en a pas non plus mais ça marche par défaut puisque c'est un div bloc). À garder pour être explicite.

### 6. Nettoyage du bouton rond audio → carte 130×130 + pastille "Réécouter"

Avant : un seul gros bouton rond violet 120×120 qui fait tout.
Après (calqué sur Lesson.jsx:229-234) :

- **Au-dessus** : petit label `"Quelle lettre as-tu entendue ?"` en mode pré-titre (12px, 0.35 opacité, letter-spacing, uppercase)
- **Carte centrale** 130×130 avec icône haut-parleur — **cliquable** pour rejouer, **fond et bordure changent** selon le feedback (cohérent avec Lesson.jsx ligne 230 qui change la bordure de la carte mot.svg selon feedback)
- **Pastille en dessous** "🔊 Réécouter" (style exact de Lesson.jsx ligne 231-234) — aussi cliquable, toujours active

```jsx
<p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px', textAlign: 'center' }}>
  Quelle lettre as-tu entendue ?
</p>

<div onClick={rejouerSon} role="button" aria-label="Rejouer la lettre" style={{
  width: '130px',
  height: '130px',
  background: 'rgba(255,255,255,0.04)',
  border: feedback === 'correct' ? '1.5px solid rgba(88,204,2,0.4)' : feedback === 'wrong' ? '1.5px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
  borderRadius: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  marginBottom: '10px',
  alignSelf: 'center',
  transition: 'all 0.3s ease',
}}>
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M10 18 L18 18 L26 12 L26 36 L18 30 L10 30 Z" fill="#A78BFA"/>
    <path d="M32 18 Q36 24 32 30" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M36 14 Q42 24 36 34" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
</div>

<button onClick={rejouerSon} style={{
  background: 'rgba(139,92,246,0.12)',
  border: '1px solid rgba(139,92,246,0.25)',
  borderRadius: '20px',
  padding: '7px 16px',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '12px',
  color: '#A78BFA',
  marginBottom: '24px',
  alignSelf: 'center',
}}>
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
    <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  Réécouter
</button>
```

Suppression du gros bouton rond violet `120×120` actuel (remplacé par cette structure).

### 7. La bulle Neuri "Écoute bien le son…" en haut (avant la réponse)

Question d'UX à clarifier : dans Lesson.jsx il n'y a **pas** de bulle Neuri d'instruction en haut avant la réponse. Le label "Quelle lettre as-tu entendue ?" suffit. Je propose de **retirer** la bulle d'instruction actuelle (`"Écoute bien le son… Tu vas y arriver ! 💪"`) puisqu'elle fait doublon avec le label nouvellement ajouté → fidélité totale à la DA Lesson.jsx. À valider.

### 8. Header + bandeau score

**Reste inchangé** (le header de la page n'est pas touché par EcranExercice de Lesson.jsx). L'ajout DA porte uniquement sur la zone d'exercice elle-même.

---

## 🧱 Ce qui ne change PAS

- ✔ Header avec bouton retour + badge "FONDAMENTAUX" + titre "Écoute et choisis"
- ✔ Bandeau score + barre violette de progression (X / 10)
- ✔ Son beep Web Audio (OK/NOK) au moment de la réponse
- ✔ Voix anglaise TTS chargée au montage, lecture auto 500ms à chaque question
- ✔ Triple sécurité contre double-tap : `disabled` + early return + `cursor: 'default'`
- ✔ Bouton rejouer (la pastille Réécouter) **toujours actif**, même pendant le feedback
- ✔ Pré-calcul de la partie au montage (10 questions figées, Fisher-Yates)
- ✔ Cleanup AudioContext au unmount
- ✔ Écran de fin "Bravo" (inchangé)
- ✔ L'Ex 1 `/alphabet` strictement intact, et le bouton "🎧 Exercice 2" sur Alphabet.jsx

---

## ⚠️ Points d'attention

### A. Reset de state au passage à la question suivante
Le composant `AlphabetEcoute` ne se re-mount pas entre questions (contrairement à `EcranExercice` de Lesson.jsx qui a un `key={`ex-${etape}`}` qui force le remount). **Solution choisie** : reset manuel de tous les states dans `onContinuer()`. Plus simple qu'un sous-composant `Question` avec key.

### B. Cleanup du countdownRef
Deux endroits :
1. `onContinuer()` → clearInterval avant de remettre à null (au cas où l'intervalle tournerait encore)
2. `useEffect` cleanup au unmount du composant entier

### C. Animation `shrink` qui recommence à chaque question
Le `<style>{@keyframes shrink…}</style>` est global au composant et n'a pas besoin d'être re-déclaré. L'animation est appliquée à un nouvel élément `<div>` à chaque feedback → elle redémarre proprement à 0 à chaque fois.

### D. Bouton retour pendant le feedback
Le bouton retour du header reste actif. Si l'enfant tape "retour" pendant le countdown : navigate vers `/alphabet`, le composant se démonte, cleanup useEffect → `clearInterval` du countdown → propre. Pas de fuite.

### E. Réécouter pendant le feedback
La pastille "Réécouter" reste cliquable même pendant le countdown (consigne préservée). Elle relit la lettre — ce qui peut aider l'enfant à intégrer la bonne réponse pendant la phase d'apprentissage.

### F. Mise en page sous les cartes
L'ordre vertical dans `EcranExercice` de Lesson.jsx : grille des réponses → Neuri+bulle → countdown+bouton → texte erreur. Je reproduis le même ordre.

---

## 📋 Fichier touché

| Fichier | Action |
|---|---|
| `src/pages/AlphabetEcoute.jsx` | Refonte du bloc exercice (state, handlers, rendu feedback). L'écran de fin et le pré-calcul de partie sont inchangés. |

Aucun autre fichier touché. Aucune dépendance. Aucune migration BDD.

---

## ❓ Questions à valider avant exécution

1. **Suppression de la bulle Neuri d'instruction en haut** (`"💬 Écoute bien le son… Tu vas y arriver ! 💪"`) pour rester fidèle à la DA Lesson.jsx (qui n'en a pas avant la réponse) → OK ? Ou tu préfères la conserver malgré tout ?

2. **Remplacement du gros bouton rond violet 120×120** par la structure Lesson.jsx (carte 130×130 + pastille Réécouter en dessous) → OK ? Ou tu veux garder le gros bouton rond et juste ajouter la pastille en plus ?

3. **Renommage feedback `'ok'`/`'nok'` → `'correct'`/`'wrong'`** pour aligner sur le vocabulaire interne de Lesson.jsx → OK ? (Ça reste local à `AlphabetEcoute.jsx`.)

4. **Retirer les animations `scale(0.95)` au mousedown sur les cartes-réponses** (Lesson.jsx ne les a pas) pour cohérence DA → OK ?

Si OK, j'applique.
