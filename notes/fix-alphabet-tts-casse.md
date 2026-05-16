# Rapport — Fix TTS Alphabet : "capital A" annoncé avant la lettre

## 🐛 Bug constaté

Au tap sur une carte de la page Alphabet, la voix anglaise dit `"capital A"` (puis "ay") au lieu de prononcer **uniquement** la lettre.

## 🔍 Cause

C'est un comportement **par défaut de macOS / iOS** (et plus généralement des moteurs TTS Apple) : quand on envoie une **majuscule isolée** à `SpeechSynthesisUtterance`, le système l'interprète comme un caractère significatif et **annonce explicitement la casse** ("capital A", "capital B"…) avant de prononcer la lettre. C'est destiné aux lecteurs d'écran qui doivent distinguer "A" majuscule de "a" minuscule pour les utilisateurs non-voyants.

Sur cette page, le contexte est purement pédagogique (apprendre l'alphabet) — la distinction de casse n'a aucune utilité, on veut juste entendre la lettre.

## 🛠 Fix

**Une seule ligne modifiée** dans `src/pages/Alphabet.jsx`, dans la fonction `playLetter()` :

```diff
-  const u = new SpeechSynthesisUtterance(letter)
+  const u = new SpeechSynthesisUtterance(letter.toLowerCase())
```

→ La lettre est envoyée en **minuscule** au moteur TTS, qui ne déclenche plus l'annonce de casse.

## ✅ Ce qui reste strictement inchangé

- **Visuel** : la lettre affichée dans la carte reste en **majuscule** (`item.lettre` = `'A'`, le span affiche `A`). Seul le texte envoyé au TTS est en minuscule.
- **Sélection de voix** : la voix anglaise chargée via `useEffect` et passée en prop `voix` → toujours en place.
- **`rate: 0.9`**, **`u.pitch = 1`** → inchangés.
- **`aria-label` / `aria-hidden` / `alt=""`** du fix accessibilité → toujours en place.
- **`CarteRiche` / `CarteSimple`** → aucune modification de signature ni de comportement.
- **Logs `console.log` temporaires** dans le `useEffect` → toujours présents (à retirer dans un patch de suivi quand tu valideras).

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/pages/Alphabet.jsx` | 1 ligne : `letter` → `letter.toLowerCase()` dans `playLetter()` |

Aucun autre fichier touché.

## 🧪 À tester (Wells)

1. Naviguer vers la page **Alphabet** en anglais.
2. Taper sur la carte "A".
3. ✔ La voix doit dire **uniquement "ay"** (prononciation anglaise de A) — plus de "capital A" parasite avant.
4. Tester sur d'autres lettres (B, C, M, X, Z) pour confirmer le comportement uniforme.

## 💡 Pourquoi ce fix est sûr

- `letter.toLowerCase()` sur les 26 lettres latines + lettres avec accents (Ñ, Ä, Ö, Ü) → tous gèrent la conversion en minuscule sans surprise.
- `'ß'.toLowerCase() === 'ß'` (déjà minuscule en allemand) → pas d'effet de bord.
- La conversion ne change pas l'**identité phonétique** : le TTS prononce "a" et "A" exactement de la même façon dans une langue donnée — seule l'annonce méta-textuelle de la casse disparaît.
