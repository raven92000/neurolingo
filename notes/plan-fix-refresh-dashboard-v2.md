# Plan v2 — Fix refresh après navigation `navigate(-1)`

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Bug fix front (suite du fix v1 qui n'a pas suffi)
> **Périmètre** : 3 fichiers modifiés — tous dans le périmètre autorisé
> **Plan précédent** : [plan-fix-refresh-dashboard.md](plan-fix-refresh-dashboard.md) (v1, encore actif)

---

## 🐛 Cause confirmée

Le fix v1 (`location.key` dans les deps des useEffect de `ParentDashboard.jsx` et `ChildrenPage.jsx`) ne marche pas dans le scénario réel parce que :

1. L'utilisateur clique sur le bouton retour `←` en haut de `/parent/enfant/:userId`
2. Ce bouton fait `navigate(-1)` ([ChildDetailPage.jsx:120](../src/pages/ChildDetailPage.jsx#L120) et [:151](../src/pages/ChildDetailPage.jsx#L151))
3. React Router restaure l'entrée d'historique précédente **avec sa `location.key` originale** (pas une nouvelle)
4. Le composant cible (`ParentDashboard` ou `ChildrenPage`) reçoit la **même** `location.key` qu'avant son démontage
5. Le `useEffect` ne se redéclenche pas → pas de refetch → ancien prénom affiché

**Confirmé en BDD** : `nom = "Lea test"` mais `/parent-children` affiche "Lea" et `/parent-dashboard` affiche "Lea (7 ans)".

---

## 📝 Code actuel concerné

### Bouton retour de ChildDetailPage (2 occurrences)

#### Dans l'écran d'erreur ([ligne 117-123](../src/pages/ChildDetailPage.jsx#L117-L123))
```jsx
<button
  onClick={() => navigate(-1)}
  style={{ ... }}
  aria-label="Retour"
>
  ←
</button>
```

#### Dans le rendu normal ([ligne 148-154](../src/pages/ChildDetailPage.jsx#L148-L154))
```jsx
<button
  onClick={() => navigate(-1)}
  style={{ ... }}
  aria-label="Retour"
>
  ←
</button>
```

### Navigation vers la page enfant (2 occurrences)

#### Depuis ParentDashboard ([ligne 264](../src/pages/ParentDashboard.jsx#L264))
```jsx
onClick={() => enfantActif?.user_id && navigate('/parent/enfant/' + enfantActif.user_id)}
```

#### Depuis ChildrenPage ([ligne 159](../src/pages/ChildrenPage.jsx#L159))
```jsx
onClick={() => navigate('/parent/enfant/' + enfant.user_id)}
```

---

## ⚖️ Comparaison des stratégies

| # | Stratégie | UX | Refetch garanti | Fichiers touchés | Décision |
|---|-----------|-----|------------------|------------------|----------|
| **1** | Remplacer `navigate(-1)` par `navigate('/parent-children')` fixe | ❌ Perd le "d'où on vient" : si entré via dashboard, on revient sur /parent-children | ✅ Nouvelle key | 1 (ChildDetailPage) | ❌ Régression UX |
| **2** | `location.state.from` : poser `from` au navigate, lire au retour | ✅ Préserve le "d'où on vient" | ✅ Nouvelle key (navigate avec path) | 3 (les 3 du périmètre autorisé) | ✅ **RETENU** |
| **3** | Custom event `window.dispatchEvent` après save | ✅ Préserve nav | ✅ Refetch via listener | 4 (les 3 + **EditProfileModal** hors périmètre) | ❌ Touche un fichier hors périmètre |
| **4** | `navigate(from, { state: { invalidate: Date.now() } })` + dep `location.state?.invalidate` | ✅ Préserve nav | ✅ Force re-render | 3 | ⚠️ Plus complexe, moins lisible que 2 |

**Choix : Stratégie 2** — la plus propre, dans le périmètre, sémantiquement claire.

---

## ✅ Stratégie 2 retenue — `location.state.from`

### Principe
1. Quand le parent clique sur une carte enfant (depuis Dashboard ou ChildrenPage), on passe `state: { from: '/parent-dashboard' }` ou `state: { from: '/parent-children' }` au `navigate(...)`.
2. ChildDetailPage lit `location.state?.from` au montage.
3. Quand le parent clique sur le bouton retour `←`, on fait `navigate(location.state.from)` au lieu de `navigate(-1)`.
4. Si pas de `from` (ex: deeplink direct, F5), fallback sur `navigate('/parent-dashboard')` (destination par défaut sûre).

### Pourquoi ça résout le bug
- `navigate('/parent-children')` ou `navigate('/parent-dashboard')` avec un **path explicite** crée une **nouvelle entrée d'historique** avec une **nouvelle `location.key`** (contrairement à `navigate(-1)` qui restaure l'ancienne).
- La nouvelle `location.key` déclenche le `useEffect` (qui a `location.key` dans ses deps grâce au fix v1).
- Refetch → données fraîches → bon prénom affiché. ✅

### UX
- Le bouton retour ramène toujours là où on vient (Dashboard → enfant → Dashboard, ou Children → enfant → Children).
- En cas de deeplink direct sur `/parent/enfant/:userId` (sans `from`), le fallback envoie sur `/parent-dashboard`. Sain.

---

## 🔧 Fix v1 — à garder ou retirer ?

**Décision : GARDER le fix v1** (`location.key` dans les deps des useEffect de ParentDashboard et ChildrenPage). Raisons :
- Il est nécessaire au fix v2 pour fonctionner (le `useEffect` doit avoir `location.key` dans ses deps pour réagir aux nouvelles keys créées par le navigate avec path).
- Il couvre d'autres scenarios de navigation que le bouton retour (ex: clic sur BottomNavParent, deeplink, F5, etc.).
- Code v1 et v2 sont **complémentaires**, pas redondants.

---

## 📋 Diff précis pour chaque fichier

### 📝 1. `src/pages/ParentDashboard.jsx` — 1 modification

#### ❌ AVANT (ligne 264)
```jsx
          onClick={() => enfantActif?.user_id && navigate('/parent/enfant/' + enfantActif.user_id)}
```

#### ✅ APRÈS
```jsx
          onClick={() => enfantActif?.user_id && navigate('/parent/enfant/' + enfantActif.user_id, { state: { from: '/parent-dashboard' } })}
```

---

### 📝 2. `src/pages/ChildrenPage.jsx` — 1 modification

#### ❌ AVANT (ligne 159)
```jsx
                onClick={() => navigate('/parent/enfant/' + enfant.user_id)}
```

#### ✅ APRÈS
```jsx
                onClick={() => navigate('/parent/enfant/' + enfant.user_id, { state: { from: '/parent-children' } })}
```

---

### 📝 3. `src/pages/ChildDetailPage.jsx` — 4 modifications

#### Import (ligne 2)
```diff
-import { useNavigate, useParams } from 'react-router-dom'
+import { useNavigate, useParams, useLocation } from 'react-router-dom'
```

#### Déclaration du hook (ligne 12-13)
```diff
   const navigate = useNavigate()
   const { userId } = useParams()
+  const location = useLocation()
```

#### Nouvelle fonction `retour` (à ajouter, ex: juste après la déclaration des hooks)
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

#### Remplacer les 2 `onClick={() => navigate(-1)}` (lignes 120 et 151)
```diff
-          onClick={() => navigate(-1)}
+          onClick={retour}
```
(à appliquer aux 2 occurrences)

---

## ⚠️ Points d'attention / risques

### Cas deeplink direct sur `/parent/enfant/:userId`
Si l'utilisateur arrive directement sur la page enfant sans passer par Dashboard ni ChildrenPage (ex: F5 sur la page enfant, ou URL collée), `location.state?.from` sera `undefined`. Le bouton retour ramènera alors sur `/parent-dashboard` (fallback choisi). C'est sain (le Dashboard étant la "home" parent).

### Conservation du fix v1
Le fix v1 (`location.key` dans les deps des useEffect) **reste actif** et est nécessaire au bon fonctionnement du fix v2 (sans lui, même si `navigate('/parent-dashboard')` crée une nouvelle key, le useEffect ne se redéclencherait pas).

### Les 2 console.log temporaires dans ChildDetailPage.jsx
**Restent en place** comme demandé. À retirer dans un commit séparé une fois toute la chaîne validée.

### Modifications supplémentaires éventuelles
Si plus tard d'autres pages naviguent vers `/parent/enfant/:userId` (ex: une notification, un email parent), il faudra aussi qu'elles passent `state: { from: '/quelque-part' }` pour bénéficier du retour intelligent. Hors-scope ce sprint.

### Régression possible : suppression de l'entrée d'historique
Avec `navigate('/parent-dashboard')` au lieu de `navigate(-1)`, on **ajoute** une nouvelle entrée d'historique au lieu de reculer. Conséquences :
- Le bouton retour du **navigateur** (pas le bouton retour custom de l'UI) cumulera les entrées : parent → enfant → parent → enfant → parent (à chaque aller-retour).
- C'est un comportement légèrement différent de la navigation native. **Acceptable** pour ce use case (mobile-first, l'utilisateur utilise rarement le bouton retour navigateur).
- Alternative : `navigate(from, { replace: true })` pour remplacer l'entrée actuelle. Mais ça empêcherait le navigateur de "remonter" dans l'historique normalement. Probablement plus déroutant.

**Décision** : on garde `navigate(from)` simple, sans `replace`. Si Wells observe une UX bizarre avec le bouton retour navigateur, on ajustera.

---

## 🧪 Tests visuels à faire après application

### Cas 1 — Le bug d'origine
1. Aller sur `/parent-children`, noter le prénom (ex: "Lea")
2. Cliquer sur la carte enfant → arrivée sur `/parent/enfant/:userId`
3. Modifier le prénom en "Lea test 2"
4. Enregistrer (toast vert + Hero mis à jour)
5. Cliquer sur le bouton retour `←` en haut
6. **Vérifier** : on revient sur `/parent-children` ET la carte affiche "Lea test 2"

### Cas 2 — Depuis Dashboard
1. Aller sur `/parent-dashboard`, voir la carte enfant en haut
2. Cliquer sur la carte → `/parent/enfant/:userId`
3. Modifier le prénom
4. Enregistrer
5. Cliquer sur le bouton retour `←`
6. **Vérifier** : on revient sur `/parent-dashboard` ET la carte enfant affiche le nouveau prénom

### Cas 3 — Cycle complet
1. `/parent-dashboard` → carte enfant → édition → retour → vérifier sur dashboard
2. Naviguer vers `/parent-children` via BottomNav → vérifier que la liste affiche aussi le nouveau prénom (le fix v1 doit faire son boulot ici)

### Cas 4 — Deeplink direct (cas fallback)
1. Ouvrir directement `http://localhost:5173/parent/enfant/:userId` (sans passer par Dashboard ni ChildrenPage)
2. Cliquer sur le bouton retour `←`
3. **Vérifier** : on arrive sur `/parent-dashboard` (fallback)

### Cas 5 — Pas de régression sur la nav inter-pages classique
- Naviguer entre les 3 pages via BottomNavParent (Accueil, Mes enfants, Réglages) sans rien modifier → tout fonctionne normalement.

---

## 🤝 Validation attendue

J'attends ton **OK explicite** pour appliquer ces 3 diffs (1 ligne dans ParentDashboard + 1 ligne dans ChildrenPage + 4 modifs dans ChildDetailPage).

Périmètre : **3 fichiers, tous autorisés**. **Pas besoin de signaler un périmètre étendu** (EditProfileModal et autres restent intouchés).

Après application :
1. `npm run lint` doit passer sans nouveau warning
2. J'écris `notes/fix-refresh-dashboard-v2.md` avec le diff réellement appliqué + résultat lint
3. Tu testes les 5 cas visuels ci-dessus
