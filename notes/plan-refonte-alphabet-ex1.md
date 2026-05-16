# Plan — Refonte `Alphabet.jsx` (Exercice 1) — mode "carte riche"

## 🎯 Objectif

Transformer la grille actuelle de `Alphabet.jsx` (simples boutons "A", "B", "C"…) en grille de **cartes pédagogiques** type maquette « Apprenons l'alphabet » :

```
┌──────────┐
│ A        │   ← lettre violette en absolute (top-left)
│          │
│   🍎     │   ← image MidJourney détourée (PNG transparent)
│          │
│  Apple   │   ← mot anglais sous l'image
└──────────┘
```

Le TTS au tap est conservé (lettre, en-US, rate 0.7).

## ✅ Périmètre du sprint

| Langue | Comportement |
|---|---|
| 🇬🇧 EN | **Mode riche** — cartes lettre + image + mot (nouveau) |
| 🇪🇸 ES | **Mode simple** — grille de lettres seules (inchangé) |
| 🇩🇪 DE | **Mode simple** — grille de lettres seules (inchangé) |
| 🇵🇹 PT | **Mode simple** — grille de lettres seules (inchangé) |

L'architecture est prête pour activer le mode riche sur ES/DE/PT plus tard (il suffira de remplir leur tableau dans `alphabetData.js`).

---

## 📁 Nouveau fichier : `src/data/alphabetData.js`

(Le dossier `src/data/` n'existe pas encore, à créer.)

```js
// Données alphabet par langue.
// Ajouter une langue : remplir son tableau ici puis uploader les images
// dans Supabase Storage (bucket lecons-images, dossier alphabet/<code>/).
//
// Tant qu'un tableau est vide, le composant Alphabet retombe en mode "grille
// simple" (juste les lettres) sur la langue concernée.

export const ALPHABET_DATA = {
  en: [
    { lettre: 'A', mot: 'Apple',     image: 'a.png' },
    { lettre: 'B', mot: 'Bee',       image: 'b.png' },
    { lettre: 'C', mot: 'Cat',       image: 'c.png' },
    { lettre: 'D', mot: 'Dog',       image: 'd.png' },
    { lettre: 'E', mot: 'Elephant',  image: 'e.png' },
    { lettre: 'F', mot: 'Frog',      image: 'f.png' },
    { lettre: 'G', mot: 'Guitar',    image: 'g.png' },
    { lettre: 'H', mot: 'Hat',       image: 'h.png' },
    { lettre: 'I', mot: 'Ice cream', image: 'i.png' },
    { lettre: 'J', mot: 'Jellyfish', image: 'j.png' },
    { lettre: 'K', mot: 'Key',       image: 'k.png' },
    { lettre: 'L', mot: 'Lion',      image: 'l.png' },
    { lettre: 'M', mot: 'Moon',      image: 'm.png' },
    { lettre: 'N', mot: 'Nest',      image: 'n.png' },
    { lettre: 'O', mot: 'Orange',    image: 'o.png' },
    { lettre: 'P', mot: 'Panda',     image: 'p.png' },
    { lettre: 'Q', mot: 'Queen',     image: 'q.png' },
    { lettre: 'R', mot: 'Rainbow',   image: 'r.png' },
    { lettre: 'S', mot: 'Sun',       image: 's.png' },
    { lettre: 'T', mot: 'Tomato',    image: 't.png' },
    { lettre: 'U', mot: 'Umbrella',  image: 'u.png' },
    { lettre: 'V', mot: 'Van',       image: 'v.png' },
    { lettre: 'W', mot: 'Whale',     image: 'w.png' },
    { lettre: 'X', mot: 'Xylophone', image: 'x.png' },
    { lettre: 'Y', mot: 'Yo-yo',     image: 'y.png' },
    { lettre: 'Z', mot: 'Zebra',     image: 'z.png' },
  ],
  de: [],
  es: [],
  pt: [],
}

const STORAGE_BASE_URL =
  'https://mpdobvqulzbtvtdfeahf.supabase.co/storage/v1/object/public/lecons-images/alphabet'

// Construit l'URL Supabase Storage pour une image d'alphabet.
export function getAlphabetImageUrl(codeLangue, nomImage) {
  if (!codeLangue || !nomImage) return null
  return `${STORAGE_BASE_URL}/${codeLangue}/${nomImage}`
}
```

**Note technique** : l'URL de base est dupliquée (elle est aussi utilisée pour les images de leçons), mais c'est volontaire — `alphabetData.js` reste autonome et lisible, sans dépendance croisée. On factorisera plus tard si besoin (un constant `STORAGE_BASE` global), mais hors scope ici.

---

## 🧱 Modification mineure : `LeconThumbnail.jsx`

Le composant actuel a deux contraintes qui le rendent inutilisable tel quel pour l'alphabet :
- `objectFit: 'cover'` → coupe les images détourées (on veut `contain` pour préserver les proportions + la transparence)
- Dimensions en `px` figés (`size + 'px'`) → ici on veut **remplir le conteneur** (la zone "image" de la carte fait ~60% de la hauteur, c'est-à-dire un nombre variable de px selon la largeur d'écran)

Je propose d'**étendre le composant** avec deux props optionnelles **sans casser les usages existants** :

```jsx
export default function LeconThumbnail({
  imageUrl,
  size = 40,
  borderRadius = 10,
  alt = '',
  objectFit = 'cover',   // ← NOUVEAU (défaut : comportement actuel)
  fill = false,           // ← NOUVEAU (si true → width/height 100%, ignore size)
}) {
  // ... même logique onError ...

  const dimensionStyle = fill
    ? { width: '100%', height: '100%' }
    : { width: size + 'px', height: size + 'px' }

  // Placeholder : si fill, on remplit aussi le conteneur
  if (afficherPlaceholder) {
    return (
      <div aria-hidden="true" style={{
        ...dimensionStyle,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }} />
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErreurImage(true)}
      style={{
        ...dimensionStyle,
        borderRadius: borderRadius + 'px',
        objectFit,                          // ← utilise la prop
        background: 'transparent',          // ← transparent si fond détouré
        flexShrink: 0,
        display: 'block',
      }}
    />
  )
}
```

✔ Tous les appels actuels continuent de marcher (props par défaut = comportement actuel).
✔ Dans `Alphabet.jsx`, on appelle avec `fill objectFit="contain"`.

**Alternative possible** : si tu préfères ne pas toucher `LeconThumbnail`, je peux dupliquer la logique `onError` directement dans `Alphabet.jsx` (composant local non exporté). Mais ça reviendrait à dupliquer 10 lignes — l'extension est plus propre.

---

## 🧩 Refonte de `Alphabet.jsx`

### Logique de choix du mode

```js
const codeLangue = getLangueActive()
const donnees = ALPHABET_DATA[codeLangue] || []
const modeRiche = donnees.length > 0

// Mode simple : fallback sur l'ancien tableau ALPHABETS (lettres seules)
const lettresSimples = ALPHABETS[codeLangue] || ALPHABETS.en
```

### Header / instruction / footer → **inchangés**

On garde tel quel :
- Bouton retour `/learn`
- Badge `{drapeau} FONDAMENTAUX` + titre "L'Alphabet"
- Bulle violette "Touche une lettre pour entendre sa prononciation"
- Footer "X lettres · {nom langue}" (compte = `donnees.length` ou `lettresSimples.length`)

### Grille — deux variantes

```jsx
{modeRiche ? (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
    {donnees.map(item => <CarteRiche key={item.lettre} item={item} codeLangue={codeLangue} />)}
  </div>
) : (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
    {lettresSimples.map((lettre, i) => <CarteSimple key={i} lettre={lettre} codeLangue={codeLangue} />)}
  </div>
)}
```

### Carte riche (mode EN)

```
┌────────────────────────┐
│ ╭A╮                    │  position absolute, top:8px left:12px
│                        │
│       ┌──────┐         │
│       │ IMG  │         │  ~60-65% de la hauteur, objectFit:contain
│       └──────┘         │
│                        │
│        Apple           │  fontSize 12-13px, centré
└────────────────────────┘
   aspectRatio 1:1
   background rgba(255,255,255,0.04)
   border 1.5px rgba(139,92,246,0.25)
   borderRadius 18px
   padding 12px
   position relative
```

Layout interne : flex column, `justifyContent: 'center'`, `alignItems: 'center'`, gap petit entre image et mot.

**Lettre** :
- `position: absolute`, `top: 8px`, `left: 12px`
- Couleur `#A78BFA`, `fontSize: 28px`, Nunito 900
- `pointerEvents: 'none'` pour pas gêner le clic sur la carte

**Image** :
- Conteneur flex de hauteur ~60% de la carte (via `flex: 1` + `maxHeight` ou `height: 60%`)
- `<LeconThumbnail imageUrl={getAlphabetImageUrl(codeLangue, item.image)} fill objectFit="contain" borderRadius={0} alt={item.mot} />`
- Si image 404 → placeholder cercle gris (déjà géré par `LeconThumbnail`)

**Mot** :
- `fontSize: 12px` (ou 13px selon largeur), DM Sans 600
- Couleur `rgba(255,255,255,0.85)`, centré, `marginTop: 6px`

**Tap** :
- `onClick` → `playLetter(item.lettre, codeLangue)`
- `onMouseDown`/`onMouseUp` → `scale(0.95)` + glow violet renforcé (même logique que carte simple actuelle)

### Carte simple (mode ES/DE/PT)

= Bouton actuel **strictement inchangé**, juste extrait dans un mini-composant pour lisibilité.

---

## 📐 Mockup ASCII final (mode riche, 3 colonnes)

```
┌──────────────────────────────────────────┐
│ ←   🇬🇧 FONDAMENTAUX                      │
│     L'Alphabet                            │
├──────────────────────────────────────────┤
│ 👆 Touche une lettre pour entendre…       │
├──────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │A       │ │B       │ │C       │         │
│ │   🍎   │ │   🐝   │ │   🐱   │         │
│ │ Apple  │ │  Bee   │ │  Cat   │         │
│ └────────┘ └────────┘ └────────┘         │
│ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │D       │ │E       │ │F       │         │
│ │   🐕   │ │   🐘   │ │   🐸   │         │
│ │  Dog   │ │Elephant│ │ Frog   │         │
│ └────────┘ └────────┘ └────────┘         │
│           ...etc 26 lettres               │
├──────────────────────────────────────────┤
│      26 lettres · Anglais                 │
└──────────────────────────────────────────┘
```

---

## ⚠️ Points d'attention

1. **Fond carte vs transparence image** : `rgba(255,255,255,0.04)` sur fond `#090E1A` reste très sombre → les PNG détourés (sujets souvent colorés) ressortiront bien. À vérifier visuellement après l'application.
2. **Mot "Ice cream"** (2 mots, espace) → tronquer si trop long ? Je propose `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'` pour les cartes étroites en mobile 430px. Si un mot dépasse, on verra "Ice cre…" plutôt que de casser le layout. À valider.
3. **3 colonnes** sur 430px → chaque carte fait ~127px de large (430 − 40 padding − 24 gap) / 3. Lisible.
4. **Lettres supplémentaires (Ñ Ä Ö Ü ß)** : seulement visibles en mode simple (ES/DE) car `ALPHABETS.es` et `ALPHABETS.de` les contiennent déjà. Quand on remplira `ALPHABET_DATA.es/de`, il faudra penser à y inclure ces lettres.
5. **Pas de migration BDD** — toutes les données sont en dur dans `src/data/alphabetData.js` (✔ conforme à la consigne).
6. **TTS** → la fonction `playLetter()` actuelle n'est pas touchée. En mode riche, on lit toujours **la lettre** (pas le mot). Si tu veux qu'on lise aussi le mot (« A… Apple »), à me préciser — ce n'est pas dans la consigne donc je laisse seulement la lettre.

---

## 📋 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/data/alphabetData.js` | **Créer** (avec dossier `src/data/`) |
| `src/components/LeconThumbnail.jsx` | **Étendre** (2 props optionnelles, rétro-compatible) |
| `src/pages/Alphabet.jsx` | **Refondre** (rendu conditionnel riche/simple) |

Aucun autre fichier touché. Aucune dépendance ajoutée.

---

## ❓ Questions à valider avant exécution

1. **Extension de `LeconThumbnail`** : OK pour ajouter les props `fill` et `objectFit` ? (Sinon → variante avec mini-composant local dans `Alphabet.jsx`.)
2. **Truncate des mots longs** ("Ice cream", "Jellyfish", "Xylophone", "Umbrella") avec `…` si overflow : OK ?
3. **TTS au tap** : on lit seulement **la lettre** (comme aujourd'hui), pas le mot — confirmé ?

Une fois ces 3 points tranchés, je peux passer à l'exécution.
