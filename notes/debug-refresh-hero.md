# Debug — Logs temporaires pour refresh Hero

> **Statut** : ✅ Logs appliqués, en attente du diagnostic de Wells
> **Date** : 2026-05-12
> **Type** : Diagnostic temporaire (logs à retirer après)
> **Plan d'origine** : [plan-debug-refresh-hero.md](plan-debug-refresh-hero.md)

---

## 🎯 But

Identifier où ça casse parmi les 4 étapes du refetch dans `charger()` de [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx), suite au constat que le fix `key={refreshKey}` n'a pas suffi à corriger le bug du Hero qui affiche l'ancien prénom après édition.

---

## ✏️ Diff appliqué

Fichier : [src/pages/ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) — 2 lignes ajoutées (logs)

### Log 1 — début de `charger()` (entre lignes 24 et 25)
```diff
   useEffect(() => {
     async function charger() {
       try {
+        console.log('[debug] charger() lancé, refreshKey =', refreshKey, 'userId =', userId)  // 🔬 LOG TEMPORAIRE — à retirer après diagnostic
         setErreurChargement(null)
```

### Log 2 — juste avant `setEnfant(profilEnfant)` (entre lignes 59 et 60)
```diff
         if (erreurEnfant) throw erreurEnfant
+        console.log('[debug] profil enfant reçu :', { nom: profilEnfant?.nom, profil_type: profilEnfant?.profil_type, user_id: profilEnfant?.user_id })  // 🔬 LOG TEMPORAIRE — à retirer après diagnostic
         setEnfant(profilEnfant)
```

**Aucune autre modif.** Pas de logique changée, pas de modif de `ChildDetailHero.jsx`, pas de modif BDD. Les marqueurs `// 🔬 LOG TEMPORAIRE — à retirer après diagnostic` permettent de retrouver facilement ces 2 lignes pour les retirer après le diagnostic.

---

## ✅ Validations effectuées

- ✅ `npm run lint` : **15 problèmes total** (11 erreurs + 4 warnings) — identique au baseline. **Aucun nouveau warning** sur les `console.log` (pas de règle `no-console` active dans la config ESLint du projet).
- ✅ Périmètre respecté : un seul fichier touché (`ChildDetailPage.jsx`).

---

## 🧪 Procédure de reproduction (à faire par Wells)

1. Lancer le dev server : `npm run dev`
2. Ouvrir le navigateur sur l'URL indiquée par Vite
3. **Ouvrir la console DevTools** : F12 → onglet "Console"
4. **Vider la console** (icône poubelle) pour un écran propre
5. **Filtrer par `[debug]`** dans la barre de recherche de la console (utile si beaucoup d'autres logs Vite/Three.js)
6. Se connecter en parent
7. Naviguer vers `/parent/enfant/:userId` d'un enfant testable
8. **Observer la console au mount initial** : tu devrais voir
   - `[debug] charger() lancé, refreshKey = 0 userId = '...'`
   - `[debug] profil enfant reçu : { nom: '...', profil_type: '...', user_id: '...' }`
9. Cliquer "Modifier le profil" → changer le prénom (ex: "Léa" → "Léa Test")
10. Cliquer Enregistrer
11. **Observer la console immédiatement après le save** :

### 3 scénarios possibles

| Scénario | Ce que tu vois | Cause identifiée |
|----------|----------------|------------------|
| **S1** | Log 1 (`refreshKey = 1`) + Log 2 avec **`nom: "Léa Test"`** (nouveau) | Cas surprenant : le SELECT renvoie bien le nouveau profil, mais le Hero affiche l'ancien malgré la `key`. À investiguer côté React/render. |
| **S2** | Log 1 (`refreshKey = 1`) + Log 2 avec **`nom: "Léa"`** (ancien) | **Cause C** : cache Supabase ou lag de propagation. Le SELECT retourne l'ancien. Workaround : forcer un cache-busting ou utiliser optimistic update. |
| **S3** | Log 1 (`refreshKey = 1`), **PAS de Log 2**, mais un `console.error` rouge "Erreur chargement Détail enfant" | **Cause A** confirmée : une étape du refetch (auth/role/lien) a échoué silencieusement. Le détail de l'erreur Supabase précisera laquelle. |

---

## 📸 Ce que je te demande de m'envoyer

Une **capture d'écran de la console** (ou le copier-coller du texte de la console) montrant **tout ce qui apparaît entre le clic Enregistrer et le bug observé**. Idéalement :

1. État de la console **avant** le save (juste les logs du mount initial)
2. État de la console **après** le save (logs ajoutés par le re-déclenchement)

Si tu vois un `console.error` rouge, **développe-le en cliquant sur la flèche** pour voir l'objet d'erreur Supabase complet (avec `code`, `message`, `details`, `hint`), et capture aussi ça.

---

## 🚿 Cleanup prévu

Une fois le diagnostic posé et le vrai fix appliqué (dans un autre cycle plan → OK → apply → note), je **retirerai les 2 logs** en cherchant le texte `🔬 LOG TEMPORAIRE` dans le fichier. Cette note `debug-refresh-hero.md` reste comme trace du diagnostic.

---

## 📝 Notes pour le commit

⚠️ **Important** : **ne PAS commiter cet état** ! Les `console.log` ne doivent pas finir en prod. Soit tu attends d'avoir le diagnostic + le vrai fix + le cleanup des logs avant de commiter, soit tu commits sans inclure `ChildDetailPage.jsx` dans le commit (puis tu commits le tout après diagnostic).

Fichiers de note à inclure dans un futur commit "fix complet" :
```
notes/plan-debug-refresh-hero.md
notes/debug-refresh-hero.md
```

(Et éventuellement la prochaine paire de notes plan-fix-XXX / fix-XXX une fois le vrai fix appliqué.)
