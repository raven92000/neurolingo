# Sprint 4 — Page Historique (calendrier mensuel)

## 🎯 Objectif

Rendre la carte "Historique semaine" du dashboard parent fonctionnelle :
cliquer dessus ouvre une nouvelle page `/parent/enfant/:userId/historique`
qui affiche un **calendrier mensuel** des leçons faites par l'enfant.

---

## ⚠️ Observations préalables (à valider avant action)

### Obs 1 — Pas de stub "Bientôt disponible" à retirer
Le brief mentionne « retirer "Bientôt disponible" sur cette entrée ».
En lisant [ParentDashboard.jsx:225-342](src/pages/ParentDashboard.jsx#L225-L342),
je n'ai trouvé **aucune mention "Bientôt disponible"** dans le code.
Les 4 cartes Fonctionnalités sont simplement **non-cliquables** (aucun `onClick`
dans le `.map` ligne 333). Donc il n'y a rien à supprimer, juste un onClick à
ajouter sur la carte Historique.

### Obs 2 — Renommer la carte
La carte s'appelle actuellement **"Historique semaine"** avec `desc =
"Détail jour par jour des activités"`. Comme on passe à un calendrier
**mensuel**, je propose de renommer :
- Titre : `Historique semaine` → `Historique`
- Desc : `Détail jour par jour des activités` → `Calendrier des leçons faites`

Si tu préfères garder le wording actuel, dis-le et j'ajusterai.

### Obs 3 — Carte Historique = pas dans BottomNavParent
J'ai vérifié, la carte Historique vit bien uniquement dans la grille
Fonctionnalités de ParentDashboard.jsx. `BottomNavParent` ne contient pas
d'entrée Historique → rien à toucher de ce côté.

---

## 🏗️ Architecture des fichiers

### Nouveaux fichiers

```
src/pages/
├── ParentChildHistorique.jsx              ← Orchestrateur (page principale)
└── ParentChildHistorique/
    ├── CalendrierMois.jsx                 ← Grille calendrier 7×~5
    └── LeconJourCard.jsx                  ← Carte d'une leçon dans la liste
```

### Fichiers modifiés

1. **[src/App.jsx](src/App.jsx)** — Ajouter la route
   ```jsx
   import ParentChildHistorique from './pages/ParentChildHistorique'
   // ...
   <Route path="/parent/enfant/:userId/historique" element={<ParentChildHistorique />} />
   ```

2. **[src/pages/ParentDashboard.jsx](src/pages/ParentDashboard.jsx)** —
   Rendre la carte Historique cliquable
   - Renommer titre + desc (cf. Obs 2)
   - Ajouter `route` à l'objet : `{ icon: '📅', titre: 'Historique', ..., route: '/historique' }`
   - Dans le `.map`, ajouter `onClick={() => f.route && navigate(...)` —
     les autres cartes restent non-cliquables tant qu'elles n'ont pas de `route`

---

## 🗄️ Stratégie de fetch Supabase

Au mount de `ParentChildHistorique.jsx`, on fait **3 vérifications + 2 fetchs** :

### Étape 1 — Auth + vérifs (pattern copié de ChildDetailPage.jsx)
```js
1. supabase.auth.getUser() → user.id (sinon /login)
2. profils.select('role').eq('user_id', user.id) → doit être 'parent'
3. parent_child_links.select('child_id')
     .eq('parent_id', user.id).eq('child_id', userId) → doit exister
```

### Étape 2 — Profil enfant (pour le prénom + created_at)
```js
const { data: enfant } = await supabase
  .from('profils')
  .select('nom, created_at')
  .eq('user_id', userId)
  .single()
```
→ `enfant.nom` pour le titre, `enfant.created_at` pour la limite de
navigation passé.

### Étape 3 — Toutes les leçons faites (avec jointure)
```js
const { data: progressions } = await supabase
  .from('progression')
  .select(`
    id,
    completee_le,
    lecons (
      titre,
      duree_minutes,
      chapitres ( titre )
    )
  `)
  .eq('user_id', userId)
  .not('completee_le', 'is', null)
  .order('completee_le', { ascending: false })
```

**Décision : on fetch toutes les progressions d'un coup**, pas par mois.
Justification :
- Une leçon faite = une ligne très légère (~100 octets avec joins)
- Un enfant fait ~1 à 5 leçons/jour, donc même sur un an = ~1500 lignes max.
  Largement supportable.
- Avantage : changement de mois = instantané (pas de refetch),
  toute la logique reste côté client.

→ on stocke `progressions` dans un state, puis on dérive par mois en mémoire.

---

## 📅 Logique du calendrier

### Quel mois affiché

State `moisAffiche` (objet `{ annee, mois }` — mois 0-indexé style JS).
Initial : `{ annee: today.getFullYear(), mois: today.getMonth() }`.

### Construire la grille (7 colonnes × ~5-6 lignes)

```js
function getJoursGrille(annee, mois) {
  // 1. Premier jour du mois (ex: 1er mai 2026)
  const premierDuMois = new Date(annee, mois, 1)

  // 2. Décalage : on veut commencer par lundi
  //    getDay() retourne 0=dimanche, 1=lundi, ..., 6=samedi
  //    on convertit pour avoir 0=lundi ... 6=dimanche
  const jourSemaine = (premierDuMois.getDay() + 6) % 7

  // 3. Date du lundi en haut à gauche de la grille
  //    (peut être un jour du mois précédent)
  const debutGrille = new Date(annee, mois, 1 - jourSemaine)

  // 4. Générer 42 cellules (6 semaines × 7 jours), on tronquera à 35
  //    si la 6e ligne est vide
  const jours = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(debutGrille)
    d.setDate(d.getDate() + i)
    jours.push({
      date: d,
      dansLeMois: d.getMonth() === mois,
      estAujourdhui: estMemeJour(d, new Date()),
    })
  }

  // 5. Si la 6e semaine est entièrement hors-mois, on coupe à 35
  const semaine6Hors = jours.slice(35).every(j => !j.dansLeMois)
  return semaine6Hors ? jours.slice(0, 35) : jours
}
```

### Compter les leçons par jour

```js
function grouperParJour(progressions) {
  const map = {}  // clé "YYYY-MM-DD" → tableau de progressions
  for (const p of progressions) {
    if (!p.completee_le) continue
    const d = new Date(p.completee_le)
    const key = formatYMD(d)
    if (!map[key]) map[key] = []
    map[key].push(p)
  }
  return map
}

function formatYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const j = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${j}`
}
```

→ Pour chaque cellule, on lit `leconsParJour[formatYMD(cellule.date)]?.length || 0`.

### Intensité de la couleur

```js
function getIntensite(nb) {
  if (nb === 0) return null
  if (nb === 1) return 'rgba(167,139,250,0.15)'  // clair
  if (nb <= 3) return 'rgba(167,139,250,0.4)'    // moyen
  if (nb <= 5) return 'rgba(167,139,250,0.7)'    // soutenu
  return 'rgba(139,92,246,1)'                    // plein (6+)
}
```

---

## 🔒 Limites de navigation

### Mois minimum (limite passé)
`moisMinimum = { annee: created_at.getFullYear(), mois: created_at.getMonth() }`
→ chevron gauche **désactivé** quand `moisAffiche === moisMinimum`.

### Mois maximum (futur)
`moisMaximum = mois actuel`
→ chevron droit **désactivé** quand `moisAffiche === moisActuel`.

### Helper de comparaison
```js
function memeMois(a, b) {
  return a.annee === b.annee && a.mois === b.mois
}
```

---

## 🎨 Maquette ASCII

```
┌──────────────────────────────────────────┐
│ ← Historique de Jean Paul                │ ← Header (52px top)
│                                          │
│ ┌────────────────────────────────────┐   │
│ │  ◀     Mai 2026     ▶              │   │ ← Navigation mois
│ ├────────────────────────────────────┤   │
│ │  L   M   M   J   V   S   D         │   │ ← En-tête jours
│ │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐        │   │
│ │ │28│ │29│ │30│ │1 │ │2 │ │3 │ │4 │  │   │ ← Semaine 1 (28-30 grisés)
│ │ └─┘ └─┘ └─┘ └░┘ └▓┘ └▒┘ └ ┘        │   │   (░ 1 leçon, ▓ 4 leçons, ▒ 2)
│ │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐        │   │
│ │ │5 │ │6 │ │7 │ │8 │ │9 │ │10│ │11│  │   │
│ │ └ ┘ └░┘ └▓┘ └█┘ └ ┘ └░┘ └░┘        │   │   (█ 6+ leçons)
│ │ ...                                │   │
│ │ ┌─┐                                │   │
│ │ │12│ ← bordure violette (aujourd'hui)│   │
│ │ └▓┘                                │   │
│ ├────────────────────────────────────┤   │
│ │ Moins  □ ▒ ▓ █  Plus              │   │ ← Légende
│ └────────────────────────────────────┘   │
│                                          │
│ Lundi 12 mai · 3 leçons                  │ ← Label jour sélectionné
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Les couleurs                       │   │
│ │ 14:23 · 5 min                      │   │ ← Carte leçon
│ │ Chapitre : Les bases               │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ Les nombres 1-10                   │   │
│ │ 14:31 · 4 min                      │   │
│ │ Chapitre : Les bases               │   │
│ └────────────────────────────────────┘   │
│ ...                                      │
└──────────────────────────────────────────┘
       [BottomNavParent]
```

### Détails visuels

- **Fond page** : `#090E1A`
- **Carte calendrier** : `rgba(255,255,255,0.04)` + border `rgba(255,255,255,0.07)` + `border-radius: 24px`
- **Cellule jour** : carrée (~40-44px), `border-radius: 10px`
- **Cellule aujourd'hui** : border `2px solid #A78BFA`
- **Cellule sélectionnée** : border `2px solid #FFFFFF` (+ glow violet en hover)
- **Cellule hors-mois** : couleur du chiffre `rgba(255,255,255,0.2)`, pas de fond
- **Carte leçon** : même style que `ChildDetailActivity` (cohérence visuelle)

---

## 🖱️ Logique du jour sélectionné

State `jourSelectionne` (string `"YYYY-MM-DD"` ou `null`).

### Sélection par défaut au mount
```js
const aujourdHuiKey = formatYMD(new Date())
if (memeMois(moisAffiche, moisActuel) && leconsParJour[aujourdHuiKey]?.length > 0) {
  setJourSelectionne(aujourdHuiKey)
}
// sinon null → pas de liste affichée
```

### Au changement de mois
On **réinitialise** `jourSelectionne` à `null` (sauf si on revient au mois
actuel et qu'aujourd'hui a des leçons → on resélectionne aujourd'hui).

### Au clic sur une cellule
- Clic sur jour **dans le mois et avec leçons** : sélectionne ce jour
- Clic sur jour **dans le mois mais sans leçons** : sélectionne quand même
  (affiche "Aucune leçon ce jour") ? OU on ignore le clic ?
  → **Choix proposé : on ignore les clics sur jours vides** (le brief dit
  « Cliquer sur un jour actif → liste »). Pas de feedback visuel particulier.
- Clic sur jour **hors-mois** : on ignore (curseur `default`)

---

## 🧩 Découpage des composants

### `ParentChildHistorique.jsx` (orchestrateur, ~150-180 lignes)
**Responsabilités :**
- Auth + check parent-enfant link
- Fetch enfant + toutes les progressions
- State : `moisAffiche`, `jourSelectionne`
- Calcule `leconsParJour` (mémo) à partir des progressions
- Header : bouton retour + titre
- Render `<CalendrierMois />` + label jour + liste de `<LeconJourCard />`

### `CalendrierMois.jsx` (~120-150 lignes)
**Props :**
```
{
  moisAffiche: { annee, mois },
  setMoisAffiche: fn,
  leconsParJour: { "YYYY-MM-DD": [...] },
  jourSelectionne: string|null,
  setJourSelectionne: fn,
  dateMin: Date (created_at),
}
```
**Responsabilités :**
- Header navigation < Mai 2026 >
- En-tête L M M J V S D
- Grille 7×5/6 (utilise `getJoursGrille`)
- Légende intensité en bas

### `LeconJourCard.jsx` (~30-50 lignes)
**Props :**
```
{
  titre: string,
  heure: string ("14:23"),
  duree: number (minutes),
  chapitre: string,
}
```
**Responsabilités :** affichage statique d'une carte leçon.

---

## 🧪 Tests visuels prévus

1. **Carte cliquable** : sur `/parent-dashboard`, cliquer "Historique" → ouvre `/parent/enfant/:userId/historique`
2. **Header** : titre "Historique de Jean Paul" + bouton ← visible et fonctionnel
3. **Calendrier** : mois actuel (Mai 2026) affiché par défaut, aujourd'hui entouré de violet
4. **Intensités** : jour avec 1/2/4/6 leçons → fond clair/moyen/soutenu/plein
5. **Jours hors-mois** : grisés, non-cliquables
6. **Clic jour actif** : sélection visible (border blanche) + liste leçons sous le calendrier
7. **Cartes leçon** : titre + heure + durée + nom du chapitre
8. **Navigation < / >** : passe au mois précédent/suivant
9. **Limite passé** : si on remonte jusqu'au mois de `created_at`, chevron gauche grisé
10. **Limite futur** : sur le mois actuel, chevron droit grisé
11. **Mois vide** : aucune cellule colorée, pas de liste sous le calendrier
12. **Bouton ←** : retour `location.state?.from` ou `/parent-dashboard`
13. **Pas d'enfant lié au parent** : redirige `/parent-dashboard`
14. **Pas connecté** : redirige `/login`
15. **`npm run lint`** : 0 warning/erreur nouveau
16. **`npm run dev`** : pas de crash, pas d'erreur console

---

## ⚠️ Points d'attention / risques

### Risque 1 — Timezone
`completee_le` est un timestamp UTC. Pour regrouper par jour, on utilise
`new Date(completee_le)` qui convertit en timezone locale du navigateur.
**OK pour Wells qui est en France** (cible : enfants français), mais à
noter : un enfant qui voyage à l'étranger verra les leçons groupées par
sa date locale actuelle, pas celle du moment où il a fait la leçon. Pas
un problème pratique pour ce sprint.

### Risque 2 — Created_at au milieu du mois
Si l'enfant a été créé le 15 mai et qu'on est en mai, on peut tout à fait
remonter jusqu'à mai (mais pas plus loin). La limite est sur le **mois**,
pas la date exacte. C'est correct.

### Risque 3 — Performance
~1500 progressions max par enfant — `groupBy` reste O(n) et largement
sub-milliseconde. RAS.

### Risque 4 — RLS
La table `progression` a déjà été lue dans `ChildDetailPage.jsx` ligne 65
sans souci → les RLS autorisent bien le parent à lire les progressions
de son enfant. Pas de problème attendu.

### Risque 5 — Heure formatée
`14:23` se construit avec `String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')`.
Format 24h, pas de souci.

### Risque 6 — Chapitre nullable
Si `lecon.chapitre_id` est NULL (improbable mais possible), le join
retourne `chapitres = null`. Fallback : `lecon.chapitres?.titre || 'Chapitre inconnu'`.

---

## 📋 Récap d'action après validation

Une fois ton OK reçu :

1. Créer `src/pages/ParentChildHistorique/CalendrierMois.jsx`
2. Créer `src/pages/ParentChildHistorique/LeconJourCard.jsx`
3. Créer `src/pages/ParentChildHistorique.jsx`
4. Modifier `src/App.jsx` (1 import + 1 route)
5. Modifier `src/pages/ParentDashboard.jsx` (rendre carte cliquable, renommer si OK)
6. `npm run lint` + `npm run dev` pour vérifier
7. Écrire `notes/sprint-4-historique.md` (rapport final)

---

## ❓ Questions pour Wells

1. **OK pour renommer** la carte « Historique semaine » → « Historique »
   (et `desc` → « Calendrier des leçons faites ») ?
2. **Clic sur un jour vide** (dans le mois mais 0 leçon) : on ignore le
   clic (proposition) ou on affiche "Aucune leçon ce jour" ?
3. Sinon, **OK pour le reste du plan** ?
