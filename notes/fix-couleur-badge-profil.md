# Fix — Couleur dynamique du badge profil cognitif (ChildDetailHero)

> **Statut** : ✅ Appliqué
> **Date** : 2026-05-11
> **Type** : Mini-fix visuel

---

## 🐛 Bug

Sur la page `/parent/enfant/:userId`, le badge "TDAH" / "Dyslexie" affiché sous le prénom de l'enfant (dans `ChildDetailHero`) **restait violet quelle que soit la valeur de `profil_type`**. Pour un enfant en profil `dyslexie`, on attendait un badge bleu.

Cause : les 3 couleurs (fond, bordure, texte) étaient écrites en dur en violet dans le JSX du badge.

---

## ✏️ Diff appliqué

Fichier : [src/pages/ChildDetail/ChildDetailHero.jsx](../src/pages/ChildDetail/ChildDetailHero.jsx)

### 1. Ajout d'une map `COULEURS_PROFIL` à côté de `LIBELLE_PROFIL`
```diff
 const LIBELLE_PROFIL = {
   tdah: 'TDAH',
   dyslexie: 'Dyslexie',
 }
+
+// Couleurs claires (lisibles sur le fond violet sombre du Hero)
+const COULEURS_PROFIL = {
+  tdah: { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' },
+  dyslexie: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)' },
+}
```

### 2. Résolution de la couleur dans le composant (avec fallback)
```diff
   const profilType = enfant?.profil_type
   const libelleProfil = profilType ? (LIBELLE_PROFIL[profilType] || profilType.toUpperCase()) : null
+  const couleurProfil = COULEURS_PROFIL[profilType] || COULEURS_PROFIL.tdah
```

### 3. Badge JSX : 3 valeurs en dur → 3 valeurs dynamiques
```diff
   {libelleProfil && (
     <div style={{
       display: 'inline-block',
-      background: 'rgba(167,139,250,0.15)',
-      border: '1px solid rgba(167,139,250,0.3)',
+      background: couleurProfil.bg,
+      border: `1px solid ${couleurProfil.border}`,
       borderRadius: '999px',
       padding: '4px 12px',
     }}>
       <span style={{
         fontFamily: 'Nunito, sans-serif',
         fontSize: '12px',
         fontWeight: '800',
-        color: '#A78BFA',
+        color: couleurProfil.color,
         letterSpacing: '0.04em',
       }}>
         {libelleProfil}
       </span>
     </div>
   )}
```

---

## 🎨 Pourquoi `#A78BFA` (tdah) et `#60A5FA` (dyslexie) ?

Le Hero a un **fond violet sombre** (linear-gradient `rgba(88,49,196,0.35) → rgba(16,18,40,0.95)`). Sur ce fond, les versions **claires** des couleurs offrent un meilleur contraste et une meilleure lisibilité :

| Profil | Couleur retenue | Famille | Variante foncée disponible |
|--------|-----------------|---------|----------------------------|
| `tdah` | **`#A78BFA`** (violet clair) | violet | `#8B5CF6` (utilisée dans cartes-radio EditProfileModal/Profile sur fond sombre uniforme) |
| `dyslexie` | **`#60A5FA`** (bleu clair) | bleu | `#3B82F6` (idem) |

Les couleurs choisies sont **cohérentes avec les variantes claires** déjà perçues dans les autres composants violet/bleu de l'app (en particulier la modale "Modifier le profil" où les cartes-radio actives utilisent ces familles).

L'opacité du fond (0.15) et de la bordure (0.3) est conservée à l'identique du badge d'origine pour ne pas changer la densité visuelle — seule la teinte change.

### Fallback
Si `profil_type` n'est ni `tdah` ni `dyslexie` (valeur legacy, valeur custom, ou null), on retombe sur les couleurs `tdah` par défaut → comportement identique à avant le fix pour ces cas non standard.

### À noter : impact réel sur l'UI
- **TDAH** : aucun changement visuel (les couleurs `#A78BFA` + opacités correspondent **exactement** à ce qui était déjà en dur dans le code)
- **Dyslexie** : c'est ici que le fix se voit — le badge passe du violet au bleu clair

---

## 🧪 Test visuel à faire

1. Ouvrir `/parent-children` (ou `/parent-dashboard`)
2. Cliquer sur un enfant ayant `profil_type = 'tdah'` → vérifier que le badge "TDAH" est **violet clair** (`#A78BFA`) — identique à avant
3. Retour → cliquer sur un enfant ayant `profil_type = 'dyslexie'` → vérifier que le badge "Dyslexie" est **bleu clair** (`#60A5FA`) — c'était le bug
4. **Cycle complet** : ouvrir un enfant TDAH → "Modifier le profil" → changer en dyslexie → Enregistrer → toast vert → vérifier que le badge sous le prénom passe de violet à bleu **sans rafraîchir la page** (le refresh est déclenché par le `refreshKey` du Sprint 2C-2)

Si tu n'as pas d'enfant en `dyslexie`, le test 3 peut être fait via le test 4 (changement de profil en temps réel).

---

## 📋 Validations effectuées

- ✅ `npm run lint` : 15 problèmes total (identique au baseline pré-fix), **0 nouveau warning/erreur** sur `ChildDetailHero.jsx`
- ✅ Aucun autre fichier touché (1 seul fichier : `ChildDetailHero.jsx`)
- ✅ Aucune modif BDD, aucune dépendance ajoutée

---

## 📝 Notes pour le commit

### Fichiers à inclure
```
src/pages/ChildDetail/ChildDetailHero.jsx     (modifié)
notes/fix-couleur-badge-profil.md             (nouveau)
```

### Message de commit suggéré
```
fix(parent): couleur dynamique du badge profil cognitif

Le badge sous le prénom de l'enfant utilise désormais une couleur
adaptée au profil : violet clair (#A78BFA) pour TDAH, bleu clair
(#60A5FA) pour Dyslexie. Avant ce fix, le badge restait violet
quelle que soit la valeur de profil_type.
```
