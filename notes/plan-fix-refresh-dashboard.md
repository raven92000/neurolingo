# Plan — Fix refresh ParentDashboard et ChildrenPage après édition profil

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Bug fix front
> **Périmètre** : 2 fichiers modifiés (`ParentDashboard.jsx`, `ChildrenPage.jsx`)

---

## 🐛 Bug observé

Après édition du profil enfant via la modale (ex: "Léa" → "Léa B"), si le parent revient sur :
- `/parent-dashboard` (aperçu enfant en haut, carte avec prénom)
- `/parent-children` (liste "Mes enfants")

… le **prénom ancien continue d'être affiché**, alors qu'en BDD le UPDATE est bien appliqué.

---

## 🔍 Comment les 2 pages chargent leurs données actuellement

### ParentDashboard.jsx ([ligne 104-156](../src/pages/ParentDashboard.jsx#L104-L156))
```js
useEffect(() => {
  async function charger() {
    // 1. auth.getUser()
    // 2. SELECT profil parent
    // 3. SELECT parent_child_links
    // 4. SELECT *, langues(...) FROM profils WHERE user_id IN (...)
    // 5. setEnfants(profilsEnfants)
    // 6. setEnfantActif(premier) + chargerStatsEnfant(premier)
  }
  charger()
}, [navigate])  // ← deps : juste navigate
```

### ChildrenPage.jsx ([ligne 46-82](../src/pages/ChildrenPage.jsx#L46-L82))
```js
useEffect(() => {
  async function charger() {
    // 1. auth.getUser()
    // 2. SELECT role
    // 3. SELECT parent_child_links
    // 4. SELECT *, langues(...) FROM profils WHERE user_id IN (...)
    // 5. setEnfants(profilsEnfants)
  }
  charger()
}, [navigate])  // ← deps : juste navigate
```

**Les 2 hooks dépendent uniquement de `navigate`** (qui est stable entre re-renders en React Router v7). Donc le `useEffect` ne se déclenche qu'**au mount du composant**, jamais plus.

### Structure du routing (App.jsx, vérifié en lecture seule)
[App.jsx](../src/App.jsx) utilise des `<Route>` plates sans `<Outlet>` ni layout persistant. **En théorie** chaque navigation entre routes démonte l'ancien composant et monte le nouveau, donc le `useEffect` au mount devrait suffire et refetcher à chaque arrivée.

---

## 🧠 Diagnostic — pourquoi ça ne se rafraîchit pas

Plusieurs causes possibles, mais une seule **vraiment plausible** vu la structure :

### ⭐ Cause principale — Le composant n'est probablement PAS démonté entre navigations dans certains scénarios
Bien que `<Route>` soit configuré simplement, des situations peuvent garder le composant en mémoire :
- **Bouton retour du navigateur** : selon la version de React Router et le navigateur, le composant peut être restauré depuis le state plutôt que re-monté.
- **Navigation HMR (dev Vite)** : pendant le développement, Vite garde parfois le state du composant entre rechargements de modules.
- **Navigation via `BottomNavParent`** : si la nav réutilise la même instance de composant via une optimisation, le mount ne se redéclenche pas.

Si le composant n'est pas démonté, **le `useEffect` au mount ne se redéclenche pas**, donc `enfants` reste avec l'ancienne donnée chargée la première fois.

### Causes écartées
- ❌ Cache Supabase : peu probable (Wells a confirmé que les SELECT directs renvoient les bonnes données dans ChildDetailPage)
- ❌ Bug du `setEnfants` : le code est correct (`setEnfants(profilsEnfants || [])`)

---

## ✅ Fix proposé — `location.key` dans les dépendances du useEffect

### Idée
Ajouter `location.key` (issue de `useLocation()`) dans les dépendances du `useEffect` de chargement. **`location.key` change à chaque navigation React Router** (même vers la même URL, et même via le bouton retour). Donc le `useEffect` se redéclenche à chaque arrivée sur la page → refetch garanti → données fraîches.

### Pourquoi cette stratégie plutôt que d'autres ?

| Approche | Avantages | Inconvénients | Décision |
|----------|-----------|---------------|----------|
| **`location.key` dans deps** (retenu) | Minimal (1 ligne par fichier), couvre tous les scénarios de nav (retour nav, deeplink, BottomNav, browser back), pas de comm cross-composants | Refetch à chaque navigation, même si pas nécessaire (mais c'est très léger : 1-2 SELECT). | ✅ |
| Événement custom (`window.dispatchEvent` après save) | Refetch uniquement quand nécessaire | **Nécessite modifier `EditProfileModal.jsx`** → interdit par règles dures | ❌ |
| Listener `visibilitychange` / `focus` | Couvre retour d'onglet | Ne couvre PAS la nav inter-pages dans le même onglet (le focus reste) | ❌ |
| Refetch via Context global | Sémantique propre | Refacto important, hors-scope mini-fix | ❌ |
| `key` sur composant dans App.jsx | Force remount | **Nécessite modifier `App.jsx`** → interdit par règles dures | ❌ |

### Détail technique : pourquoi `location.key` ?
- `useLocation()` retourne un objet avec `pathname`, `search`, `hash`, `key`.
- `key` est une string unique générée par React Router à chaque navigation. Elle change à chaque `navigate(...)`, y compris quand on revient sur la même URL via le bouton retour.
- C'est plus robuste que `pathname` (qui ne change pas si on revient sur la même page).

### Note ESLint
La règle `react-hooks/exhaustive-deps` peut signaler `location.key` comme **dépendance inutilisée** (parce que `location.key` n'est pas lue dans le corps du `useEffect`). On désactivera la règle sur cette ligne avec un commentaire explicatif. Pattern identique à celui déjà utilisé dans [ChildrenPage.jsx:43](../src/pages/ChildrenPage.jsx#L43) pour le `useEffect` du toast.

---

## 📋 Diff précis pour chaque fichier

### 📝 ChildrenPage.jsx — `useLocation` déjà importé (ligne 2), déjà utilisé pour le toast

#### ❌ AVANT (ligne 82)
```js
    charger()
  }, [navigate])
```

#### ✅ APRÈS
```js
    charger()
    // location.key change à chaque navigation React Router (y compris bouton retour),
    // ce qui force un refetch à chaque arrivée sur la page → données toujours à jour
    // après une édition profil enfant ailleurs dans l'app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.key])
```

### 📝 ParentDashboard.jsx — `useLocation` à importer

#### ❌ AVANT (ligne 2)
```js
import { useNavigate } from 'react-router-dom'
```

#### ✅ APRÈS
```js
import { useNavigate, useLocation } from 'react-router-dom'
```

#### ❌ AVANT (ligne 43)
```js
  const navigate = useNavigate()
```

#### ✅ APRÈS
```js
  const navigate = useNavigate()
  const location = useLocation()
```

#### ❌ AVANT (ligne 156)
```js
    charger()
  }, [navigate])
```

#### ✅ APRÈS
```js
    charger()
    // location.key change à chaque navigation React Router (y compris bouton retour),
    // ce qui force un refetch à chaque arrivée sur la page → données toujours à jour
    // après une édition profil enfant ailleurs dans l'app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.key])
```

---

## ⚠️ Points d'attention / risques

### Refetch à chaque navigation
Avec ce fix, les 2 pages refont leurs SELECT à chaque arrivée. C'est léger (1-2 requêtes Supabase) et invisible pour l'utilisateur (le spinner s'affiche brièvement, puis les données apparaissent). **Acceptable** pour un MVP, et conforme au comportement attendu UX.

### `chargerStatsEnfant` dans ParentDashboard
La fonction `chargerStatsEnfant` est appelée à l'intérieur de `charger()` ligne 146. Elle sera donc relancée à chaque refresh, ce qui refera les SELECT chapitres/leçons/progression. **Acceptable** (Wells a confirmé que la page fonctionne déjà avec ces requêtes au mount initial).

### Hors-scope : pas touché
- Aucune modif de `ChildDetailPage.jsx` (les 2 console.log temporaires y restent, à retirer dans un commit séparé comme prévu)
- Aucune modif de `EditProfileModal.jsx` ni d'autres composants enfants
- Aucune modif BDD, aucune nouvelle dépendance, aucune modif de `App.jsx`

### Risque si le fix ne marche pas
Très improbable (le pattern `location.key` est éprouvé). Si malgré tout le bug persiste, on regardera :
- La structure de `BottomNavParent` pour comprendre comment elle navigue
- L'éventualité d'un cache `Supabase` côté SDK
- Un test en console pour confirmer que le `useEffect` se redéclenche bien

---

## 🧪 Tests visuels à faire après application

### Cas 1 — ChildrenPage : édition + retour
1. Se connecter parent, aller sur `/parent-children`
2. Noter le prénom d'un enfant (ex: Léa)
3. Cliquer sur sa carte → arrivée sur `/parent/enfant/:userId`
4. Modifier le prénom via la modale (ex: "Léa" → "Léa Test")
5. Enregistrer (toast vert apparaît, Hero mis à jour)
6. Bouton retour (`<-`) dans le header → arrivée sur `/parent-children`
7. **Vérifier** : la carte de Léa affiche maintenant "Léa Test"

### Cas 2 — ParentDashboard : édition + retour
1. Depuis `/parent/enfant/:userId` après édition, naviguer vers `/parent-dashboard` via la BottomNavParent
2. **Vérifier** : la carte enfant en haut affiche le nouveau prénom

### Cas 3 — Cycle complet inter-pages
1. `/parent-dashboard` → noter le prénom
2. Cliquer sur la carte enfant → `/parent/enfant/:userId`
3. Édition → "Léa Test 2"
4. Retour via BottomNav vers `/parent-children` → vérifier "Léa Test 2"
5. Retour via BottomNav vers `/parent-dashboard` → vérifier "Léa Test 2"

### Cas 4 — Pas de régression : navigation simple sans édition
1. Naviguer entre `/parent-dashboard`, `/parent-children`, `/parent/enfant/:userId` sans rien modifier
2. **Vérifier** : pas d'erreur console, pas de comportement bizarre, les données affichées sont cohérentes

### Cas 5 — F5 (reload complet)
1. Sur `/parent-dashboard` ou `/parent-children`, après une édition, faire F5
2. **Vérifier** : les nouvelles données apparaissent (confirmation BDD)

---

## 🤝 Validation attendue

J'attends ton **OK explicite** pour appliquer les 2 diffs. Pas une ligne de code écrite tant que tu n'as pas validé.

Après application :
1. `npm run lint` doit passer sans nouveau warning sur les 2 fichiers
2. J'écris `notes/fix-refresh-dashboard.md` avec le diff réellement appliqué + résultat lint
3. Tu testes les 5 cas visuels ci-dessus
