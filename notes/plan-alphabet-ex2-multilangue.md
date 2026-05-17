# Plan — Généralisation de l'Ex 2 "Écoute et choisis" multi-langues

## 🎯 Objectif

Rendre `src/pages/AlphabetEcoute.jsx` capable de fonctionner dans toutes les langues dont l'alphabet est rempli (aujourd'hui EN et ES, demain DE/PT). Pour les langues dont le tableau `ALPHABET_DATA` est encore vide → **fallback automatique sur l'anglais** pour ne pas crasher.

L'Ex 1 (`Alphabet.jsx`) et l'Ex 3 (`AlphabetChanson.jsx`) **ne sont pas touchés** dans ce sprint (consigne explicite).

---

## 🔍 Audit du code actuel — 7 occurrences "en" en dur

```
L30  : const toutesLesLettres = ALPHABET_DATA.en.map(...)        ← genererPartie()
L42  : const langue = getLangueByCode('en')                       ← composant
L65  : const langExact = TTS_MAP.en                               ← useEffect voix
L68  : trouvee = liste.find((v) => v.lang.toLowerCase().startsWith('en'))
L87  : playLetter(partie[questionActuelle].lettre, 'en', voix)    ← useEffect TTS auto
L141 : playLetter(partie[questionActuelle].lettre, 'en', voix)    ← rejouerSon()
L169 : playLetter(lettre, 'en', voix)                             ← repondre()
```

---

## 🛠 Modifications proposées

### 1. Récupération de la langue active + fallback

Ajout en haut du composant :

```js
import { getLangueActive, getLangueByCode } from '../utils/languages'
// ...

export default function AlphabetEcoute() {
  const navigate = useNavigate()
  const codeLangueDemandee = getLangueActive()
  // Fallback sur 'en' si la langue active n'a pas encore son alphabet rempli
  const codeLangueEffective =
    ALPHABET_DATA[codeLangueDemandee]?.length > 0 ? codeLangueDemandee : 'en'
  const langue = getLangueByCode(codeLangueEffective)
  // ...
}
```

**Décision sur le drapeau du header** : on affiche le drapeau de `codeLangueEffective` (pas `codeLangueDemandee`). Si un enfant a `de` en langue active et que les données allemandes ne sont pas encore remplies, il verra le drapeau 🇬🇧 + lettres anglaises → **cohérent**. Le scénario "drapeau allemand + lettres anglaises" serait trompeur. Quand les données DE seront remplies, ça basculera automatiquement.

**Note** : `getLangueActive()` lit le localStorage au montage. Si l'utilisateur change de langue sur une autre page puis revient sur l'Ex 2, le composant se re-mount à chaque navigation depuis `/learn` ou `/alphabet`, donc la nouvelle langue est prise en compte. ✔

### 2. `genererPartie` accepte un paramètre `codeLangue`

```js
function genererPartie(codeLangue) {
  const toutesLesLettres = ALPHABET_DATA[codeLangue].map((item) => item.lettre)
  const cibles = shuffle(toutesLesLettres).slice(0, 10)
  return cibles.map((lettre) => {
    const candidats = toutesLesLettres.filter((l) => l !== lettre)
    const distracteurs = shuffle(candidats).slice(0, 2)
    const cartes = shuffle([lettre, ...distracteurs])
    return { lettre, cartes }
  })
}
```

`genererPartie` est déclarée **hors** du composant (fonction pure), elle ne peut pas lire `codeLangueEffective`. On lui passe en argument.

**Lazy init de `useState`** :
```js
const [partie, setPartie] = useState(() => genererPartie(codeLangueEffective))
```

**Dans `rejouerPartie()`** :
```js
setPartie(genererPartie(codeLangueEffective))
```

### 3. `useEffect` de chargement de voix — multi-langue

```js
useEffect(() => {
  if (!('speechSynthesis' in window)) return

  function chargerVoix() {
    const liste = window.speechSynthesis.getVoices()
    const langExact = TTS_MAP[codeLangueEffective] || 'en-US'
    let trouvee = liste.find((v) => v.lang === langExact)
    if (!trouvee) {
      trouvee = liste.find((v) =>
        v.lang.toLowerCase().startsWith(codeLangueEffective)
      )
    }
    if (trouvee) setVoix(trouvee)
  }

  chargerVoix()
  window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
  return () => {
    window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
  }
}, [codeLangueEffective])
```

**Deps du useEffect** : ajout de `codeLangueEffective`. Comme la valeur est figée au mount (lue 1 fois via `getLangueActive`), elle ne change pas pendant la vie du composant → le useEffect ne re-tourne pas inutilement. Mais on l'inclut dans les deps pour respecter les règles ESLint et préparer un éventuel hook custom plus tard.

### 4. Remplacement des 3 appels `playLetter(..., 'en', voix)`

```diff
- playLetter(partie[questionActuelle].lettre, 'en', voix)
+ playLetter(partie[questionActuelle].lettre, codeLangueEffective, voix)
```

Aux 3 endroits : useEffect TTS auto (L87), `rejouerSon` (L141), `repondre` (L169).

### 5. Sub-composant `EcranFin` — pas de modif

Il ne dépend ni de la langue ni de l'alphabet : il affiche juste le score et les boutons. Aucun changement.

### 6. Header — pas de footer dans cette page

Wells mentionne un éventuel "footer affichant le nombre de lettres". **Note** : `AlphabetEcoute.jsx` n'a actuellement **pas de footer** comme `Alphabet.jsx`. La page affiche en haut `{questionActuelle + 1} / {partie.length}` (toujours 10) qui sert d'indicateur de progression. Pas besoin d'ajouter de footer ici. Si tu veux que j'en ajoute un (ex: "Langue : Espagnol"), me le dire.

---

## 📊 Récapitulatif des 8 changements ponctuels dans `AlphabetEcoute.jsx`

| # | Ligne actuelle | Modif |
|---|---|---|
| 1 | Imports | Ajouter `getLangueActive` (`getLangueByCode` déjà importé) |
| 2 | Début du composant | Ajouter `codeLangueDemandee` + `codeLangueEffective` + utiliser pour `langue` |
| 3 | `genererPartie` | Accepte `codeLangue` en param, utilise `ALPHABET_DATA[codeLangue]` |
| 4 | `useState(genererPartie)` | Devient `useState(() => genererPartie(codeLangueEffective))` |
| 5 | `rejouerPartie` | `genererPartie()` → `genererPartie(codeLangueEffective)` |
| 6 | `useEffect` chargement voix | `TTS_MAP.en` → `TTS_MAP[codeLangueEffective]` + `startsWith('en')` → `startsWith(codeLangueEffective)` + dep |
| 7 | useEffect TTS auto (L87) | `'en'` → `codeLangueEffective` |
| 8 | `rejouerSon` (L141) + `repondre` (L169) | `'en'` → `codeLangueEffective` × 2 |

---

## ⚠️ Points d'attention

### A. Fallback sur EN pour les langues non remplies
- `de` et `pt` ont `ALPHABET_DATA[code] = []` aujourd'hui → fallback transparent sur `en`. L'enfant voit le drapeau 🇬🇧 et joue avec les lettres anglaises. Pas idéal pédagogiquement, mais évite un crash. Quand on remplira DE/PT, bascule automatique.

### B. Voix non disponible dans la langue cible
Si le système n'a pas de voix `es-*` installée (cas limite Linux/headless), le fallback du useEffect actuel retombe sur "rien" (`voix = null`) → `playLetter` lit quand même le texte mais avec la voix système par défaut. Le bug "capelle A" qu'on avait fixé avant peut revenir ici si l'OS n'a pas de voix espagnole. Acceptable comme cas limite — la plupart des Mac/iOS modernes ont des voix multiples.

### C. Espagnol : 27 lettres (avec Ñ)
La logique `slice(0, 10)` continue de marcher sans ajustement : on tire 10 lettres au hasard parmi 27. Les distracteurs sont aussi tirés parmi les 26 autres. Pas de souci.

### D. La carte Ñ et le TTS
La lettre Ñ va être lue par la voix espagnole comme "eñe". `letter.toLowerCase()` donne `'ñ'` qui est bien différencié de `'n'`. Vérifier visuellement que le TTS prononce bien la nuance.

### E. La fonction `playLetter` reste en haut du fichier
Elle accepte déjà le paramètre `lang`. Aucune modif sur sa signature. C'est juste les 3 appelants qui passent maintenant `codeLangueEffective` au lieu de `'en'`.

### F. `genererPartie` hors composant : fonction pure
Avantage : reste pure, testable. Inconvénient mineur : on doit lui passer `codeLangue` à chaque appel. Acceptable.

---

## 🧪 Plan de test (après application)

1. `npm run dev`
2. **Test EN (régression)** :
   - Langue active = anglais (par défaut)
   - Naviguer sur `/alphabet/ecoute`
   - ✔ Drapeau 🇬🇧 dans le header
   - ✔ 10 questions piochées dans A-Z, prononciation anglaise (`en-US`)
   - ✔ TTS au tap : lit la lettre tapée en anglais
   - ✔ Bulle Neuri "Presque ! C'était K." en cas d'erreur (lettre EN)
3. **Test ES** :
   - Basculer la langue active sur Espagnol (Settings)
   - Naviguer sur `/alphabet/ecoute`
   - ✔ Drapeau 🇪🇸 dans le header
   - ✔ 10 questions piochées dans A-Z + Ñ, prononciation espagnole (`es-ES`)
   - ✔ Possibilité qu'une carte Ñ apparaisse (probabilité ~10/27 par question)
   - ✔ Bulle Neuri "Presque ! C'était Ñ." si erreur sur une Ñ
   - ✔ TTS au tap : voix espagnole sélectionnée par le useEffect
4. **Test DE/PT (fallback)** :
   - Basculer en allemand ou portugais
   - Naviguer sur `/alphabet/ecoute`
   - ✔ Drapeau 🇬🇧 (pas 🇩🇪 / 🇵🇹) → indique clairement le fallback
   - ✔ 10 questions anglaises avec voix anglaise, pas de crash
5. **Régression Ex 1** : `/alphabet` toujours fonctionnel dans toutes les langues
6. **Régression Ex 3** : `/alphabet/chanson` toujours fonctionnel (anglais en dur, hors scope)

---

## ❓ Questions à valider avant exécution

1. **Drapeau de fallback** : si la langue active n'a pas son alphabet rempli (DE/PT aujourd'hui), j'affiche le **drapeau 🇬🇧** dans le header (cohérence avec le contenu joué). OK ? Alternative : afficher le drapeau de la langue demandée + texte "(en anglais en attendant…)" — mais ça ajoute de la complexité UI pour un cas qui sera résolu dès qu'on remplira DE/PT.

2. **Pas de footer "X lettres · Langue"** dans `AlphabetEcoute.jsx` (cette page n'en a pas aujourd'hui, le compteur "Y / 10" en haut suffit). OK ? Ou tu veux que j'en ajoute un en bas comme dans `Alphabet.jsx` ?

3. **`codeLangueEffective` comme variable locale au composant** (pas un state) → calculée à chaque render à partir de `getLangueActive()`. Comme `getLangueActive` lit le localStorage à chaque appel, ce n'est pas figé : si l'utilisateur change la langue sur un autre onglet pendant l'exo, un re-render pourrait basculer à mi-partie. Risque très faible (un seul onglet), mais à noter. **Mitigation possible** : figer la langue au mount via `useState(() => getLangueActive())`. À toi de me dire si tu veux cette protection.

Si OK, j'applique.
