# Fix — Prénom tronqué au premier espace

> **Statut** : ✅ Appliqué
> **Date** : 2026-05-12
> **Type** : Bug fix UX
> **Plan d'origine** : [plan-fix-prenom-tronque.md](plan-fix-prenom-tronque.md)

---

## 🐛 Bug corrigé

Quand `profils.nom = "Lea test"` (avec espace), l'UI affichait "Lea" au lieu du prénom complet. Cause : `nom?.split(' ')[0]` partout dans le code, qui supposait à tort que `profils.nom` contenait "Prénom Nom de famille" alors qu'il contient juste le prénom enfant (qui peut être composé avec espace : "Jean Paul", "Marie Anne").

**Impact** : les parents souhaitant nommer leur enfant avec un prénom composé voient désormais le nom complet partout dans l'app.

---

## ✏️ Diff réellement appliqué — 8 modifs sur 6 fichiers

### 📝 1. `src/pages/ParentDashboard.jsx` — 2 modifications

#### Ligne 235 — conseil personnalisé
```diff
-    `${enfantActif?.nom?.split(' ')[0]} progresse davantage le matin.`,
+    `${enfantActif?.nom} progresse davantage le matin.`,
```

#### Ligne 291 — carte enfant en haut
```diff
-              {enfantActif?.nom?.split(' ')[0]}{ageEnfant && ` (${ageEnfant} ans)`}
+              {enfantActif?.nom}{ageEnfant && ` (${ageEnfant} ans)`}
```

⚠️ **Volontairement préservés** : lignes 178 et 247 (`parent?.nom?.split(' ')[0]` pour le "Bonjour [prénom parent]") — décision Wells : le parent garde son prénom seul dans "Bonjour".

### 📝 2. `src/pages/ChildrenPage.jsx` — 1 modification

```diff
-                    {enfant.nom?.split(' ')[0]}
+                    {enfant.nom}
```

### 📝 3. `src/pages/ChildDetailPage.jsx` — 2 modifications

```diff
-    prenom: enfant.nom?.split(' ')[0],
+    prenom: enfant.nom,
```

```diff
-        <ChildDetailActivity activites={activites} prenom={enfant.nom?.split(' ')[0]} />
+        <ChildDetailActivity activites={activites} prenom={enfant.nom} />
```

⚠️ Les 2 `console.log` temporaires (marqueurs `🔬 LOG TEMPORAIRE`) **restent intacts** comme demandé.

### 📝 4. `src/pages/ChildDetail/ChildDetailHero.jsx` — 1 modification

```diff
-  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'
+  const prenom = enfant?.nom || 'Ton enfant'
```

### 📝 5. `src/pages/ChildDetail/ChildDetailActions.jsx` — 1 modification

```diff
-  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'
+  const prenom = enfant?.nom || 'Ton enfant'
```

Cette variable est utilisée dans : toast déliement ("{prenom} a été délié·e..."), texte "{prenom} peut se connecter avec ce code.", et titre passé à la modale de déliement.

### 📝 6. `src/pages/ChildDetail/EditProfileModal.jsx` — 1 modification

```diff
-  const prenomAffiche = (valeursInitiales?.prenom || enfant?.nom || 'Ton enfant').split(' ')[0]
+  const prenomAffiche = valeursInitiales?.prenom || enfant?.nom || 'Ton enfant'
```

Utilisé dans le titre "Modifier le profil de {prenomAffiche}".

---

## ✅ Validations effectuées

- ✅ `npm run lint` : **15 problèmes total** (11 erreurs + 4 warnings) — identique au baseline pré-fix.
- ✅ **0 nouveau warning/erreur** sur les 6 fichiers modifiés.
- ✅ Grep final confirme : **plus aucun `enfant?.nom?.split` ou `enfantActif?.nom?.split`** dans `src/pages/`. Seuls les 2 `parent?.nom?.split(' ')[0]` restent (volontairement, lignes 178 et 247 de ParentDashboard).
- ✅ Les 2 `console.log` temporaires dans `ChildDetailPage.jsx` restent en place.
- ✅ `SentenceExercise.jsx` (split sur phrases anglaises pour gameplay) non touché — bien hors-scope.

### Note technique sur l'application
Une `Edit` sur `ChildDetailPage.jsx` ligne 149 a d'abord échoué car j'avais mal estimé l'indentation (6 vs 4 espaces). Corrigée immédiatement avec le bon nombre d'espaces. Aucun impact final.

---

## 🧪 Tests visuels à refaire par Wells

### Cas 1 — Prénom à un seul mot (régression check)
Avec un enfant nommé "Lea" : vérifier que `/parent-dashboard`, `/parent-children`, `/parent/enfant/:userId` et la modale Modifier le profil affichent toujours "Lea" partout. **Comportement inchangé**.

### Cas 2 — Prénom composé avec espace (le bug d'origine)
1. Modifier un enfant en "Jean Paul" via la modale
2. Vérifier ces 8 endroits :
   - Carte enfant en haut du `/parent-dashboard` → "Jean Paul (X ans)"
   - Conseil personnalisé en bas du `/parent-dashboard` → "Jean Paul progresse davantage..."
   - Carte enfant dans la liste `/parent-children` → "Jean Paul"
   - Titre principal du Hero `/parent/enfant/:userId` → "Jean Paul"
   - Message émotionnel du Hero (calculé via `genererMessageEmotionnel`) → utilise désormais "Jean Paul"
   - Section "Activité récente" → "Jean Paul a fait sa première leçon..." (etc.)
   - Texte sous le code NEURI dans Actions → "Jean Paul peut se connecter avec ce code."
   - Titre modale Modifier → "Modifier le profil de Jean Paul"
   - **Bonus** : "Bonjour [Wells]" du Dashboard reste sur le prénom parent seul (volontaire).

### Cas 3 — Prénom avec tiret
Modifier en "Marie-Claire" → toujours affiché "Marie-Claire" partout (comportement déjà correct avant le fix).

### Cas 4 — Prénom long (3 mots)
Modifier en "Marie Anne Charlotte" → vérifier qu'il n'y a pas de débordement visuel disgracieux sur les cartes mobiles.

### Cas 5 — Pas de régression
Navigation classique entre les pages, déliement d'un enfant, etc. → tout fonctionne, toasts cohérents, pas d'erreur console.

---

## 🚿 Cleanup en attente

Les **2 `console.log` temporaires** dans [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) sont toujours en place. À retirer dans un commit dédié séparé une fois toute la chaîne validée par Wells.

---

## 📝 Notes pour le commit

### Fichiers à inclure
```
src/pages/ParentDashboard.jsx                         (modifié — 2 lignes)
src/pages/ChildrenPage.jsx                            (modifié — 1 ligne)
src/pages/ChildDetailPage.jsx                         (modifié — 2 lignes, contient encore les console.log temp.)
src/pages/ChildDetail/ChildDetailHero.jsx             (modifié — 1 ligne)
src/pages/ChildDetail/ChildDetailActions.jsx          (modifié — 1 ligne)
src/pages/ChildDetail/EditProfileModal.jsx            (modifié — 1 ligne)
notes/plan-fix-prenom-tronque.md                      (nouveau)
notes/fix-prenom-tronque.md                           (nouveau)
```

### Message de commit suggéré
```
fix(ui): affiche le prénom enfant complet (avec espace si composé)

Les prénoms enfants étaient tronqués au premier espace via .split(' ')[0]
dans 8 endroits différents (Dashboard, ChildrenPage, ChildDetail*, modale
édition). Le champ profils.nom stocke un prénom (potentiellement composé
comme "Jean Paul"), pas "Prénom Nom de famille". Retrait du split sur
tous les usages enfants. Le split sur parent.nom (Bonjour [prénom parent])
reste volontairement intact.
```

### À NE PAS commiter dans ce commit
- Le retrait des 2 console.log temporaires de `ChildDetailPage.jsx` → commit séparé prévu plus tard.
