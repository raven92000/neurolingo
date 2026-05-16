# Rapport — Refonte `Alphabet.jsx` (Exercice 1) — mode "carte riche"

## ✅ Résultat

La page **Alphabet** affiche désormais une grille de **cartes pédagogiques** (lettre violette + image détourée + mot) pour l'**anglais**, avec fallback automatique sur l'ancienne grille de lettres seules pour ES / DE / PT (en attendant qu'on remplisse leurs données et images).

## 📁 Fichiers modifiés

| Fichier | Statut | Action |
|---|---|---|
| `src/data/alphabetData.js` | **Créé** | Données alphabet par langue + helper URL Supabase |
| `src/components/LeconThumbnail.jsx` | **Étendu** | 2 props optionnelles `fill` + `objectFit` (rétro-compatible) |
| `src/pages/Alphabet.jsx` | **Refondu** | Rendu conditionnel riche/simple, split en sous-composants |

Aucun autre fichier touché. Aucune dépendance ajoutée. Aucune migration BDD.

---

## 🔧 Détail des changements

### 1. `src/data/alphabetData.js` (nouveau)

- Export `ALPHABET_DATA` : objet indexé par code langue, contenant pour l'EN les 26 entrées `{ lettre, mot, image }` du plan validé.
- Tableaux `de`, `es`, `pt` **volontairement vides** → activeront automatiquement le mode riche dès qu'on les remplira.
- Export `getAlphabetImageUrl(codeLangue, nomImage)` : construit l'URL Supabase Storage publique `…/lecons-images/alphabet/{codeLangue}/{nomImage}`. Retourne `null` si paramètres manquants → géré par le fallback de `LeconThumbnail`.

### 2. `src/components/LeconThumbnail.jsx` (étendu)

Deux nouvelles props **optionnelles**, défauts identiques à l'ancien comportement :

| Prop | Défaut | Effet |
|---|---|---|
| `fill` | `false` | Si `true`, `width: 100%` + `height: 100%` (au lieu de `size`px) |
| `objectFit` | `'cover'` | Permet `'contain'` pour préserver les proportions des PNG détourés |

Bonus : quand `objectFit === 'contain'`, le composant supprime aussi le fond gris (`background: transparent`) et la bordure de l'image, pour que la transparence du PNG s'exprime pleinement. Sinon (cover, défaut), le visuel reste 100% identique à avant.

✔ Tous les appels existants à `<LeconThumbnail imageUrl={...} size={...} borderRadius={...} />` continuent de fonctionner sans modification.

### 3. `src/pages/Alphabet.jsx` (refondu)

**Découpage** en 2 sous-composants internes pour la lisibilité :

- `<CarteRiche item codeLangue />` — carte image+mot, grille 3 colonnes
- `<CarteSimple lettre codeLangue />` — bouton lettre seule, grille 4 colonnes (comportement ancien préservé)

**Logique de bascule** :

```js
const donneesRiches = ALPHABET_DATA[codeLangue] || []
const modeRiche = donneesRiches.length > 0
const lettresSimples = ALPHABETS[codeLangue] || ALPHABETS.en
```

→ Aujourd'hui : `en` = riche, `es`/`de`/`pt` = simple.
→ Demain (quand on remplit les données) : il suffit d'ajouter les entrées dans `ALPHABET_DATA[code]`, **aucun code à toucher**.

**Layout `CarteRiche`** (carte 1:1, padding 12px, paddingTop 32px pour laisser place à la lettre absolue) :
- **Lettre** : `position: absolute` top:8 left:12, `#A78BFA`, 28px Nunito 900, `pointerEvents: none` (n'intercepte pas le clic)
- **Image** : conteneur flex centré (`flex: 1`, `minHeight: 0`) → `<LeconThumbnail fill objectFit="contain" borderRadius={0} />`
- **Mot** : DM Sans 600, blanc 85%, taille **adaptative** selon longueur, `whiteSpace: 'nowrap'` (pas de saut de ligne)

**Taille de police adaptative du mot** (helper `taillePoliceMot`) :

| Longueur du mot | Taille |
|---|---|
| ≤ 7 caractères | 13px |
| 8–9 caractères | 12px |
| ≥ 10 caractères | 11px |

Sur les 26 mots EN : les 8/9 caractères (`Elephant`, `Ice cream`, `Jellyfish`, `Umbrella`, `Xylophone`) tomberont à 12px, les autres restent à 13px. Aucun mot ≥ 10 caractères pour l'instant — la règle 11px est prête pour de futurs vocabulaires plus longs.

**Animation tap** : reprise telle quelle de la carte simple (`scale(0.95)` + glow violet renforcé).

**TTS** : `playLetter(lettre, codeLangue)` au clic → **seulement la lettre** (en-US, rate 0.7), comportement inchangé.

**Header / bulle / footer** : strictement identiques à avant. Le footer compte automatiquement les bonnes lettres selon le mode.

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun nouveau warning/erreur sur les 3 fichiers touchés. Les 15 problèmes affichés (11 erreurs + 4 warnings) sont **tous préexistants** sur d'autres pages (Lesson, Profile, SentenceExercise, Settings, Shop) et hors scope.
- [x] **Rétro-compatibilité `LeconThumbnail`** : les props ajoutées sont optionnelles, défauts = comportement actuel. Aucun appel existant ne casse.
- [x] **Mode simple préservé** : ES/DE/PT continuent d'afficher exactement la même grille de 4 colonnes qu'avant, avec les lettres supplémentaires (Ñ, Ä, Ö, Ü, ß).
- [x] **Imports propres** : pas d'import inutilisé.
- [x] **Pas de `console.log`** oublié.
- [x] **DA respectée** : fond `#090E1A`, glow violet, cartes arrondies, lettre `#A78BFA`, mobile-first 430px.

---

## 🧪 À tester visuellement (Wells)

1. Lancer `npm run dev` → naviguer vers la page Alphabet en langue **anglais** :
   - ✔ Cartes 3 colonnes avec lettre violette en haut-gauche, image au centre, mot en bas
   - ✔ Image détourée bien visible sur le fond bleu nuit (la transparence du PNG est respectée)
   - ✔ Tap → TTS lit la lettre + animation scale + glow violet
   - ✔ Si une image manque → cercle vide gris s'affiche à la place (placeholder LeconThumbnail)
   - ✔ Mots longs (`Elephant`, `Ice cream`, `Jellyfish`, `Umbrella`, `Xylophone`) → tiennent sur une seule ligne en 12px
2. Passer en **espagnol / allemand / portugais** :
   - ✔ Grille de 4 colonnes avec lettres seules (comme avant)
   - ✔ Footer affiche le bon nombre (27 ES, 30 DE, 26 PT)

---

## 🔮 Pour activer le mode riche sur ES/DE/PT plus tard

1. Générer les vocabulaires et les images MidJourney détourées (PNG transparent) par langue.
2. Uploader dans Supabase Storage sous `lecons-images/alphabet/{code}/`.
3. Remplir le tableau correspondant dans `src/data/alphabetData.js` (`ALPHABET_DATA.de`, `.es`, `.pt`).
4. ✨ Rien d'autre à toucher — la page bascule automatiquement en mode riche dès que le tableau n'est pas vide.

⚠️ Penser à inclure les lettres supplémentaires (Ñ pour ES ; Ä, Ö, Ü, ß pour DE) dans les tableaux correspondants.
