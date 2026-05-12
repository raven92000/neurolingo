# Fix — Refresh ParentDashboard et ChildrenPage après édition profil

> **Statut** : ✅ Appliqué
> **Date** : 2026-05-12
> **Type** : Bug fix front
> **Plan d'origine** : [plan-fix-refresh-dashboard.md](plan-fix-refresh-dashboard.md)

---

## 🐛 Bug corrigé

Après édition du profil enfant via la modale, le parent revenait sur `/parent-dashboard` (carte enfant en haut) et `/parent-children` (liste "Mes enfants") et continuait de voir **l'ancien prénom** alors qu'en BDD le UPDATE était correct.

Cause : les `useEffect` de chargement dépendaient uniquement de `[navigate]` (qui est stable), donc ne se redéclenchaient pas si le composant n'était pas démonté/remonté entre 2 navigations.

---

## ✏️ Diff réellement appliqué

### 📝 1. `src/pages/ChildrenPage.jsx` — 1 modification

`useLocation` était déjà importé et utilisé (pour le toast). Juste ajout de `location.key` dans les deps du `useEffect` de chargement.

```diff
     charger()
-  }, [navigate])
+    // location.key change à chaque navigation React Router (y compris bouton retour),
+    // ce qui force un refetch à chaque arrivée sur la page → données toujours à jour
+    // après une édition profil enfant ailleurs dans l'app.
+  }, [navigate, location.key])
```

### 📝 2. `src/pages/ParentDashboard.jsx` — 3 modifications

#### Import
```diff
-import { useNavigate } from 'react-router-dom'
+import { useNavigate, useLocation } from 'react-router-dom'
```

#### Déclaration du hook
```diff
 export default function ParentDashboard() {
   const navigate = useNavigate()
+  const location = useLocation()
   const [parent, setParent] = useState(null)
```

#### Deps du useEffect
```diff
     charger()
-  }, [navigate])
+    // location.key change à chaque navigation React Router (y compris bouton retour),
+    // ce qui force un refetch à chaque arrivée sur la page → données toujours à jour
+    // après une édition profil enfant ailleurs dans l'app.
+  }, [navigate, location.key])
```

### Note sur les `eslint-disable-next-line`
Le plan prévoyait des `// eslint-disable-next-line react-hooks/exhaustive-deps` pour anticiper un éventuel warning. **Au lint final, le linter a confirmé que la règle `exhaustive-deps` n'était PAS violée** (puisque `location` est bien utilisé via `location.key` dans les deps). Les `eslint-disable` ont donc été **retirés** car ils provoquaient un warning "unused directive". Les commentaires explicatifs au-dessus des deps ont été **conservés**.

---

## ✅ Validations effectuées

- ✅ `npm run lint` : **15 problèmes total** (11 erreurs + 4 warnings) — identique au baseline pré-fix.
- ✅ **0 nouveau warning/erreur** sur `ChildrenPage.jsx` et `ParentDashboard.jsx`.
- ✅ Périmètre respecté : 2 fichiers touchés, comme prévu dans le plan. Pas de modif d'`App.jsx`, `EditProfileModal.jsx`, etc.
- ✅ Les 2 console.log temporaires dans `ChildDetailPage.jsx` sont restés en place (à retirer dans un commit séparé comme prévu).

---

## 🧪 Tests visuels à refaire par Wells

### Cas 1 — ChildrenPage : édition + retour
1. Aller sur `/parent-children`, noter le prénom d'un enfant (ex: Léa)
2. Cliquer sur sa carte → `/parent/enfant/:userId`
3. Modifier le prénom via la modale (ex: "Léa" → "Léa Test")
4. Enregistrer (toast vert + Hero mis à jour)
5. Bouton retour (`<-`) → arrivée sur `/parent-children`
6. **Vérifier** : la carte de Léa affiche "Léa Test"

### Cas 2 — ParentDashboard : édition + retour
1. Depuis `/parent/enfant/:userId` après édition, navigation vers `/parent-dashboard` via la BottomNavParent
2. **Vérifier** : la carte enfant en haut affiche le nouveau prénom

### Cas 3 — Cycle complet inter-pages
1. `/parent-dashboard` → noter le prénom
2. Cliquer sur la carte enfant → `/parent/enfant/:userId`
3. Édition → "Léa Test 2"
4. Retour via BottomNav vers `/parent-children` → vérifier "Léa Test 2"
5. Retour via BottomNav vers `/parent-dashboard` → vérifier "Léa Test 2"

### Cas 4 — Pas de régression
- Naviguer entre `/parent-dashboard`, `/parent-children`, `/parent/enfant/:userId` sans rien modifier → pas d'erreur console, pas de comportement bizarre, données cohérentes.

### Cas 5 — F5 (reload complet)
- Après édition, faire F5 sur `/parent-dashboard` ou `/parent-children` → les nouvelles données apparaissent.

---

## 🚿 Cleanup en attente

Les **2 `console.log` temporaires** dans [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) sont **toujours en place** (marqueurs `// 🔬 LOG TEMPORAIRE — à retirer après diagnostic`). À retirer dans un commit dédié quand on aura validé que toute la chaîne fonctionne (ChildDetailPage + ParentDashboard + ChildrenPage).

---

## 📝 Notes pour le commit

### Fichiers à inclure dans le commit "fix refresh dashboard"
```
src/pages/ChildrenPage.jsx                          (modifié)
src/pages/ParentDashboard.jsx                       (modifié)
notes/plan-fix-refresh-dashboard.md                 (nouveau)
notes/fix-refresh-dashboard.md                      (nouveau)
```

### Message de commit suggéré
```
fix(parent): refresh des données enfants au retour sur dashboard/liste

ParentDashboard et ChildrenPage ne se rafraîchissaient pas après une
édition de profil enfant (Sprint 2C-2). Ajout de location.key dans les
deps du useEffect de chargement pour forcer un refetch à chaque arrivée
sur la page (couvre les navigations BottomNav, browser back, deeplink).
```

### À ne PAS inclure dans ce commit
- `src/pages/ChildDetailPage.jsx` (contient encore les 2 console.log temporaires)
- `notes/plan-debug-refresh-hero.md` et `notes/debug-refresh-hero.md` (à commiter ensemble avec le cleanup des logs dans un commit séparé)
