# Rapport — Fix TTS Alphabet : sélection explicite d'une voix anglaise

## ✅ Résultat

Le composant `Alphabet` charge maintenant **la liste des voix TTS disponibles au montage**, sélectionne **la première voix anglaise** correspondant à la langue active, et **force cette voix** sur chaque utterance. Plus de retour sur la voix française système → fini les `"capelle A"`, on entend juste `"A"` (prononciation anglaise propre).

⚠️ **Les `console.log` de debug sont en place** pour ton premier test. Une fois la voix anglaise confirmée chargée, je les retire dans un patch de suivi (voir section finale).

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/pages/Alphabet.jsx` | Ajout `useState` + `useEffect` chargement des voix ; modif `playLetter()` ; prop `voix` sur les 2 cartes ; rate `0.7` → `0.9` |

Aucun autre fichier touché. Aucune dépendance ajoutée. Aucun impact visuel.

---

## 🔧 Détail des changements

### 1. `playLetter()` — accepte une voix explicite + rate 0.9

```js
function playLetter(letter, lang, voix) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(letter)
  u.lang = TTS_MAP[lang] || 'en-US'
  if (voix) u.voice = voix      // ← LA CLÉ DU FIX
  u.rate = 0.9                   // ← passé de 0.7 à 0.9
  u.pitch = 1
  window.speechSynthesis.speak(u)
}
```

Si `voix` est `null` (chargement non encore terminé ou aucune voix trouvée), `u.voice` n'est pas défini et on retombe sur le comportement actuel — sans casser, et sans pire qu'avant.

### 2. `Alphabet` — chargement et sélection de voix au montage

```js
const [voix, setVoix] = useState(null)

useEffect(() => {
  if (!('speechSynthesis' in window)) return

  function chargerVoix() {
    const liste = window.speechSynthesis.getVoices()
    console.log('🎤 Voix disponibles:', liste.map(v => `${v.name} [${v.lang}]`))

    // Priorité 1 : match exact sur TTS_MAP (ex: 'en-US')
    const langExact = TTS_MAP[codeLangue]
    let trouvee = liste.find(v => v.lang === langExact)

    // Priorité 2 : préfixe (accepte 'en-GB', 'en-AU', etc.)
    if (!trouvee) {
      trouvee = liste.find(v => v.lang.toLowerCase().startsWith(codeLangue))
    }

    if (trouvee) {
      setVoix(trouvee)
      console.log('✅ Voix sélectionnée:', trouvee.name, trouvee.lang)
    } else {
      console.warn('⚠️ Aucune voix trouvée pour', codeLangue)
    }
  }

  chargerVoix()
  window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
  return () => {
    window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
  }
}, [codeLangue])
```

**Pourquoi `voiceschanged`** : `getVoices()` renvoie souvent un tableau vide au premier appel (les voix sont chargées de façon asynchrone par le navigateur). On écoute donc `voiceschanged` qui se déclenche dès que la liste est prête. On fait quand même un appel immédiat au cas où elles seraient déjà chargées (Safari par exemple).

**Re-déclenchement quand `codeLangue` change** : si l'enfant passe de EN à ES (futur), le useEffect re-tourne automatiquement et resélectionne la bonne voix.

**Cleanup** : le listener est retiré au unmount → pas de fuite.

### 3. `CarteRiche` et `CarteSimple` — reçoivent la voix en prop

```diff
-function CarteRiche({ item, codeLangue }) {
+function CarteRiche({ item, codeLangue, voix }) {
   ...
-      onClick={() => playLetter(item.lettre, codeLangue)}
+      onClick={() => playLetter(item.lettre, codeLangue, voix)}

-function CarteSimple({ lettre, codeLangue }) {
+function CarteSimple({ lettre, codeLangue, voix }) {
   ...
-      onClick={() => playLetter(lettre, codeLangue)}
+      onClick={() => playLetter(lettre, codeLangue, voix)}
```

Et dans le rendu de la grille :

```diff
-<CarteRiche key={item.lettre} item={item} codeLangue={codeLangue} />
+<CarteRiche key={item.lettre} item={item} codeLangue={codeLangue} voix={voix} />

-<CarteSimple key={i} lettre={lettre} codeLangue={codeLangue} />
+<CarteSimple key={i} lettre={lettre} codeLangue={codeLangue} voix={voix} />
```

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur le fichier touché (les 15 problèmes préexistants sur d'autres pages sont inchangés).
- [x] **Imports** : ajout de `useEffect, useState` depuis `react` (en haut du fichier).
- [x] **`aria-label`, `aria-hidden`, `alt=""`** du fix précédent toujours en place — pas de régression d'accessibilité.
- [x] **Aucun changement visuel**.
- [x] **Robustesse** : si aucune voix `en-*` n'est installée, on retombe sur le comportement actuel sans crash.

---

## 🧪 Test à faire (Wells)

1. **Ouvrir la console du navigateur** (F12 → Console).
2. Naviguer vers la page **Alphabet** en anglais.
3. Vérifier dans la console :
   - 🎤 ligne `"Voix disponibles: [...]"` → liste des voix de ta machine
   - ✅ ligne `"Voix sélectionnée: <nom>, <lang>"` → ex: `"Samantha en-US"`, `"Daniel en-GB"`, ou similaire
   - ⚠️ si tu vois `"Aucune voix trouvée pour en"` → me prévenir (cas limite, peu probable sur un Mac)
4. **Taper sur une carte** : tu dois entendre **uniquement la lettre prononcée à l'anglaise** ("ay", "bee", "see"…).

Si tout est OK → tu me confirmes et je retire les 3 `console.log` dans un patch de suivi (modif minimale du fichier).
Si problème → tu me partages les logs de la console et on adapte.

---

## 🧹 Patch de suivi prévu (après ta validation)

Une fois la voix anglaise confirmée :

- Retrait des 3 lignes `console.log` / `console.warn` du `useEffect`
- Aucune autre modification

Je ferai ça à ta demande, dans le même fichier, dans un commit séparé.
