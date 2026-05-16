# Plan — Fix TTS Alphabet : la voix dit un mot avant la lettre

## 🐛 Bug constaté

Sur la page Alphabet, en mode riche (anglais), quand l'enfant tape sur une carte (ex: la carte "A"), il entend **un mot avant la lettre** (ex: "Apple" puis "A"). Comportement attendu : entendre **uniquement la lettre**.

---

## 🔍 Investigation

### 1. La fonction `playLetter()` est correcte

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

À la ligne 37 du fichier, on appelle bien `playLetter(item.lettre, codeLangue)` → on lui passe **uniquement** la lettre (`"A"`, `"B"`…), pas le mot. La fonction `speak()` ne reçoit donc que la lettre. **Aucun bug ici.**

### 2. Cause réelle : le **name accessible** du `<button>` est contaminé

Le composant `CarteRiche` produit ce DOM :

```jsx
<button onClick={() => playLetter(item.lettre, codeLangue)}>
  <span>A</span>                          {/* lettre visible */}
  <LeconThumbnail ... alt={item.mot} />   {/* <img alt="Apple"> */}
  <span>Apple</span>                      {/* mot visible */}
</button>
```

Le button **n'a pas d'`aria-label`**, donc son name accessible est calculé par le navigateur en concaténant :
- le texte du premier span : `"A"`
- l'`alt` de l'image : `"Apple"`
- le texte du second span : `"Apple"`

→ **Name accessible final = `"A Apple Apple"`** (ou variantes selon le navigateur).

### 3. Conséquence quand un lecteur d'écran est actif

Si **VoiceOver (iOS), TalkBack (Android), NVDA (Windows) ou Narrator** est activé sur l'appareil — situation **fréquente sur les appareils d'enfants neuroatypiques où l'accessibilité est souvent paramétrée** — le système :

1. Annonce d'abord à voix haute le name accessible du bouton tapé → l'enfant entend `"Apple Apple"` (ou `"A Apple"`)
2. Ensuite seulement, notre `speak()` se déclenche et prononce `"A"`

D'où le ressenti exact rapporté par Wells : **"un mot avant la lettre"**.

### 4. Hypothèse écartée : double `speak()`

Le code appelle `speechSynthesis.cancel()` avant chaque `speak()`. La queue est donc vidée. Pas de double prononciation issue du TTS lui-même.

### 5. Hypothèse écartée : `title` HTML

Aucun attribut `title` sur la carte ou l'image. Rien qui puisse déclencher un tooltip lu.

---

## 🛠 Correctif proposé — neutraliser l'accessibilité du contenu visuel

Le principe : **forcer le name accessible du button à être uniquement la lettre**, et masquer aux lecteurs d'écran les éléments visuels (image + mot) qui font doublon.

### Modifications dans `src/pages/Alphabet.jsx` → composant `CarteRiche`

**a. Ajouter `aria-label={item.lettre}` sur le `<button>`**
→ Le lecteur d'écran annoncera uniquement la lettre, plus rien d'autre. C'est le fix principal.

**b. Passer `alt=""` à `<LeconThumbnail>` (au lieu de `alt={item.mot}`)**
→ Une image avec `alt=""` est considérée **décorative** : les lecteurs d'écran l'ignorent totalement. Aucun impact visuel. (Le composant transmet déjà la prop `alt` à la balise `<img>`.)

**c. Ajouter `aria-hidden="true"` sur le span du mot (et sur le span de la lettre par cohérence)**
→ Garantit que ces éléments ne polluent jamais le name accessible du parent. Aucun impact visuel.

### Pseudo-diff

```diff
 <button
+  aria-label={item.lettre}
   onClick={() => playLetter(item.lettre, codeLangue)}
   ...
 >
-  <span style={{ ...lettre }}>
+  <span aria-hidden="true" style={{ ...lettre }}>
     {item.lettre}
   </span>

   <div style={{ ...container image }}>
     <LeconThumbnail
       imageUrl={imageUrl}
-      alt={item.mot}
+      alt=""
       fill
       objectFit="contain"
       borderRadius={0}
     />
   </div>

-  <span style={{ ...mot }}>
+  <span aria-hidden="true" style={{ ...mot }}>
     {item.mot}
   </span>
 </button>
```

### Sur `CarteSimple` (mode ES/DE/PT)

Le bug ne s'y manifeste **pas** : le bouton ne contient qu'un seul nœud texte (la lettre), donc son name accessible vaut déjà juste la lettre. **Aucune modification nécessaire**, mais par cohérence et défense en profondeur on peut y ajouter `aria-label={lettre}` aussi. À toi de me dire si tu veux que je touche ou pas — par défaut **je ne touche pas** CarteSimple pour minimiser le diff.

---

## 🎯 Pourquoi ce fix marche

| Cas d'usage | Avant | Après |
|---|---|---|
| Lecteur d'écran ACTIF | "A Apple Apple" + "A" | **"A"** (seulement) |
| Lecteur d'écran INACTIF | "A" (déjà OK) | "A" (toujours OK) |
| Tap visuel | Carte avec lettre+image+mot visibles | **Identique, aucun changement visuel** |

Et c'est aussi un **gain d'accessibilité réel** : avant le fix, un enfant non-voyant qui parcourt la page entendrait "A Apple Apple, B Bee Bee, C Cat Cat…" — bruyant et confus. Après : il entend simplement "A, B, C…" → cohérent avec la fonction pédagogique de l'écran (apprendre l'alphabet).

---

## 📋 Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/Alphabet.jsx` | Modif locale `CarteRiche` : 1× `aria-label`, 2× `aria-hidden`, 1× `alt=""` |

Aucun autre fichier touché. Aucune dépendance. Aucune migration. Aucun impact visuel.

---

## ❓ À valider

1. **OK pour appliquer ce fix sur `CarteRiche` uniquement** ? (CarteSimple n'a pas le bug.)
2. **OK pour passer `alt=""` à `LeconThumbnail`** ? (L'image devient "décorative" pour les lecteurs d'écran. C'est le bon choix UX ici puisque la lettre suffit à identifier la carte.)

Si OK, j'applique. Sinon je peux explorer une variante (ex: garder `alt={item.mot}` mais juste mettre l'`aria-label` sur le button — c'est suffisant pour le bug, mais laisse l'image "annoncée" si on inspecte le DOM).
