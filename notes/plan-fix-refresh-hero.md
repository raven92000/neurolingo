# Plan — Fix refresh du Hero après édition profil

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Bug fix front uniquement
> **Périmètre** : 1 fichier modifié, 1 ligne changée

---

## 🐛 Bug observé

Sur `/parent/enfant/:userId` :
1. Le parent ouvre la modale "Modifier le profil"
2. Modifie le prénom (ex: "Léa" → "Léa B")
3. Clique Enregistrer
4. Le **toast vert "Profil mis à jour ✓" s'affiche** correctement
5. **MAIS** le Hero (ChildDetailHero) continue d'afficher l'ancien prénom "Léa"

En BDD, le UPDATE est bien appliqué (vérifié par Wells côté Supabase). Le bug est **côté front uniquement**.

---

## 🔍 Diagnostic

### Vérification des 3 hypothèses initiales

| Hypothèse | Vérification dans le code | Statut |
|-----------|--------------------------|--------|
| `useEffect` a `refreshKey` dans ses deps | [ChildDetailPage.jsx:89](../src/pages/ChildDetailPage.jsx#L89) → `}, [navigate, userId, refreshKey])` | ✅ OK |
| `setEnfant` est appelé après refetch | [ChildDetailPage.jsx:59](../src/pages/ChildDetailPage.jsx#L59) → `setEnfant(profilEnfant)` | ✅ Code OK |
| Hero reçoit `enfant` en prop | [ChildDetailPage.jsx:179](../src/pages/ChildDetailPage.jsx#L179) → `<ChildDetailHero enfant={enfant} ... />` | ✅ OK |

**Conclusion** : le code est structurellement correct. Aucune des 3 hypothèses Wells n'est isolément la cause. Le bug est plus subtil.

### Hypothèses possibles (par ordre de probabilité, sans repro runtime)

#### A) ⭐ Plus probable — **Erreur silencieuse pendant le refetch**

Le refetch fait **4 étapes consécutives** ([ChildDetailPage.jsx:27-58](../src/pages/ChildDetailPage.jsx#L27-L58)) :
1. `supabase.auth.getUser()` — récupère la session
2. `SELECT role FROM profils WHERE user_id = parent.id` — vérifie que le user connecté est parent
3. `SELECT child_id FROM parent_child_links WHERE parent_id = ... AND child_id = ...` — vérifie le lien
4. `SELECT *, langues(...) FROM profils WHERE user_id = userId` — récupère le profil enfant

**Si l'une de ces 4 étapes échoue silencieusement** (RLS qui filtre différemment après l'UPDATE, lag réseau, session altérée par la modale), le code `throw` puis tombe dans le `catch` ligne 81-83. Ligne 82 : `setErreurChargement(...)`. Ligne 85 (`finally`) : `setChargement(false)`.

**MAIS** :
- `enfant` n'est **jamais remis à null**, il garde donc l'ancien profil
- `chargement` repasse à false → l'écran spinner disparaît
- Ligne 113 : `if (erreurChargement || !enfant)` retourne l'écran d'erreur. Mais `enfant` étant l'ancien (toujours défini), on **NE** rentre **PAS** dans cet écran d'erreur. On tombe dans le rendu normal avec l'ancien `enfant`.

**Conséquence** : le bug reproduit exactement le symptôme décrit (Hero affiche l'ancien prénom, pas d'écran d'erreur visible, le toast vert s'affiche quand même car il a été setté avant le refetch).

#### B) Possible — **Race condition / re-render manqué**

`handleProfileUpdated` enchaîne `setRefreshKey(k+1)` + `setToastProfil(...)`. Ces 2 setStates sont batchés par React 18. Le `useEffect` async lance ensuite `charger()`. Si pour une raison subtile (closure stale, optimisation React, micro-task scheduling), le `setEnfant(nouveauProfil)` ne provoque pas un re-render visible du Hero, le bug serait observé. **Peu probable mais théoriquement possible.**

#### C) Improbable — **Cache PostgREST / lag de propagation**

Le SELECT post-UPDATE pourrait lire une version pas-encore-propagée. Très rare sur Supabase mono-région. À écarter sauf preuve.

---

## ✅ Fix proposé — déterministe, couvre A et B

**Stratégie** : ajouter une `key={refreshKey}` sur `<ChildDetailHero>`. Quand `refreshKey` change, React démonte et remonte le composant à neuf, ce qui garantit :
- Un re-render visible (couvre B)
- L'élimination de toute closure stale dans le sous-arbre Hero (couvre B)
- **MAIS attention** : si la cause est A (refetch silencieusement échoué et `enfant` non mis à jour), le remount affichera quand même l'ancien `enfant` (car la prop n'a pas changé). Le fix par `key` **ne couvre pas A à lui seul** s'il est isolé.

**Décision** : commencer par ce fix minimal (1 ligne). Si le bug persiste, on aura prouvé que la cause est A → étape suivante = diagnostic via logs runtime sur les 4 étapes du refetch.

### 📋 Diff proposé AVANT / APRÈS

**Fichier** : [src/pages/ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) (1 ligne modifiée, ligne 179)

#### ❌ AVANT (ligne 179)
```jsx
<ChildDetailHero enfant={enfant} messageEmotionnel={messageEmotionnel} />
```

#### ✅ APRÈS
```jsx
<ChildDetailHero key={refreshKey} enfant={enfant} messageEmotionnel={messageEmotionnel} />
```

**Aucun autre changement.** Pas de modif de `ChildDetailHero.jsx`. Pas de modif de la logique de `ChildDetailPage`.

---

## ⚠️ Points d'attention / risques

### Pourquoi ne PAS étendre la `key` à `<ChildDetailStats>`, `<ChildDetailActivity>`, `<ChildDetailActions>`
- **`ChildDetailActions`** : contient la modale `EditProfileModal`. Si on met `key={refreshKey}` dessus, **la modale sera démontée pendant son `onSuccess()`** (puisque refreshKey vient de changer). Risque de casser le flow de save en plein vol. **À NE PAS faire.**
- **`ChildDetailStats`** et **`ChildDetailActivity`** : si Wells observe que ces composants reflètent bien le nouveau prénom mais pas le Hero, alors le bug est localisé au Hero et étendre la key serait du sur-fixage. Si Wells observe le même bug sur ces composants, on étendra dans un 2ᵉ patch.

### Risque "le fix ne marche pas" (cause A)
Si la cause réelle est A (erreur silencieuse pendant le refetch), `setEnfant(nouveauProfil)` n'est jamais appelé, et la `key={refreshKey}` remontera juste le Hero avec **le même** `enfant` (l'ancien). Le bug persisterait à l'identique. Dans ce cas, **prochain pas** : ajouter un log temporaire dans `charger()` pour confirmer que le SELECT termine avec les nouvelles données et que `setEnfant` est bien appelé.

### Risque "régression d'UX"
Le remount complet du Hero à chaque save fait disparaître/réapparaître le composant en une frame. Sur fonds sombre il devrait être imperceptible, mais à confirmer visuellement (test 1 ci-dessous).

### Hors-périmètre — pas touché
- Aucune modif de `ChildDetailHero.jsx`
- Aucune modif de `EditProfileModal.jsx`, `ChildDetailActions.jsx`, `EditProfileForm.jsx`, etc.
- Aucune modif BDD, aucun nouveau composant

---

## 🧪 Test visuel à refaire après le fix

1. **Cas principal — édition prénom**
   - Ouvrir un enfant (ex: Léa, `/parent/enfant/:userId`)
   - Cliquer "Modifier le profil" → modifier le prénom en "Léa B"
   - Enregistrer
   - **Attendre 1 seconde** (laisser le refetch async se terminer)
   - **Vérifier** : le Hero affiche "Léa B" (et plus "Léa"). Le toast vert reste visible 3s. La page n'a pas rechargé.

2. **Cas combiné — édition prénom + profil cognitif**
   - Même enfant : changer prénom en "Léa C" ET passer profil `tdah` → `dyslexie`
   - Enregistrer
   - **Vérifier** : le Hero affiche "Léa C" + badge bleu "Dyslexie" (fix Sprint 2C-2 + fix couleur badge déjà appliqués).

3. **Cas pas de remount visible**
   - Observer attentivement le Hero pendant le save : il ne doit PAS y avoir de flash blanc, de saute, ou d'écran noir entre l'ancien et le nouveau rendu.

4. **Cas refresh complet (F5)**
   - Après une édition réussie, faire F5 sur la page
   - **Vérifier** : le Hero affiche bien le nouveau prénom au reload (confirmation BDD)

---

## 🚫 Si le fix ne marche pas

Probabilité : **modérée** (~30%, si la cause est A).

**Next step** : ajouter 2 logs temporaires dans `charger()` :
```js
console.log('[ChildDetailPage] charger() lancé, refreshKey =', refreshKey)
// ... juste avant setEnfant :
console.log('[ChildDetailPage] profil reçu :', profilEnfant?.nom)
```

Puis Wells reproduit le bug avec la console ouverte et me transmet le résultat. Si on voit "charger() lancé" mais pas "profil reçu", la cause est confirmée comme **A** (erreur silencieuse, probablement dans le SELECT). Si on voit "profil reçu : Léa B" mais que le Hero affiche encore "Léa", la cause est confirmée comme **B** (re-render manqué) — auquel cas le fix par `key` aurait dû marcher.

---

## 🤝 Validation attendue

J'attends ton **OK explicite** pour appliquer ce diff. Pas une ligne de code écrite tant que tu n'as pas validé.

Après application :
1. `npm run lint` doit passer sans nouveau warning
2. J'écris `notes/fix-refresh-hero.md` avec le diff réellement appliqué + résultat lint
3. Tu testes les 4 cas visuels ci-dessus
