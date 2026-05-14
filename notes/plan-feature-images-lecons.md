# Plan — Feature « images des leçons » (front)

## 🎯 Contexte

La colonne `lecons.image_url TEXT NULLABLE` existe déjà côté BDD
(migration `add_image_url_to_lecons` déjà appliquée). 8 leçons du
chapitre 2 « La Vie Quotidienne » (langue `en`) ont déjà leur URL
remplie vers le bucket public `lecons-images`. Les autres leçons ont
`image_url = NULL`.

Objectif : afficher ces images dans 2 composants front existants :

1. `LeconRow.jsx` — page **Progression détaillée** (Sprint 3)
2. `LeconJourCard.jsx` — page **Historique** (Sprint 4)

Avec un **placeholder doux** quand `image_url` est NULL ou que l'image
échoue à charger.

---

## 🧩 Architecture proposée

### Option retenue : 1 mini-composant partagé `LeconThumbnail`

Plutôt que dupliquer la logique fallback + `onError` dans les 2
composants, je propose un petit composant unique :

- **Fichier** : `src/components/LeconThumbnail.jsx`
- **Props** :
  - `imageUrl` (string | null) — l'URL Supabase Storage
  - `size` (number) — taille du carré en px (40 pour LeconRow, 48 pour LeconJourCard)
  - `borderRadius` (number) — 10 ou 12 selon le contexte
- **Logique interne** :
  - State local `erreurImage` (bool) pour basculer en placeholder si l'image renvoie 404
  - Si `imageUrl` est falsy OU `erreurImage` → afficher le placeholder
  - Sinon : `<img>` avec `loading="lazy"` + `onError={() => setErreurImage(true)}`
- **Placeholder visuel** :
  - Carré aux mêmes dimensions
  - `background: rgba(255,255,255,0.04)`
  - `border: 0.5px solid rgba(255,255,255,0.07)`
  - Centré (flex) avec emoji `📚` en `fontSize: 18px`, couleur `rgba(255,255,255,0.35)`

**Pourquoi factoriser ?** Évite la duplication de la gestion d'erreur
404 et garde un seul endroit pour ajuster le placeholder. Le composant
fait moins de 40 lignes, donc reste très lisible.

Si tu préfères inline dans chaque composant (pas de nouveau fichier),
dis-le moi avant que je commence — c'est aussi tout à fait OK.

---

## 📁 Fichiers touchés

| Fichier | Modif |
|---------|-------|
| `src/components/LeconThumbnail.jsx` | **Nouveau** — composant partagé |
| `src/pages/ParentChildProgression/LeconRow.jsx` | Insérer `<LeconThumbnail />` à 40px entre l'icône statut et le titre |
| `src/pages/ParentChildHistorique/LeconJourCard.jsx` | Wrap en flex + `<LeconThumbnail />` 48px à gauche du bloc texte |
| `src/pages/ParentChildProgression.jsx` | `.select(...)` ajouter `image_url` (ligne ~97) + propager dans le mapping leçon (ligne ~118) |
| `src/pages/ParentChildHistorique.jsx` | `.select(...)` ajouter `image_url` dans le join `lecons(...)` (ligne ~89) + passer la prop à `<LeconJourCard />` (ligne ~234) |

---

## 🖼️ Détails du placeholder

```
┌──────────────┐
│              │
│      📚      │   ← emoji centré, fontSize 18, opacité ~35 %
│              │
└──────────────┘
   bg : rgba(255,255,255,0.04)
   border : 0.5px solid rgba(255,255,255,0.07)
   borderRadius : 10 (LeconRow) ou 12 (LeconJourCard)
   width = height = size prop
```

---

## 🖥️ Maquette ASCII après modif

### LeconRow (40×40, dans la liste expand chapitre)

Avant :
```
✅   Les Animaux                                   TERMINÉE
⏳   La Famille                                    EN COURS
•    Les Vêtements                                NON COMMENCÉE
```

Après :
```
✅  [🐱]  Les Animaux                              TERMINÉE
⏳  [🏠]  La Famille                               EN COURS
•   [📚]  Les Vêtements                           NON COMMENCÉE
```
(le `[📚]` ici = placeholder si pas d'image_url, sinon vraie image)

### LeconJourCard (48×48, dans le détail du jour de l'historique)

Avant :
```
┌─────────────────────────────────────────┐
│ Les Animaux                             │
│ 14:32 · 8 min                           │
│ Chapitre : La Vie Quotidienne           │
└─────────────────────────────────────────┘
```

Après :
```
┌─────────────────────────────────────────┐
│ ┌────┐                                  │
│ │🐱  │   Les Animaux                    │
│ │    │   14:32 · 8 min                  │
│ └────┘   Chapitre : La Vie Quotidienne  │
└─────────────────────────────────────────┘
```
(thumbnail à gauche, contenu texte aligné à droite avec `gap: 12px`)

---

## ⚠️ Points d'attention

### 1. Loading state image
Pas de spinner explicite. Le navigateur affiche un vide pendant le
chargement (très rapide pour des thumbnails 40-48px). On garde simple :
juste `<img loading="lazy" />`. Si jamais ça devient visible
(connexion lente), on pourra ajouter un fond `rgba(255,255,255,0.04)`
en background du wrapper qui transparaît tant que l'image n'est pas
chargée — déjà prévu dans le style du conteneur.

### 2. Lazy load
J'ajoute `loading="lazy"` sur le `<img>` natif. Comme la page
Progression affiche tous les chapitres en accordéon (les leçons sont
rendues seulement quand le chapitre est expand), c'est déjà pas mal
optimisé. Le `loading="lazy"` ajoute une couche de sécurité.

### 3. Gestion d'erreur 404 / URL cassée
Si l'URL est définie mais l'image ne charge pas (404, bucket down,
URL malformée), `onError` bascule sur le placeholder. Pas de crash,
pas d'icône cassée du navigateur visible.

### 4. Accessibilité
J'ajoute `alt={titre}` sur les images (ex : `alt="Les Animaux"`)
pour les lecteurs d'écran, et `alt=""` sur le placeholder (purement
décoratif).

### 5. Cohérence DA
- Fond `#090E1A` reste, glow violet inchangé
- Border-radius thumbnail : 10px (LeconRow) / 12px (LeconJourCard)
  — cohérent avec les cartes existantes (14-18px)
- Pas de nouvelle couleur, pas de nouvel emoji, pas de nouveau font
- Mobile 430px : layout flex `gap: 12px` reste compact

### 6. Pas de refacto opportuniste
Je ne touche **que** ce qui est strictement nécessaire :
- LeconRow.jsx : insérer thumbnail, c'est tout
- LeconJourCard.jsx : insérer thumbnail + wrap en flex, c'est tout
- ParentChildProgression.jsx : 2 lignes (le `.select` + le mapping)
- ParentChildHistorique.jsx : 2 lignes (le `.select` + la prop)

Aucun renommage, aucune restructuration, aucun changement de style
sur l'existant.

---

## 🧪 Tests visuels prévus

### Sprint 3 — Progression (immédiat)
1. `/parent/enfant/{userId}/progression`
2. Expand le chapitre 2 « La Vie Quotidienne »
3. Vérifier que les 8 leçons affichent leur thumbnail (chat, maison,
   pomme, t-shirt, smiley, calendrier, cadre photo, masque)
4. Vérifier que les autres leçons (sans image_url) affichent le
   placeholder 📚
5. Tester la console : pas d'erreur, pas de warning React
6. Forcer une URL cassée dans la BDD (ou couper le réseau brièvement)
   → vérifier que le placeholder prend la suite via `onError`
7. Mobile 430px : layout cohérent, pas de overflow

### Sprint 4 — Historique (à valider plus tard)
1. Une fois qu'une leçon avec image_url aura été complétée par un
   enfant, vérifier que la thumbnail 48×48 apparaît à gauche de la
   carte LeconJourCard, avec le contenu texte aligné à droite

### Lint et runtime
- `npm run lint` doit passer sans nouveau warning
- `npm run dev` doit booter sans crash
- Pas de `console.log` oublié

---

## 🚦 Workflow

1. ✅ Plan écrit (ce fichier)
2. ⏳ **Attente OK explicite de Wells**
3. Application des modifs dans l'ordre :
   a. Créer `LeconThumbnail.jsx`
   b. Modifier `LeconRow.jsx`
   c. Modifier `LeconJourCard.jsx`
   d. Étendre la query + mapping dans `ParentChildProgression.jsx`
   e. Étendre la query + prop dans `ParentChildHistorique.jsx`
4. Vérifier `npm run lint`
5. Note de rapport `notes/feature-images-lecons.md`

---

## ❓ Questions ouvertes

1. **OK pour créer un mini-composant `LeconThumbnail` partagé**, ou tu
   préfères inline dans chacun des 2 composants (= dupliquer ~15
   lignes) ?
2. L'emoji du placeholder est 📚 — tu valides ou tu préfères autre
   chose (✨, 🌙, rien du tout = juste un cercle vide) ?
3. Tailles confirmées : 40×40 (LeconRow) et 48×48 (LeconJourCard) ?

Une fois tes réponses, je peux exécuter.
