# Plan — Fix bug `chargerStatsEnfant` (ParentDashboard.jsx)

## 🐛 Bug diagnostiqué

Quand un enfant a un `langue_id` rempli (ex: `"en"`), `chargerStatsEnfant` plante avec une erreur Postgres :

- **Code** : `22P02`
- **Message** : `invalid input syntax for type uuid: "en"`
- **Trace** : `ParentDashboard.jsx:87 → "Erreur chargement stats enfant"`
- **Requête fautive** : ligne 66
  ```js
  .from('chapitres').select('id, numero').eq('langue_id', enfant.langue_id)
  ```

### Cause

Incohérence de types côté BDD (déjà repérée dans l'audit `notes/audit-usages-langue-id.md`, point #2) :
- `profils.langue_id` est de type **TEXT** et stocke un code (`"en"`, `"es"`...)
- `chapitres.langue_id` est de type **UUID** et pointe vers `langues.id`

→ On ne peut pas comparer directement le code (text) avec une colonne uuid.

---

## 🔧 Fix prévu — Option A (résolution code → uuid via une 2e requête)

Insérer entre la ligne 63 et la ligne 65, **juste après le check "pas de langue_id"**, une nouvelle requête qui résout le code de langue en uuid réel via la table `langues`.

### Code actuel (lignes 60-67)

```js
if (!enfant?.langue_id) {
  setStats({ niveau: NIVEAUX_CONFIG[0], xp: enfant?.xp || 0, lecons: enfant?.lecons_completees || 0, mots: enfant?.mots_appris || 0, streak: enfant?.streak || 0 })
  return
}

const { data: chapitres, error: erreurChapitres } = await supabase
  .from('chapitres').select('id, numero').eq('langue_id', enfant.langue_id)
if (erreurChapitres) throw erreurChapitres
```

### Code prévu après fix

```js
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
```

### Détail des choix

#### Choix 1 — `.maybeSingle()` plutôt que `.single()`

Wells a écrit `.single()` dans son brief. Mais `.single()` lève une erreur Postgres `PGRST116` si **aucune ligne** ne correspond — donc le `if (!langue) { ...; return }` qui suit ne serait **jamais atteint** (l'erreur serait attrapée par le `catch` global et afficherait "Impossible de charger les stats…").

`.maybeSingle()` retourne `data: null` sans erreur si 0 ligne trouvée → permet le fallback propre demandé par Wells (`setStats` aux valeurs de base + return).

C'est utile pour un cas edge réel : un enfant a `langue_id = "fr"` mais `"fr"` n'existe pas dans la table `langues` actuellement (ou a été désactivé). Plutôt que d'afficher une erreur, on tombe gracieusement sur les stats par défaut.

→ **Je propose `.maybeSingle()`**. Si tu préfères `.single()` strict, dis-le et je l'utilise (mais le `if (!langue)` deviendra inutile).

#### Choix 2 — `setStats` complet plutôt que minimaliste

Wells a proposé dans son brief :
```js
setStats({ lecons: 0, xp: 0, mots: 0, streak: 0 })
```

Mais ce setStats n'inclut pas `niveau` (cassera la lecture `stats.niveau.numero` ligne 247) et écrase à zéro les XP/lecons/mots/streak alors qu'on les a déjà sur l'objet `enfant`.

→ **Je propose de réutiliser exactement le même `setStats` que la branche du dessus (ligne 61)** — comportement cohérent : si la langue n'est pas résolvable, on affiche au moins les compteurs déjà stockés sur le profil, et le niveau retombe sur "Découverte". Pas d'écrasement abusif.

#### Choix 3 — Pas de variable intermédiaire `langueUuid`

J'aurais pu extraire `const langueUuid = langue.id` pour la clarté, mais ça alourdit pour rien — `langue.id` lu une seule fois. Je garde l'inline.

---

## 📋 Modifications prévues

### Fichier : `src/pages/ParentDashboard.jsx` (un seul fichier touché)

**Une seule édition** : insertion de 11 lignes entre la ligne 63 (fin du check `if (!enfant?.langue_id)`) et la ligne 65 (requête chapitres), + remplacement de `enfant.langue_id` par `langue.id` dans la requête chapitres ligne 66.

**Aucune autre modif** dans le fichier.

---

## 🚫 Hors scope (rappel)

- Pas de modif dans `Stats.jsx`, `Dashboard.jsx`, `Learn.jsx` (qui ont le même problème potentiel mais à traiter plus tard)
- Pas de refacto dans `ParentDashboard.jsx`
- Pas d'autre fichier touché
- Pas de commit Git

---

## ✅ Validations prévues

1. **`npm run lint`** — vérifier 0 nouveau warning sur `ParentDashboard.jsx`
2. **`npm run dev`** — démarrage propre, pas de crash

### Test visuel pour Wells

1. Se connecter en parent avec un enfant qui a `langue_id = "en"` (cas qui plantait)
2. Aller sur le Dashboard Parent
3. **Avant le fix** : la console affichait l'erreur `22P02 invalid input syntax for type uuid: "en"`, et le bandeau rouge "Impossible de charger les stats…" apparaissait
4. **Après le fix** : pas d'erreur console, le niveau s'affiche correctement (ex: `Niveau 1 · Découverte`), les stats (Leçons/XP/Mots/Série) sont cohérentes
5. **Test edge** : si tu peux temporairement mettre `langue_id = "xx"` (un code inexistant) sur un enfant, tu dois voir le fallback propre (niveau Découverte + valeurs depuis le profil), sans bandeau d'erreur

---

## ❓ Questions avant exécution

1. **`.maybeSingle()` ou `.single()` ?** Mon avis : `.maybeSingle()` (cf Choix 1 ci-dessus). Si tu préfères `.single()`, le fallback `if (!langue)` sautera.
2. **`setStats` complet ou minimaliste pour le fallback "langue introuvable" ?** Mon avis : complet (cf Choix 2). Si tu préfères ton brief littéral (`{ lecons: 0, xp: 0, mots: 0, streak: 0 }`), je l'applique tel quel.

Si pas de réponse explicite, j'applique mes deux propositions par défaut.

---

## 📝 Livrable final

À la fin de l'exécution, écriture de `notes/fix-stats-enfant.md` avec :
- Avant/après de la fonction modifiée
- Comment tester (golden path + edge case)
- Effets de bord éventuels
