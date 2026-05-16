# Plan — Fix TTS Alphabet : "capelle A" au lieu de "A"

## 🐛 Bug constaté

Au tap sur une carte de la page Alphabet, la voix dit `"capelle A"` ou `"cappel B"` à la place du simple `"A"` ou `"B"`. On veut entendre **uniquement la lettre prononcée à l'anglaise** ("ay", "bee", "see"…).

---

## 🔍 Diagnostic

### Lecture du code actuel

```js
function playLetter(letter, lang) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(letter)
    u.lang = TTS_MAP[lang] || 'en-US'
    u.rate = 0.7
    u.pitch = 1
    window.speechSynthesis.speak(u)
  }
}
```

L'argument est bien `letter` (juste "A", "B"…), `lang` est `'en-US'`. Le code TTS est correct sur le papier. **Mais on ne sélectionne aucune voix explicite** → on laisse Chrome/Safari choisir.

### Pourquoi le navigateur choisit-il mal la voix ?

La Web Speech API a un comportement piégeux :
- Si on définit `u.lang = 'en-US'` **sans** `u.voice`, le navigateur cherche une voix qui matche `'en-US'`.
- **Mais** sur un système macOS configuré en français, certains navigateurs (notamment Safari) **retombent sur la voix par défaut du système (française)** au lieu d'utiliser une vraie voix anglaise installée.
- La voix française tente alors de prononcer la chaîne `"A"` avec **les règles phonétiques françaises**, ce qui donne des sons parasites comme **"capelle"** (la voix essaie de phonétiser `"A"` en y ajoutant des artefacts liés au moteur français).

C'est un bug **côté système / navigateur**, qu'on contourne en **forçant une voix anglaise explicite** via `u.voice`.

### Sur le `rate: 0.7`

Wells suggérait de tester `rate: 1` pour écarter le rate comme cause. Mais le bug n'est **pas** un problème de rate — un débit lent ne produit pas un mot parasite, juste une lettre étirée. Donc on garde un rate réduit pour la lisibilité enfant. **`0.9` est un bon compromis** (plus naturel que 0.7, toujours plus lent qu'1).

---

## 🛠 Solution proposée

### Vue d'ensemble

1. **Charger la liste des voix au montage** du composant `Alphabet` (avec gestion de l'événement `voiceschanged`).
2. **Sélectionner la meilleure voix** pour la langue active (préfixe match, ex : `'en'`).
3. **Stocker dans un `useState`** au niveau du composant `Alphabet`.
4. **Passer la voix en prop** à `CarteRiche` et `CarteSimple`.
5. Dans le `onClick`, **passer la voix à `playLetter`** qui la mettra sur `u.voice`.
6. **Rate `0.9`** au lieu de `0.7`.
7. **Console.log temporaire** au montage pour que Wells puisse voir quelles voix sont chargées (à retirer après validation).

### Subtilité importante : `getVoices()` est async

Sur Chrome/Safari/Firefox, `window.speechSynthesis.getVoices()` renvoie souvent un **tableau vide au premier appel** parce que les voix sont chargées de façon asynchrone. Il faut **écouter l'événement `voiceschanged`** sur `speechSynthesis` pour récupérer la liste finale. Pattern standard :

```js
useEffect(() => {
  function chargerVoix() {
    const voix = window.speechSynthesis.getVoices()
    console.log('🎤 Voix disponibles:', voix.map(v => `${v.name} [${v.lang}]`))  // TEMP

    // Préfixe attendu pour la langue active
    const prefixe = codeLangue  // 'en', 'es', 'de', 'pt'

    // Priorité 1 : match exact sur TTS_MAP (ex: 'en-US')
    const langExact = TTS_MAP[codeLangue]
    let trouvee = voix.find(v => v.lang === langExact)
    // Priorité 2 : n'importe quelle voix dont le lang commence par le préfixe (ex: 'en-GB', 'en-AU')
    if (!trouvee) trouvee = voix.find(v => v.lang.toLowerCase().startsWith(prefixe))

    if (trouvee) {
      setVoix(trouvee)
      console.log('✅ Voix sélectionnée:', trouvee.name, trouvee.lang)  // TEMP
    } else {
      console.warn('⚠️ Aucune voix trouvée pour', codeLangue)  // TEMP
    }
  }

  chargerVoix()  // tentative immédiate (souvent vide)
  window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
  return () => {
    window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
  }
}, [codeLangue])
```

### Sélection de voix — règle

Pour `codeLangue = 'en'` :
1. **Match exact** : voix dont `v.lang === 'en-US'` (TTS_MAP[en])
2. **Préfixe** : sinon n'importe quelle voix dont `v.lang.startsWith('en')` — donc `en-GB`, `en-AU`, `en-IN` peuvent passer
3. **Fallback** : aucune voix trouvée → on ne définit pas `u.voice` (comportement actuel, sans casser)

Cette logique s'étend automatiquement à ES/DE/PT (chercher `'es'`, `'de'`, `'pt'`).

### Modification de `playLetter()`

```js
function playLetter(letter, lang, voix) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(letter)
  u.lang = TTS_MAP[lang] || 'en-US'
  if (voix) u.voice = voix  // ← LA CLÉ DU FIX
  u.rate = 0.9              // ← passé de 0.7 à 0.9
  u.pitch = 1
  window.speechSynthesis.speak(u)
}
```

### Modification des composants

```jsx
function CarteRiche({ item, codeLangue, voix }) {
  ...
  <button onClick={() => playLetter(item.lettre, codeLangue, voix)} ...>
  ...
}

function CarteSimple({ lettre, codeLangue, voix }) {
  ...
  <button onClick={() => playLetter(lettre, codeLangue, voix)} ...>
  ...
}

// Dans Alphabet :
const [voix, setVoix] = useState(null)
useEffect(() => { /* code de chargement ci-dessus */ }, [codeLangue])
// ...
<CarteRiche key={...} item={...} codeLangue={codeLangue} voix={voix} />
<CarteSimple key={...} lettre={...} codeLangue={codeLangue} voix={voix} />
```

---

## 📋 Fichier touché

| Fichier | Action |
|---|---|
| `src/pages/Alphabet.jsx` | Ajouts : `useState` + `useEffect` chargement voix ; modif signature `playLetter` ; props `voix` sur les 2 cartes ; `rate: 0.9` |

Aucun autre fichier touché. Aucune dépendance ajoutée. Aucun impact visuel.

---

## ⚠️ Cas limites à anticiper

1. **Voix non encore chargée au premier tap** : `voix` est `null` au tout début, jusqu'à ce que `voiceschanged` se déclenche. Si l'enfant tape **très vite** après l'arrivée sur la page → `u.voice` reste `undefined`, on retombe sur le comportement actuel (bug possible). En pratique, `voiceschanged` se résout en quelques dizaines de ms — négligeable.

2. **Aucune voix anglaise installée** : sur certains environnements (ex: Linux minimal), il se peut qu'aucune voix `en-*` ne soit dispo. Le warning console.log nous le dira. Dans ce cas on retombe sur le comportement actuel — pas pire qu'avant.

3. **Changement de langue active** : le `useEffect` a `codeLangue` en deps → si Wells passe de EN à ES, la voix sera rechargée. ✔

4. **Cleanup** : on enlève bien le listener au unmount via `return () => removeEventListener(...)` → pas de fuite.

5. **Logs temporaires** : laissés en place pour la phase de test. Une fois Wells satisfaite, je les retire dans un commit de suivi (ou tout de suite si Wells préfère). À toi de dire.

---

## ❓ À valider

1. **OK pour l'approche `useState` + `useEffect` + prop `voix`** au lieu d'une variable module-level ou d'un useRef ?
2. **OK pour `rate: 0.9`** (compromis lisibilité/naturel) ?
3. **Les `console.log` temporaires** : à retirer immédiatement après ton test visuel, ou à laisser en place pour debug ultérieur ?

Si OK, j'applique le fix.
