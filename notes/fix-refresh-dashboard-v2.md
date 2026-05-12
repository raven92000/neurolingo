# Fix v2 — Refresh ParentDashboard/ChildrenPage via location.state.from

> **Statut** : ✅ Appliqué
> **Date** : 2026-05-12
> **Type** : Bug fix front (suite du fix v1 conservé)
> **Plan d'origine** : [plan-fix-refresh-dashboard-v2.md](plan-fix-refresh-dashboard-v2.md)
> **Fix v1 (conservé)** : [fix-refresh-dashboard.md](fix-refresh-dashboard.md)

---

## 🐛 Bug corrigé

Après édition du profil enfant via la modale, le bouton retour `←` de `ChildDetailPage` faisait `navigate(-1)`. Or React Router **restaure** la `location.key` précédente lors d'un `navigate(-1)`. Donc :
- La clé ne changeait pas dans la page cible (ParentDashboard ou ChildrenPage)
- Le `useEffect` ayant `location.key` dans ses deps (fix v1) ne se redéclenchait pas
- Pas de refetch → ancien prénom affiché

**Fix v2** : on remplace `navigate(-1)` par `navigate(from)` où `from` est la route d'origine, transmise via `location.state.from` posé au moment du clic depuis Dashboard ou ChildrenPage. Le `navigate(path)` avec une URL explicite crée une **nouvelle entrée d'historique** avec une **nouvelle `location.key`** → le useEffect se redéclenche → refetch → bon prénom.

---

## ✏️ Diff réellement appliqué

### 📝 1. `src/pages/ParentDashboard.jsx` — 1 modification

Ligne du `onClick` de la carte enfant :
```diff
-          onClick={() => enfantActif?.user_id && navigate('/parent/enfant/' + enfantActif.user_id)}
+          onClick={() => enfantActif?.user_id && navigate('/parent/enfant/' + enfantActif.user_id, { state: { from: '/parent-dashboard' } })}
```

### 📝 2. `src/pages/ChildrenPage.jsx` — 1 modification

Ligne du `onClick` de chaque carte enfant :
```diff
-                onClick={() => navigate('/parent/enfant/' + enfant.user_id)}
+                onClick={() => navigate('/parent/enfant/' + enfant.user_id, { state: { from: '/parent-children' } })}
```

### 📝 3. `src/pages/ChildDetailPage.jsx` — 4 modifications

#### Import
```diff
-import { useNavigate, useParams } from 'react-router-dom'
+import { useNavigate, useParams, useLocation } from 'react-router-dom'
```

#### Déclaration du hook
```diff
   const navigate = useNavigate()
   const { userId } = useParams()
+  const location = useLocation()
   const [enfant, setEnfant] = useState(null)
```

#### Nouvelle fonction `retour` (ajoutée juste après `handleProfileUpdated`)
```js
// Bouton retour : utilise location.state.from posé par la page d'origine
// (ParentDashboard ou ChildrenPage) pour garantir un navigate avec nouvelle
// location.key, ce qui force le useEffect de la destination à refetch.
// Fallback sur /parent-dashboard si pas de from (deeplink direct, F5).
function retour() {
  const from = location.state?.from
  navigate(from || '/parent-dashboard')
}
```

#### Les 2 boutons retour (lignes ~130 et ~161)
```diff
-          onClick={() => navigate(-1)}
+          onClick={retour}
```
(à 2 endroits différents avec des indentations différentes : écran d'erreur ET rendu normal)

---

## ✅ Validations effectuées

- ✅ `npm run lint` : **15 problèmes total** (11 erreurs + 4 warnings) — identique au baseline pré-fix.
- ✅ **0 nouveau warning/erreur** sur les 3 fichiers modifiés.
- ✅ Périmètre respecté : 3 fichiers touchés, tous autorisés. **Pas de modif d'EditProfileModal, App.jsx, etc.**
- ✅ Vérification grep : plus aucun `navigate(-1)` dans `ChildDetailPage.jsx`, les 2 boutons utilisent bien `onClick={retour}` (lignes 130 et 161).
- ✅ Fix v1 (`location.key` dans deps) conservé, fonctionne en synergie avec v2.
- ✅ Les 2 `console.log` temporaires dans `ChildDetailPage.jsx` restent en place (cleanup prévu dans un commit séparé).

### Note sur l'application du diff
Première tentative d'`Edit` avec `replace_all: true` n'a remplacé qu'une seule occurrence (différence d'indentation entre les 2 boutons : 12 vs 10 espaces). La 2ᵉ occurrence a été corrigée immédiatement après via un second `Edit` avec contexte unique (commentaire `{/* HEADER avec bouton retour */}` + lignes adjacentes). Au final, grep confirme que les 2 boutons utilisent bien `onClick={retour}`.

---

## 🧪 Tests visuels à refaire par Wells

### Cas 1 — Le bug d'origine (priorité)
1. `/parent-children`, noter le prénom (ex: "Lea test")
2. Cliquer sur la carte enfant → `/parent/enfant/:userId`
3. Modifier le prénom en "Lea test 3"
4. Enregistrer (toast vert + Hero mis à jour)
5. Cliquer sur le bouton retour `←` en haut
6. **Vérifier** : retour sur `/parent-children` ET la carte affiche "Lea test 3"

### Cas 2 — Depuis Dashboard
1. `/parent-dashboard`, voir la carte enfant en haut
2. Cliquer sur la carte → `/parent/enfant/:userId`
3. Modifier le prénom
4. Enregistrer
5. Cliquer sur le bouton retour `←`
6. **Vérifier** : retour sur `/parent-dashboard` ET la carte enfant affiche le nouveau prénom

### Cas 3 — Cycle complet inter-pages
1. `/parent-dashboard` → carte enfant → édition → retour → vérifier sur dashboard
2. Naviguer ensuite vers `/parent-children` via BottomNav → vérifier que la liste affiche aussi le nouveau prénom (le fix v1 doit faire son boulot ici)

### Cas 4 — Deeplink direct (cas fallback)
1. Ouvrir directement `http://localhost:5173/parent/enfant/:userId` (URL collée, sans passer par Dashboard ni ChildrenPage)
2. Cliquer sur le bouton retour `←`
3. **Vérifier** : on arrive sur `/parent-dashboard` (fallback prévu)

### Cas 5 — Pas de régression sur la nav inter-pages classique
- Naviguer entre les 3 pages via BottomNavParent (Accueil, Mes enfants, Réglages) sans rien modifier → tout fonctionne normalement.

### Cas 6 — Bouton retour du navigateur (cas connu, à observer)
Comme on remplace `navigate(-1)` par `navigate(path)`, l'historique cumule désormais les entrées (dashboard → enfant → dashboard → enfant…). Le bouton retour **du navigateur** (≠ bouton custom de l'UI) remontera donc dans cette pile. C'est légèrement différent de la navigation native. **À observer** : si l'UX est dégradée (genre il faut appuyer 5x sur retour navigateur pour quitter l'app), on ajustera avec un `{ replace: true }`. Pour l'instant, on garde simple.

---

## 🚿 Cleanup en attente

Les **2 `console.log` temporaires** dans [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) (marqueurs `// 🔬 LOG TEMPORAIRE`) sont toujours en place. À retirer dans un commit dédié une fois toute la chaîne validée par Wells.

---

## 📝 Notes pour le commit

### Fichiers à inclure dans le commit "fix v2 refresh dashboard"
```
src/pages/ChildDetailPage.jsx                       (modifié — 4 modifs MAIS contient encore les 2 console.log temporaires)
src/pages/ParentDashboard.jsx                       (modifié — 1 ligne)
src/pages/ChildrenPage.jsx                          (modifié — 1 ligne)
notes/plan-fix-refresh-dashboard-v2.md              (nouveau)
notes/fix-refresh-dashboard-v2.md                   (nouveau)
```

### ⚠️ Important : décision sur `ChildDetailPage.jsx`
Ce fichier contient à la fois :
- Les **modifs du fix v2** (import useLocation, déclaration, fonction retour, 2 boutons)
- Les **2 console.log temporaires** (à retirer plus tard)

**Options** :
- **A** (recommandé) : commiter le fix v2 EN GARDANT les console.log, puis faire un commit séparé "chore: retire logs temporaires de debug" qui retire les logs et inclut `notes/plan-debug-refresh-hero.md` + `notes/debug-refresh-hero.md`.
- **B** : retirer les console.log d'abord, puis commiter le fix v2 sans logs. Mais on perd la possibilité de re-diagnostiquer rapidement si le bug réapparaît.

### Message de commit suggéré (option A, fix v2 d'abord)
```
fix(parent): refresh des données enfants au retour via location.state.from

Le bouton retour de ChildDetailPage faisait navigate(-1), ce qui restaure
la location.key précédente sans déclencher le useEffect de la page cible.
ParentDashboard et ChildrenPage passent désormais state.from au navigate
vers la page enfant, et ChildDetailPage utilise cette valeur pour faire
navigate(from) explicite (nouvelle key → useEffect re-trigger → refetch).
Fallback sur /parent-dashboard si pas de from (deeplink direct, F5).
```
