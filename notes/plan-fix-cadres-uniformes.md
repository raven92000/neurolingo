# Plan — Harmoniser les cadres images sur les 4 écrans de leçon

## 🎯 Contexte

Aujourd'hui les 4 écrans de leçon utilisent des cadres violets de
tailles différentes pour afficher l'image du mot :

| Écran | Taille cadre | border-radius | Particularités |
|---|---|---|---|
| EcranIntro (L. 100) | **180 × 180** | 32 px | + `boxShadow` violet + `transform: scale(1.1)` |
| EcranExposition (L. 149) | **160 × 160** | 32 px | bordure blanche soft |
| **EcranExercice (L. 215)** | **130 × 130** | 28 px | ← **MODÈLE** — bordure dynamique (correct/wrong/neutre) |
| EcranRepetition (L. 279) | aucun | — | juste `<div style={{ marginBottom: 20 }}>` |

L'image elle-même fait 120 × 120 (via `EmojiGeant`, modifié au sprint
précédent). Sur Intro/Exposition, ça laisse du vide autour ; sur
Répétition, l'image flotte sans cadre.

**But** : aligner les 3 autres écrans sur le modèle Exercice (130×130,
borderRadius 28px) sans toucher au reste.

---

## 📍 Capture du style à reproduire (EcranExercice, ligne 215)

```jsx
<div
  onClick={() => playWord(mot.en, settings.audioRate)}
  style={{
    width: '130px',
    height: '130px',
    background: 'rgba(255,255,255,0.04)',
    border: feedback === 'correct'
      ? '1.5px solid rgba(88,204,2,0.4)'
      : feedback === 'wrong'
      ? '1.5px solid rgba(245,158,11,0.3)'
      : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: settings.animationsReduites ? 'border-color 0.5s ease' : 'all 0.3s ease',
  }}
>
  {mot.svg}
</div>
```

Pour Répétition (qui n'a pas de feedback dynamique), j'utilise la
version neutre = `border: '1px solid rgba(255,255,255,0.08)'`.

---

## 🔧 Diff exact — 3 écrans à modifier

### 1. EcranIntro (ligne ~100)

**Avant** :
```jsx
<div onClick={debloquerAudioEtJouer} style={{ width: '180px', height: '180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 40px rgba(139,92,246,0.18)', transform: 'scale(1.1)' }}>
  {motActuel.svg}
</div>
```

**Après** (juste `width` 180→130, `height` 180→130, `borderRadius` 32→28) :
```jsx
<div onClick={debloquerAudioEtJouer} style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 40px rgba(139,92,246,0.18)', transform: 'scale(1.1)' }}>
  {motActuel.svg}
</div>
```

**Modifs** : 3 valeurs seulement (`180px` × 2, `32px` × 1).
**Préservés** : `boxShadow` violet, `border` violet, `transform: scale(1.1)`,
fond, alignement.

⚠️ **Point d'attention sur le `transform: scale(1.1)`** : il fait que
le cadre 130×130 apparaîtra visuellement à ~143×143 (au lieu de 130).
La consigne dit « juste changer width/height/borderRadius » donc je
**garde le scale**, mais ça veut dire que l'Intro restera un peu plus
grand que l'Exercice (un effet "hero" léger préservé). Question : tu
valides, ou tu veux que je retire aussi `transform: scale(1.1)` pour
une uniformisation parfaite ? Voir question 1 plus bas.

### 2. EcranExposition (ligne ~149)

**Avant** :
```jsx
<div onClick={() => playWord(mot.en, settings.audioRate)} style={{ width: '160px', height: '160px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{mot.svg}</div>
```

**Après** (juste 160→130 × 2, 32→28) :
```jsx
<div onClick={() => playWord(mot.en, settings.audioRate)} style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{mot.svg}</div>
```

**Modifs** : 3 valeurs.
**Préservés** : bordure blanche soft, fond, alignement, onClick (rejouer).

### 3. EcranRepetition (ligne ~279)

**Avant** :
```jsx
<div style={{ marginBottom: '20px' }}>{mot.svg}</div>
```

**Après** (ajout du cadre style Exercice neutre, on garde le
`marginBottom: 20px` existant) :
```jsx
<div style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>{mot.svg}</div>
```

**Modifs** : on ajoute toutes les propriétés du cadre Exercice (version
neutre, sans `cursor: 'pointer'` ni `transition` puisque pas de
feedback ici ; sans `onClick` non plus, le bouton "Réécouter" est déjà
juste en dessous).

---

## ✅ Ce qui reste strictement inchangé

- **EcranExercice (ligne 215)** : 0 modif (c'est le modèle)
- **`EmojiGeant`** (image 120×120, borderRadius 20) : 0 modif (réf
  consigne)
- Tous les autres styles : titres, boutons, espacements, progress bar,
  etc.
- Logique métier, hooks, props, sequence : aucun changement

---

## 🖼️ Maquette ASCII — comparatif

### Avant
```
INTRO          EXPOSITION    EXERCICE      REPETITION
┌──────────┐   ┌────────┐    ┌──────┐        (rien)
│          │   │        │    │ 🐱   │         🐱
│   🐱     │   │   🐱   │    │      │
│          │   │        │    └──────┘
│          │   └────────┘    130×130        120×120
└──────────┘   160×160         28           pas de cadre
180×180         32
   32
```

### Après (uniformisé)
```
INTRO          EXPOSITION    EXERCICE      REPETITION
┌──────┐       ┌──────┐      ┌──────┐      ┌──────┐
│ 🐱   │       │ 🐱   │      │ 🐱   │      │ 🐱   │
│      │       │      │      │      │      │      │
└──────┘       └──────┘      └──────┘      └──────┘
130×130        130×130       130×130       130×130
  28             28            28            28
(scale 1.1     (border        (modèle,      (style
 + glow         blanche        inchangé)     neutre)
 violet)        soft)
```

Note : Intro reste légèrement plus grand visuellement à cause du
`transform: scale(1.1)` préservé (cf. question 1).

---

## ⚠️ Points d'attention

1. **Layout Intro** : le cadre passe de 180 à 130 → le bloc image
   prend moins de place verticalement. Vu que `EcranIntro` a un
   `minHeight: '380px'` sur le conteneur flex (ligne 99), le centrage
   vertical va simplement re-équilibrer. Pas de risque de casse.

2. **Layout Exposition** : idem, le bloc image rétrécit de 160 à 130.
   Le `gap: 28px` de la column flex absorbe le changement.

3. **Layout Répétition** : on ajoute un cadre **autour** d'un élément
   qui était sans contenant. La hauteur ajoutée est de 130px (au lieu
   de la hauteur intrinsèque de l'image 120px), donc +10px vertical
   environ. Devrait passer sans souci.

4. **Le `transform: scale(1.1)` d'Intro** est cosmétique et donne un
   léger effet "hero" sur l'écran de présentation. Je propose de le
   garder (consigne stricte = juste w/h/br) mais c'est ouvert (cf.
   question 1).

5. **Aucun changement sur `EmojiGeant`** — l'image fait toujours
   120×120, désormais quasi-pleine dans le cadre 130×130 (5 px de
   marge tout autour).

---

## 🧪 Tests visuels prévus

1. `npm run dev`, connexion enfant en langue `en`
2. Démarrer **« Les Animaux »**
3. **Écran Intro** : cadre violet 130×130 (un peu plus grand visuelle-
   ment à cause du scale 1.1), image 120×120 quasi pleine, glow
   violet préservé
4. **Écran Exposition** : cadre 130×130, image 120×120 quasi pleine
5. **Écran Exercice (QCM)** : strictement inchangé visuellement
6. **Écran Répétition** : nouveau cadre 130×130 autour de l'image
7. **Cohérence visuelle** : les 4 écrans ont le même cadre carré
   arrondi (l'Intro légèrement plus grand grâce au scale)
8. Non-régression sur une leçon à emojis unicode (ex : « La Famille »)
   → l'emoji 72px reste centré dans le cadre 130×130 (passe de très
   centré à plus serré, mais reste lisible)

---

## 🚦 Workflow

1. ✅ Plan écrit (ce fichier)
2. ⏳ **Attente OK explicite de Wells**
3. 3 micro-edits dans `src/pages/Lesson.jsx`
4. `npm run lint` (doit rester à 15 problèmes préexistants, aucun
   nouveau)
5. Note de rapport `notes/fix-cadres-uniformes.md`

---

## ❓ Questions ouvertes

1. **`transform: scale(1.1)` sur EcranIntro** : on le garde (effet
   hero préservé, mais Intro reste visuellement ~143×143) ou on le
   retire pour une uniformisation parfaite ? Mon avis : **garder**,
   l'effet hero est joli sur l'écran d'intro.

2. **`marginBottom` sur le cadre Exercice (10px) vs Répétition
   (20px)** : je garde le `20px` existant sur Répétition (la consigne
   dit « ajouter un conteneur autour » sans toucher au reste). OK ?

3. **Non-régression emojis unicode** : avec un cadre désormais 130×130
   au lieu de 180/160, l'emoji 72px reste-il bien proportionné ? Je
   pense que oui (72 < 130, ça passe), mais je le mentionne ici pour
   transparence. Tu pourras vérifier visuellement.

Une fois tes réponses, j'applique les 3 edits.
