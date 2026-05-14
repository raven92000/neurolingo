# Plan — Fix `Lesson.jsx` : afficher image vs emoji selon `image_url`

## 🎯 Contexte

La colonne `mots.image_url` contenait jusqu'ici des emojis unicode
(`"🐱"`, `"🐶"`, etc.). On vient d'y mettre, pour les 10 mots de la
leçon **« Les Animaux »** (langue `en`), des URLs Supabase Storage
publiques pointant vers le bucket `lecons-images` (sous-dossier
`mots/`).

Sur l'écran enfant `Lesson.jsx`, le composant `EmojiGeant` affiche
`image_url` dans un `<span style={{ fontSize: '72px' }}>{emoji}</span>`
→ donc l'URL en gros texte au lieu de l'image.

---

## 📍 Repère exact dans le code

**Fichier** : [src/pages/Lesson.jsx](src/pages/Lesson.jsx)

**1 seul composant à modifier** : `EmojiGeant` (lignes 8-22)

```jsx
function EmojiGeant({ emoji }) {
  if (!emoji) {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="24" fill="#8B5CF6" opacity="0.15"/>
        <circle cx="40" cy="40" r="16" fill="#8B5CF6" opacity="0.2"/>
      </svg>
    )
  }
  return (
    <span style={{ fontSize: '72px', lineHeight: 1, display: 'inline-block' }}>
      {emoji}
    </span>
  )
}
```

C'est instancié **une seule fois**, ligne 443 :
```jsx
svg: <EmojiGeant emoji={m.image_url} />
```

Puis le composant `svg` est rendu dans **4 écrans** différents :
- `EcranIntro` (ligne 101) — carré violet **180 × 180** (`borderRadius: 32px`)
- `EcranExposition` (ligne 149) — carré **160 × 160** (`borderRadius: 32px`)
- `EcranExercice` (ligne 215) — carré **130 × 130** (`borderRadius: 28px`)
- `EcranRepetition` (ligne 279) — **pas de conteneur fixe** (juste `<div style={{ marginBottom: '20px' }}>{mot.svg}</div>`)

→ Modifier `EmojiGeant` couvre les 4 écrans d'un coup. 👍

---

## 🔧 Diff proposé

Je propose **un simple ternaire** dans `EmojiGeant` (pas de helper séparé),
qui détecte les URLs commençant par `http` :

```jsx
function EmojiGeant({ emoji }) {
  if (!emoji) {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="24" fill="#8B5CF6" opacity="0.15"/>
        <circle cx="40" cy="40" r="16" fill="#8B5CF6" opacity="0.2"/>
      </svg>
    )
  }
  // Si c'est une URL Supabase Storage → afficher l'image
  if (typeof emoji === 'string' && emoji.startsWith('http')) {
    return (
      <img
        src={emoji}
        alt=""
        style={{
          width: '120px',
          height: '120px',
          objectFit: 'cover',
          borderRadius: '20px',
          display: 'block',
        }}
      />
    )
  }
  // Sinon → emoji unicode comme avant
  return (
    <span style={{ fontSize: '72px', lineHeight: 1, display: 'inline-block' }}>
      {emoji}
    </span>
  )
}
```

### Détail des choix

| Décision | Choix | Justif |
|----------|-------|--------|
| Détection URL | `emoji.startsWith('http')` | Simple, robuste, couvre `http://` et `https://` |
| Helper séparé `isUrl()` | **Non** | Une ligne dans un seul composant — pas besoin d'abstraction |
| Width × height | **120 × 120 px** | Cohérent avec l'emoji 72px existant (un peu plus gros car image plus détaillée). Tient dans les 3 conteneurs fixes (130, 160, 180) avec un peu d'air autour. Sur Répétition (pas de conteneur fixe), occupe une taille raisonnable |
| `object-fit` | **`cover`** | Les images Midjourney sont déjà au format carré. Cover évite les bandes vides si jamais un ratio est légèrement différent |
| `border-radius` | **20 px** | Sub-radius cohérent avec les conteneurs violets (28-32 px) — l'image semble "nichée" à l'intérieur |
| `display: block` | Évite l'espace inline parasite sous l'image |
| `alt=""` | L'image est décorative — le mot `motActuel.en` est déjà affiché juste à côté (lecteurs d'écran) |
| Gestion `onError` (404) | **Non** | Les URL viennent de la BDD que Wells contrôle, pas du user input. Si une URL casse, le navigateur affiche son icône cassée — situation rare et facilement remontée. Pas la peine d'ajouter du `useState` pour ça. À toi de confirmer ⬇️ |
| Renommer la prop `emoji` → `media` | **Non** | Refacto opportuniste interdite. On garde `emoji` (= "ce qui était un emoji avant") |

---

## 🖼️ Maquette ASCII — avant / après

### Cas 1 : Mot avec URL Supabase (Les Animaux → cat)

**Avant** (bug actuel) :
```
┌─────────────────────────┐   ← carré violet 180×180
│                         │
│ https://mpdobvqulzbtvtd │   ← URL en gros texte (72px)
│ feahf.supabase.co/...   │
│                         │
└─────────────────────────┘
        cat  🔊
```

**Après** :
```
┌─────────────────────────┐   ← carré violet 180×180
│                         │
│   ┌───────────┐         │
│   │  🐱(img)  │         │   ← <img> 120×120, borderRadius 20
│   │           │         │
│   └───────────┘         │
└─────────────────────────┘
        cat  🔊
```

### Cas 2 : Mot avec emoji unicode (toutes les autres leçons)

**Avant** = **Après** (aucun changement visuel) :
```
┌─────────────────────────┐
│                         │
│         🍎              │   ← emoji 72px, comme avant
│                         │
└─────────────────────────┘
       apple  🔊
```

### Cas 3 : `image_url` NULL ou vide

**Avant** = **Après** (aucun changement) : SVG fallback (cercle violet
discret) — c'est le tout premier `if (!emoji)` qui gère ça.

---

## ⚠️ Points d'attention

1. **Aucun changement BDD** — la migration est déjà faite, je ne touche
   que le rendu front
2. **Aucun changement de schéma de données** — la prop `emoji` reçoit
   toujours la même chose (`m.image_url`)
3. **4 écrans couverts d'un coup** parce qu'ils utilisent tous le même
   `mot.svg` instancié ligne 443
4. **Pas de risque de régression sur les leçons existantes** : tant que
   `image_url` reste un emoji unicode (ne commence pas par `http`), le
   rendu est strictement identique à avant
5. **Lazy load** : je propose **de ne pas ajouter** `loading="lazy"` ici
   car l'image est le contenu principal de l'écran, pas un thumbnail —
   on veut qu'elle soit visible immédiatement. À confirmer
6. **Gestion erreur 404** : décision à valider (cf. tableau ci-dessus)

---

## 🧪 Tests visuels prévus (côté enfant)

1. Lancer `npm run dev`, se connecter en tant qu'enfant avec langue
   `en`
2. Démarrer la leçon **« Les Animaux »** :
   - Écran d'intro (180×180) → swiper les 10 mots, vérifier que chaque
     image carrée s'affiche dans le carré violet
   - Écran d'exposition (160×160) → image affichée pendant que Neuri
     prononce le mot
   - Écran d'exercice (130×130) → image au centre du QCM
   - Écran de répétition → image au-dessus du mot
3. Lancer une autre leçon (ex : **« La Famille »** ou n'importe quelle
   leçon avec encore des emojis unicode) :
   - Vérifier que les emojis 🏠 / 👨 / 👩 s'affichent comme avant (pas
     de régression)
4. Si possible : tester un mot avec `image_url = NULL` (s'il y en a)
   → vérifier que le SVG fallback violet s'affiche
5. Console : aucune erreur, aucun warning React

---

## 🚦 Workflow

1. ✅ Plan écrit (ce fichier)
2. ⏳ **Attente OK explicite de Wells**
3. Édition unique de `EmojiGeant` dans `src/pages/Lesson.jsx`
4. `npm run lint` (vérifier qu'on n'ajoute pas de warning ; les erreurs
   préexistantes du fichier ne nous concernent pas)
5. Note de rapport `notes/fix-lesson-image-url.md`

---

## ❓ Questions ouvertes

1. **`object-fit: cover` ou `contain`** ? Je penche pour `cover` (images
   Midjourney carrées, on remplit sans bandes vides). Tu valides ?
2. **Tailles** : 120×120 px partout, border-radius 20 px. OK ou tu
   préfères autre chose (ex : 130×130 pour matcher la taille de
   l'écran exercice) ?
3. **Gestion `onError`** : on garde simple (pas de fallback) ou on
   bascule en SVG fallback violet si l'URL casse ?
4. **`loading="lazy"`** : on l'ajoute ou pas ? Mon avis : non, l'image
   est le contenu principal de l'écran.
