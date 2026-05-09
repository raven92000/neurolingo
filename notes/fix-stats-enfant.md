# Fix bug `chargerStatsEnfant` — incohérence de types langue_id

**Date** : 2026-05-09
**Sprint** : Polish & quick wins (Livraison 4/4 — Dashboard Parent)
**Fichier modifié** : `src/pages/ParentDashboard.jsx` (uniquement)

---

## 🐛 Bug corrigé

`chargerStatsEnfant` plantait avec une erreur Postgres dès qu'un enfant avait un `langue_id` rempli :

- **Code** : `22P02`
- **Message** : `invalid input syntax for type uuid: "en"`
- **Symptôme visible** : bandeau rouge "Impossible de charger les stats, réessaye plus tard" dans le Dashboard Parent

### Cause

Incohérence de types entre deux tables qui partagent le nom de colonne `langue_id` :
- `profils.langue_id` est de type **TEXT** et stocke un **code** (`"en"`, `"es"`...)
- `chapitres.langue_id` est de type **UUID** et pointe vers `langues.id`

La requête `from('chapitres').eq('langue_id', enfant.langue_id)` essayait de comparer un uuid avec la chaîne `"en"` → rejet par Postgres.

(Cette incohérence avait déjà été repérée dans `notes/audit-usages-langue-id.md`.)

---

## ✏️ Diff de la fonction

### AVANT

```js
async function chargerStatsEnfant(enfant) {
  if (!enfant) {
    return
  }

  try {
    setErreurStats(null)

    if (!enfant?.langue_id) {
      setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
      return
    }

    const { data: chapitres, error: erreurChapitres } = await supabase
      .from('chapitres').select('id, numero').eq('langue_id', enfant.langue_id)
    if (erreurChapitres) throw erreurChapitres

    // ... suite inchangée
```

### APRÈS

```js
async function chargerStatsEnfant(enfant) {
  if (!enfant) {
    return
  }

  try {
    setErreurStats(null)

    if (!enfant?.langue_id) {
      setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
      return
    }

    // Résoudre le code langue (text dans profils.langue_id) en uuid (langues.id)
    const { data: langue, error: erreurLangue } = await supabase
      .from('langues')
      .select('id')
      .eq('code', enfant.langue_id)
      .maybeSingle()
    if (erreurLangue) throw erreurLangue
    if (!langue) {
      setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
      return
    }

    const { data: chapitres, error: erreurChapitres } = await supabase
      .from('chapitres').select('id, numero').eq('langue_id', langue.id)
    if (erreurChapitres) throw erreurChapitres

    // ... suite inchangée
```

### Changements précis
1. **Ajout** : 11 lignes — une requête `langues` qui résout le code en uuid via `.maybeSingle()`, avec gestion d'erreur et fallback gracieux si la langue n'existe pas en BDD.
2. **Modif** : `eq('langue_id', enfant.langue_id)` → `eq('langue_id', langue.id)` — on passe maintenant un vrai uuid à la requête `chapitres`.
3. Aucune autre modif dans le fichier.

---

## 🔑 Décisions techniques

- **`.maybeSingle()` au lieu de `.single()`** : avec `.single()`, l'absence de ligne lève une erreur Postgres (`PGRST116`), ce qui aurait fait sauter le fallback `if (!langue)` directement dans le `catch`. `.maybeSingle()` retourne `data: null` proprement → permet d'afficher les stats par défaut sans bandeau d'erreur si la langue n'est plus active en BDD.
- **`setStats` complet réutilisant la même structure que la branche du dessus** : on garde `niveau: NIVEAUX_CONFIG[0]` (sinon la lecture `stats.niveau.numero` ligne 247 casserait) et on remonte les compteurs déjà connus sur l'objet enfant plutôt que de les écraser à zéro.

---

## 🧪 Comment tester

### Test golden path (le bug initial)
1. `npm run dev`
2. Se connecter en parent avec un enfant qui a `langue_id = "en"` (ou autre code valide existant dans la table `langues`)
3. Aller sur le Dashboard Parent
4. **Attendu** :
   - Pas d'erreur dans la console JS
   - Le bandeau rouge "Impossible de charger les stats…" **N'apparaît PAS**
   - La carte enfant affiche le niveau correct (ex `Niveau 1 · Découverte`) et les stats Leçons/XP/Mots/Série remplies

### Test edge — code langue inexistant
Si tu peux temporairement (côté Supabase) mettre un `langue_id = "xx"` sur un enfant test :
- **Attendu** : pas d'erreur console, fallback propre → niveau "Découverte" + valeurs depuis le profil enfant, pas de bandeau rouge.
- **Symptôme du bon fonctionnement** : tu n'as pas l'impression qu'il y a un bug, juste un niveau de base et les stats neutres de l'enfant.

### Test edge — pas de langue du tout
Cas déjà géré avant le fix (branche existante ligne 60), confirmer qu'il marche toujours :
- Enfant avec `langue_id = NULL` → fallback identique au cas "code inexistant".

---

## ✅ Validations effectuées

- **`npm run lint`** : 0 nouveau warning sur `ParentDashboard.jsx`. Les 15 problèmes signalés sont strictement les mêmes qu'avant (Neuri2D, Dashboard, Lesson, Profile, SentenceExercise, Settings, Shop) — aucun lié à mon changement.
- **`npm run dev`** : démarrage propre, `VITE v8.0.10 ready in 83 ms`, pas d'erreur de compilation.

---

## ⚠️ Effets de bord à signaler

### 1. Une requête réseau de plus par enfant chargé
Le Dashboard Parent fait désormais une requête supplémentaire (`langues` par code) à chaque appel de `chargerStatsEnfant`. Impact négligeable (table `langues` minuscule, 4 lignes), mais à savoir.

**Optimisation possible plus tard** : cacher le mapping `code → uuid` côté JS au chargement initial du composant pour éviter le round-trip à chaque switch d'enfant. Pas critique.

### 2. Le bug existe ailleurs (à fixer dans un sprint séparé)
Le même pattern fautif existe dans :
- `src/pages/Stats.jsx:112` — `from('chapitres').eq('langue_id', p.langue_id)` où `p.langue_id` est un code text
- D'autres lignes potentiellement (cf `notes/audit-usages-langue-id.md`)

Ces fichiers **n'ont PAS été touchés** comme demandé. À traiter dans un futur sprint dédié.

### 3. Cause racine non corrigée
Le vrai problème de fond reste l'incohérence de types `profils.langue_id` (text) vs `chapitres.langue_id` (uuid). Ce fix est un **contournement applicatif** : il fait fonctionner le code mais ne règle pas la dette BDD. Une migration future pour harmoniser les types (par exemple : `profils.langue_id` devient un vrai uuid avec FK, OU `chapitres.langue_id` devient un text) éliminerait le besoin de la requête de résolution.

---

## 📌 Hors scope (rappel)

- Pas de modif dans `Stats.jsx`, `Dashboard.jsx`, `Learn.jsx`
- Pas de refacto autre dans `ParentDashboard.jsx`
- Pas de commit Git
