# Plan — Sprint 3 : Page Progression détaillée

## Objectif
Rendre fonctionnel le bouton « 📊 Voir progression détaillée » sur la page détail enfant. Créer une nouvelle page `/parent/enfant/:userId/progression` qui liste tous les chapitres de la langue de l'enfant avec barres de progression, et expand chapitre → liste des leçons avec statut.

---

## 1. Architecture des fichiers

### Fichiers créés
- **`src/pages/ParentChildProgression.jsx`** — Composant page principal (orchestrateur : fetch, state, header, liste). On s'attend à ~200 lignes max → si dépassement, split.
- **`src/pages/ParentChildProgression/ChapitreCard.jsx`** — Une carte chapitre (titre, barre, %, compteur leçons, badge ✅, expand). Sous-composant dédié à cette page → placé dans un sous-dossier.
- **`src/pages/ParentChildProgression/LeconRow.jsx`** — Une ligne leçon (titre + statut visuel ✅ / ⏳ / non commencée).

Les sous-composants vont dans `src/pages/ParentChildProgression/` (suit la convention CLAUDE.md : sous-composants spécifiques à une page = sous-dossier dédié, comme `src/pages/ChildDetail/`).

### Fichiers modifiés
- **`src/App.jsx`** — Ajout d'une route : `<Route path="/parent/enfant/:userId/progression" element={<ParentChildProgression />} />` + import.
- **`src/pages/ChildDetail/ChildDetailActions.jsx`** :
  - Retirer l'entrée `📊 Voir progression détaillée` du tableau `STUBS` (reste seulement `🌍 Ajouter une langue`).
  - Ajouter un bouton fonctionnel dédié (juste au-dessus de la liste `STUBS`, mais après le bouton « ✏️ Modifier le profil »), même style que les boutons d'action, avec `onClick` qui fait :
    ```js
    navigate(`/parent/enfant/${userId}/progression`, {
      state: { from: location.pathname }
    })
    ```
  - Ajouter `useLocation` à l'import depuis `react-router-dom`.

### Fichiers NON touchés
- `EditProfileModal`, `ConfirmUnlinkModal`, `ChildDetailHero`, `ChildDetailStats`, `ChildDetailActivity` : aucune modif.
- `Stats.jsx`, `ParentDashboard.jsx` : aucune modif (dette `langue_id` text/uuid laissée pour le sprint dédié).
- Pas de modif BDD, pas d'install npm.

---

## 2. Stratégie de fetch Supabase

Les 4 queries (toutes en lecture seule) sont **indépendantes** et peuvent être lancées en parallèle après l'auth. Je les fais séquentielles pour la première version (plus simple à lire pour Wells), avec possibilité d'optimiser plus tard.

### Étapes du `useEffect`

1. **Auth + check parent** (identique à ChildDetailPage)
   - `supabase.auth.getUser()` → si pas connecté, `navigate('/login')`.
   - Vérifier `profils.role = 'parent'` pour l'utilisateur connecté.

2. **Check lien parent-enfant** (sécurité, identique à ChildDetailPage)
   - `parent_child_links` : `parent_id = user.id AND child_id = userId`. Si pas de lien → `navigate('/parent-dashboard')`.

3. **Récupérer l'enfant + sa langue (join)**
   ```js
   const { data: enfant } = await supabase
     .from('profils')
     .select('nom, langue_id, langues(code, nom, emoji)')
     .eq('user_id', userId)
     .single()
   ```
   Utilisé pour : le titre « Progression de {prénom} » + la résolution langue.

4. **Résoudre langue text → uuid** (pattern CLAUDE.md, voir section 3)
   ```js
   const { data: langue } = await supabase
     .from('langues')
     .select('id')
     .eq('code', enfant.langue_id)
     .maybeSingle()
   ```
   Si `langue` est null (enfant sans langue) → on affiche la page avec une liste vide + message bienveillant.

5. **Récupérer les chapitres de la langue**
   ```js
   const { data: chapitres } = await supabase
     .from('chapitres')
     .select('id, numero, titre')
     .eq('langue_id', langue.id)
     .order('numero', { ascending: true })
   ```

6. **Récupérer toutes les leçons de ces chapitres**
   ```js
   const chapitresIds = chapitres.map(c => c.id)
   const { data: lecons } = await supabase
     .from('lecons')
     .select('id, titre, chapitre_id, ordre')
     .in('chapitre_id', chapitresIds)
     .order('ordre', { ascending: true })
   ```

7. **Récupérer la progression de l'enfant**
   ```js
   const { data: progressions } = await supabase
     .from('progression')
     .select('lecon_id, completee_le, partie_completee')
     .eq('user_id', userId)
   ```

8. **Calculer en mémoire** une structure prête à afficher :
   ```js
   const chapitresAvecProgression = chapitres.map(chap => {
     const leconsDuChap = lecons.filter(l => l.chapitre_id === chap.id)
     const leconsAvecStatut = leconsDuChap.map(l => ({
       ...l,
       statut: getStatut(progressions, l.id), // 'terminee' | 'en_cours' | 'non_commencee'
     }))
     const nbTotal = leconsDuChap.length
     const nbTerminees = leconsAvecStatut.filter(l => l.statut === 'terminee').length
     const pourcentage = nbTotal === 0 ? 0 : Math.round((nbTerminees / nbTotal) * 100)
     return { ...chap, lecons: leconsAvecStatut, nbTotal, nbTerminees, pourcentage }
   })
   ```

### Pourquoi pas de stockage des leçons/progressions séparément dans le state
Je stocke uniquement `chapitresAvecProgression` (déjà enrichi) dans le state. Plus simple : le rendu n'a pas à recroiser les données à chaque render.

---

## 3. Résolution de l'incohérence text/uuid sur `langue_id`

Comme documenté dans CLAUDE.md (dette technique connue) :
- `profils.langue_id` est TEXT (ex: `'en'`)
- `chapitres.langue_id` est UUID (ex: `'abc-123-...'`)

⚠️ Je note que `Stats.jsx:112` applique un filtre direct `.eq('langue_id', p.langue_id)` sur la table `chapitres` — c'est un bug latent documenté, mais **je ne le corrige pas dans ce sprint** (règle dure : pas de refacto opportuniste).

**Dans la nouvelle page**, je fais le pattern correct (text → uuid), comme documenté dans CLAUDE.md :

```js
// 1. Résoudre le code (text) en uuid via la table langues
const { data: langue } = await supabase
  .from('langues')
  .select('id')
  .eq('code', enfant.langue_id)
  .maybeSingle()

// 2. Si langue est null (enfant sans langue ou code invalide) :
//    on affiche page avec liste vide + message "Aucune langue assignée"
if (!langue) {
  setChapitresAvecProgression([])
  setChargement(false)
  return
}

// 3. Filtrer les chapitres avec l'uuid
const { data: chapitres } = await supabase
  .from('chapitres')
  .select('id, numero, titre')
  .eq('langue_id', langue.id)
  .order('numero', { ascending: true })
```

---

## 4. Déterminer terminée / en cours / non commencée

Selon le brief et la lecture du code :
- `Stats.jsx:21` utilise `partie_completee === 2` pour « complétée » (modèle stricte)
- `ChildDetailPage.jsx:65-77` se contente de regarder `completee_le` (modèle souple)

**Décision** : je suis la définition du brief :
- Pas de ligne `progression` pour la leçon → **non commencée** (gris)
- Ligne avec `completee_le NOT NULL` → **terminée** (✅)
- Ligne avec `completee_le IS NULL` (peu importe `partie_completee`) → **en cours** (⏳)

Helper :
```js
function getStatut(progressions, leconId) {
  const p = progressions.find(pr => pr.lecon_id === leconId)
  if (!p) return 'non_commencee'
  if (p.completee_le) return 'terminee'
  return 'en_cours'
}
```

**Pourquoi cette définition plutôt que `partie_completee === 2`** : le brief est explicite (« `progression.completee_le IS NOT NULL` indique que la leçon est terminée »). Cette définition est cohérente avec ChildDetailPage qui affiche déjà des activités terminées avec `completee_le`. Si on découvre un mismatch lors du test, on ajustera dans un patch ciblé.

---

## 5. Structure des composants

### `ParentChildProgression.jsx`
- **State** :
  - `enfant` (nom, langue) — pour titre + fallback
  - `chapitresAvecProgression` (array de chapitres enrichis)
  - `chargement` (bool)
  - `erreurChargement` (string | null)
- **Hooks** : `useNavigate`, `useParams`, `useLocation`
- **Rendu** :
  - Spinner pendant chargement
  - Header (bouton retour + titre)
  - Si erreur → message d'erreur
  - Si pas de langue → message bienveillant « Aucune langue assignée à {prénom} pour le moment »
  - Sinon → liste de `<ChapitreCard>` dans une `flex column gap 12px`
  - `<BottomNavParent />` en bas

### `ChapitreCard.jsx`
- **Props** : `{ chapitre }` où `chapitre = { id, numero, titre, lecons, nbTotal, nbTerminees, pourcentage }`
- **State local** : `isExpanded` (bool)
- **Rendu** :
  - Bouton/div clickable qui toggle `isExpanded`
  - Header : titre + (si 100%) badge ✅
  - Sous-titre : « X/Y leçons »
  - Barre de progression visuelle (fond + remplissage violet, comme `hero-progress__bar` de Stats.css)
  - % à droite de la barre
  - Chevron qui rotate quand expanded
  - Si `isExpanded` → liste de `<LeconRow>` (ou message « Aucune leçon dans ce chapitre » si vide)

### `LeconRow.jsx`
- **Props** : `{ lecon }` où `lecon = { id, titre, statut }`
- **Rendu** :
  - Ligne horizontale : icône (✅ vert, ⏳ orange, • gris) + titre
  - Si non commencée → couleur texte plus foncée (rgba(255,255,255,0.4))

---

## 6. Maquette textuelle de l'UI

```
┌─────────────────────────────────────┐
│  ←                                  │  ← header (padding-top 52px)
│                                     │
│  Progression de Léa                 │  ← titre h1, blanc, bold 800
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │  ← ChapitreCard (closed)
│  │ Chapitre 1 — Les salutations  │  │
│  │ 0/5 leçons                    │  │
│  │ ▓░░░░░░░░░░░░  0%          ›  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │  ← ChapitreCard (expanded)
│  │ Chapitre 2 — La famille    ✅ │  │
│  │ 3/3 leçons                    │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%         ⌃  │  │
│  │                               │  │
│  │  ✅  Mes parents              │  │  ← LeconRow
│  │  ✅  Frère et sœur            │  │
│  │  ✅  Les grands-parents       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Chapitre 3 — Les couleurs     │  │
│  │ 1/4 leçons                    │  │
│  │ ▓▓▓░░░░░░░░░  25%          ›  │  │
│  └───────────────────────────────┘  │
│                                     │
│  [...]                              │
│                                     │
├─────────────────────────────────────┤
│  [BottomNavParent]                  │
└─────────────────────────────────────┘
```

Couleurs / DA :
- Fond page : `#090E1A`
- Cartes : `rgba(255,255,255,0.04)` border `rgba(255,255,255,0.07)` radius `20px`
- Barre fond : `rgba(255,255,255,0.06)`
- Barre remplissage : gradient `#8B5CF6 → #6D28D9` (violet, comme Stats)
- ✅ chapitre 100% : badge vert `#58CC02`
- ✅ leçon terminée : `#58CC02`
- ⏳ leçon en cours : `#F59E0B`
- Non commencée : `rgba(255,255,255,0.35)`

---

## 7. Comportement du bouton retour

```js
function retour() {
  const from = location.state?.from
  navigate(from || `/parent/enfant/${userId}`)
}
```

Fallback sur la page détail enfant (cohérent avec le brief). Si l'utilisateur arrive par deeplink direct/F5, le bouton revient quand même au bon endroit.

Côté ChildDetailActions, on passe `state: { from: location.pathname }` au navigate vers la page progression — cohérent avec le pattern `post-fix-refresh-dashboard-v2`.

---

## 8. Tests visuels prévus

1. Sur `/parent/enfant/:userId`, cliquer « 📊 Voir progression détaillée » → la page s'ouvre, URL = `/parent/enfant/:userId/progression`.
2. Header : titre « Progression de Léa » + bouton ← en haut.
3. Liste des chapitres anglais avec barres à 0%, compteurs « 0/X leçons », pas de badge ✅.
4. Cliquer sur une carte chapitre → expand → liste des leçons s'affiche, toutes en « non commencée » (gris).
5. Re-cliquer sur la même carte → collapse.
6. Cliquer ← → retour sur `/parent/enfant/:userId`.
7. Console : pas d'erreur ni warning React.
8. Mobile : tout tient dans 430px de large.
9. F5 sur la page progression : pas de crash, la page reste accessible.

---

## 9. Points d'attention / risques

- **Risque 1 — Stats.jsx pattern bugué** : Stats.jsx fait `.eq('langue_id', p.langue_id)` directement. Soit `chapitres.langue_id` est en réalité TEXT (auquel cas CLAUDE.md est en retard d'une migration), soit Stats.jsx ne retourne jamais de chapitres et personne ne l'a remarqué. Je fais le pattern correct (text → uuid) ; si en test on découvre que `chapitres.langue_id` est en fait TEXT, on ajustera. **Je ne touche pas Stats.jsx dans ce sprint**.

- **Risque 2 — RLS sur `progression` côté parent** : `ChildDetailPage.jsx:64-81` enveloppe la lecture de `progression` dans un try/catch « probable RLS ». Je fais pareil : si la lecture progression échoue (RLS), j'affiche les chapitres avec 0% partout + un message console.warn. La page reste fonctionnelle (cas vide = OK selon le brief).

- **Risque 3 — Enfant sans langue (`langue_id` NULL)** : géré, j'affiche un message bienveillant et liste vide.

- **Risque 4 — Chapitre sans leçons** : possible en BDD. La carte s'affiche avec « 0/0 leçons » et 0%. Si expanded, message « Aucune leçon dans ce chapitre ».

- **Risque 5 — Taille du fichier** : si `ParentChildProgression.jsx` dépasse 200 lignes, on splitte plus loin (le split en `ChapitreCard` + `LeconRow` est déjà prévu, donc le fichier principal devrait rester court).

- **Risque 6 — Cohérence avec la définition de « terminée »** : j'utilise `completee_le NOT NULL` (selon brief) alors que Stats.jsx utilise `partie_completee === 2`. Si le test révèle un mismatch (ex: une leçon avec `completee_le` mais `partie_completee < 2` n'est en fait pas vraiment terminée), on ajustera.

---

## 10. Hors-périmètre signalé

- Pas de refacto de `Stats.jsx` malgré le bug latent identifié → sprint dédié.
- Pas d'extraction d'un util partagé `getStatutLecon` pour l'instant (utilisé uniquement dans cette page) → on extrait si un autre composant en a besoin plus tard.
- Pas de modif des autres `STUBS` de `ChildDetailActions` (seul « Voir progression détaillée » est retiré).
- Pas de modif BDD.

---

## En attente de validation
Si tu valides ce plan, j'applique dans cet ordre :
1. Créer `src/pages/ParentChildProgression/ChapitreCard.jsx` et `LeconRow.jsx`
2. Créer `src/pages/ParentChildProgression.jsx`
3. Modifier `src/App.jsx` (import + route)
4. Modifier `src/pages/ChildDetail/ChildDetailActions.jsx` (retirer du STUBS + bouton fonctionnel)
5. Lancer `npm run lint`
6. Écrire le rapport `notes/sprint-3-progression.md`
