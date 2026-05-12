# Plan — Logs temporaires pour debug refresh Hero

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Diagnostic temporaire (logs)
> **Périmètre** : 1 fichier modifié, 2 logs ajoutés (à retirer ensuite)

---

## 🎯 Objectif

Le fix `key={refreshKey}` n'a pas corrigé le bug du Hero qui affiche l'ancien prénom après édition. **Hypothèse confirmée : A — erreur silencieuse pendant le refetch**. On a besoin de savoir **précisément où** ça casse parmi les 4 étapes du refetch (auth → role → lien → profil enfant).

Pour ça, on ajoute **2 logs `console.log` temporaires** dans `charger()`. Ils seront retirés une fois le diagnostic posé et le vrai fix appliqué.

---

## 🔬 Les 2 logs à ajouter

### Log 1 — Confirme que `charger()` se redéclenche bien après le save

**Emplacement** : tout début de `charger()`, juste après l'ouverture du `try` ligne 24

**Code** :
```js
console.log('[debug] charger() lancé, refreshKey =', refreshKey, 'userId =', userId)
```

**Ce qu'il prouve** :
- Si on le voit avec `refreshKey = 1` (puis 2, 3...) après chaque save → le `useEffect` se redéclenche bien. La cause n'est pas dans le déclenchement.
- Si on **ne le voit pas** → le `useEffect` n'est pas redéclenché (impossible vu les vérifications, mais on saurait).

### Log 2 — Confirme que le SELECT du profil enfant a réussi et avec quoi

**Emplacement** : juste avant `setEnfant(profilEnfant)` ligne 59, c'est-à-dire entre les lignes 58 et 59

**Code** :
```js
console.log('[debug] profil enfant reçu :', { nom: profilEnfant?.nom, profil_type: profilEnfant?.profil_type, user_id: profilEnfant?.user_id })
```

**Ce qu'il prouve** :
- Si on le voit avec **le NOUVEAU nom** → le SELECT a réussi et `setEnfant` est sur le point d'être appelé avec les bonnes données. Si malgré ça l'UI reste avec l'ancien, on est sur un cas extrême B (très improbable maintenant qu'on a `key={refreshKey}`).
- Si on le voit avec **l'ANCIEN nom** → cause **C** confirmée (cache Supabase ou lag de propagation). On adoptera alors un workaround (ex: optimistic update, ou `.select()` après l'UPDATE).
- Si on **ne le voit PAS** alors que Log 1 est apparu → cause **A** confirmée. Une des 3 étapes intermédiaires (auth, role, lien) a foiré. On utilisera alors le `console.error` déjà présent ligne 82 pour identifier l'erreur exacte.

### Le `console.error` déjà présent (ligne 82) sert de filet

Pas besoin de l'ajouter, il existe déjà :
```js
console.error('Erreur chargement Détail enfant', error)
```

Cet error log capte automatiquement toute exception levée par n'importe laquelle des 4 étapes. C'est notre filet de sécurité pour le scénario "Log 1 visible, Log 2 absent".

---

## 📋 Diff proposé AVANT / APRÈS

**Fichier** : [src/pages/ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx)

### ❌ AVANT (lignes 22-60 simplifiées)
```js
useEffect(() => {
  async function charger() {
    try {
      setErreurChargement(null)

      const { data: { user } } = await supabase.auth.getUser()
      // ... auth, role, lien ...

      const { data: profilEnfant, error: erreurEnfant } = await supabase
        .from('profils')
        .select('*, langues(code, nom, emoji)')
        .eq('user_id', userId)
        .single()
      if (erreurEnfant) throw erreurEnfant
      setEnfant(profilEnfant)
```

### ✅ APRÈS
```js
useEffect(() => {
  async function charger() {
    try {
      console.log('[debug] charger() lancé, refreshKey =', refreshKey, 'userId =', userId)  // 🔬 LOG TEMPORAIRE — à retirer après diagnostic
      setErreurChargement(null)

      const { data: { user } } = await supabase.auth.getUser()
      // ... auth, role, lien ...

      const { data: profilEnfant, error: erreurEnfant } = await supabase
        .from('profils')
        .select('*, langues(code, nom, emoji)')
        .eq('user_id', userId)
        .single()
      if (erreurEnfant) throw erreurEnfant
      console.log('[debug] profil enfant reçu :', { nom: profilEnfant?.nom, profil_type: profilEnfant?.profil_type, user_id: profilEnfant?.user_id })  // 🔬 LOG TEMPORAIRE — à retirer après diagnostic
      setEnfant(profilEnfant)
```

**Aucune autre modif.** Pas de modif logique. Pas de modif de `ChildDetailHero.jsx`. Pas de modif BDD. Les `// 🔬 LOG TEMPORAIRE — à retirer après diagnostic` servent de marqueurs pour retirer facilement les logs après.

---

## 🧪 Comment reproduire le bug (à faire par Wells)

1. Ouvrir le projet en dev : `npm run dev`
2. Ouvrir le navigateur sur `http://localhost:5173` (ou le port que Vite a alloué)
3. **Ouvrir la console DevTools** : F12 ou clic droit → "Inspecter" → onglet "Console"
4. **Vider la console** (icône poubelle) pour avoir un écran propre
5. Se connecter en parent
6. Naviguer vers `/parent/enfant/:userId` d'un enfant (ex: Léa)
7. **Observer la console** : tu devrais voir Log 1 une première fois avec `refreshKey = 0` (au mount initial) et Log 2 avec le profil actuel.
8. Cliquer "Modifier le profil" → changer le prénom (ex: "Léa" → "Léa Test")
9. Enregistrer
10. **Observer la console** immédiatement après le save :
    - Tu devrais voir Log 1 avec `refreshKey = 1` (le re-déclenchement)
    - **Puis l'un de ces 3 scénarios** :
      - **(Scénario 1)** Log 2 avec `nom: "Léa Test"` → le SELECT renvoie bien les nouvelles données. Le bug est alors **dans le re-render React** (très surprenant vu la key, à investiguer).
      - **(Scénario 2)** Log 2 avec `nom: "Léa"` (l'ancien) → le SELECT renvoie l'ancien profil → cache Supabase ou lag propagation (cause C).
      - **(Scénario 3)** Pas de Log 2, MAIS un `console.error` "Erreur chargement Détail enfant" → erreur dans auth/role/lien (cause A confirmée). Le contenu de l'erreur précisera laquelle.

---

## 📸 Ce que tu dois me renvoyer

Une **capture d'écran de la console DevTools** prise **juste après le save**, montrant **toutes les lignes** apparues entre :
- Le mount initial (Log 1 + Log 2 avec l'ancien profil)
- Le clic sur Enregistrer (probablement quelques lignes après)

L'idéal serait au moins :
- 1 capture de la console après mount (état initial)
- 1 capture de la console après save (les nouvelles lignes ajoutées)

Si la console est très peuplée par d'autres logs (Vite HMR, Three.js, etc.), tu peux filtrer en tapant `[debug]` dans la barre de recherche de la console — ça n'affichera que les 2 logs ajoutés.

**À noter** : si tu vois un `console.error` rouge avec "Erreur chargement Détail enfant", **inclus aussi le détail de l'erreur** (clique sur la flèche pour développer l'objet d'erreur, et capture).

---

## ⚠️ Points d'attention / risques

### Logs temporaires uniquement
Les 2 `console.log` sont **du code de diagnostic à retirer** une fois le bug identifié. Les marqueurs `// 🔬 LOG TEMPORAIRE — à retirer après diagnostic` permettent de les retrouver facilement (recherche par ce texte ou par `[debug]`).

### Pas de risque fonctionnel
`console.log` ne change rien au comportement de l'app. Aucun risque de régression.

### Lint
Le linter ESLint pourrait accepter ces `console.log` sans warning (à confirmer après application). Si la règle `no-console` est active, on aurait un warning sur ces 2 lignes — pas bloquant pour le diagnostic, mais à signaler.

### Hors-périmètre
- Aucune modif de `ChildDetailHero.jsx`
- Aucune modif de `EditProfileModal.jsx` ni d'autres fichiers
- Aucune modif BDD
- Aucun commit Git

---

## 🚿 Cleanup après diagnostic

Une fois Wells me renvoie les captures et qu'on identifie la cause :
1. On applique le **vrai fix** (dans un autre cycle plan → OK → apply → note)
2. **On retire les 2 logs temporaires** au passage (et cette note `plan-debug-refresh-hero.md` reste comme trace du diagnostic mais peut être supprimée si Wells préfère)

---

## 🤝 Validation attendue

J'attends ton **OK explicite** pour ajouter les 2 `console.log`. Pas une ligne de code écrite tant que tu n'as pas validé.
