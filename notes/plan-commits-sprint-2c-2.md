# Plan — Stratégie de commits post-Sprint 2C-2

> **Statut** : 📋 En attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Plan d'organisation Git (aucun `git add` ni `git commit` exécuté avant validation)

---

## 🔍 Découverte importante

Le **dernier commit `e9757f2 "save"`** contient déjà BEAUCOUP :

```
e9757f2 save
  notes/debug-refresh-hero.md                     (nouveau)
  notes/fix-couleur-badge-profil.md               (nouveau)
  notes/fix-refresh-hero.md                       (nouveau)
  notes/plan-debug-refresh-hero.md                (nouveau)
  notes/plan-fix-refresh-hero.md                  (nouveau)
  notes/plan-sprint-2c-1.md                       (nouveau)
  notes/plan-sprint-2c-2.md                       (nouveau)
  notes/sprint-2c-1-delier-enfant.md              (nouveau)
  notes/sprint-2c-2-modifier-profil.md            (nouveau)
  src/pages/ChildDetail/ChildDetailActions.jsx    (modifié)
  src/pages/ChildDetail/ChildDetailHero.jsx       (modifié)
  src/pages/ChildDetail/ConfirmDiscardChanges.jsx (nouveau)
  src/pages/ChildDetail/ConfirmUnlinkModal.jsx    (nouveau)
  src/pages/ChildDetail/EditProfileForm.jsx       (nouveau)
  src/pages/ChildDetail/EditProfileModal.jsx      (nouveau)
  src/pages/ChildDetail/editProfileOptions.js     (nouveau)
  src/pages/ChildDetailPage.jsx                   (modifié — inclut debug logs et fix v1 key={refreshKey})
  src/pages/ChildrenPage.jsx                      (modifié — toast Sprint 2C-1)
```

**Donc le "Commit 1" de ta proposition** (Sprint 2C-2 complet + composants + fix couleur badge) **est DÉJÀ FAIT**, sous le nom générique `"save"`. Il est même déjà **poussé sur `origin/main`** (`Your branch is up to date with 'origin/main'`).

⚠️ **Conséquence** : impossible de renommer ce commit "save" sans `git push --force`, ce que tu m'as interdit. Le message restera "save" — tant pis.

---

## 📦 Ce qui RESTE à commiter (working tree non staged)

### 🔧 Code (6 fichiers modifiés)

```
modified:   src/pages/ChildDetail/ChildDetailActions.jsx    (1 hunk : fix prénom)
modified:   src/pages/ChildDetail/ChildDetailHero.jsx       (1 hunk : fix prénom)
modified:   src/pages/ChildDetail/EditProfileModal.jsx      (1 hunk : fix prénom)
modified:   src/pages/ChildDetailPage.jsx                   (4 hunks : retrait logs + fix v2 retour + fix prénom)
modified:   src/pages/ChildrenPage.jsx                      (3 hunks : fix v1 location.key + fix v2 state.from + fix prénom)
modified:   src/pages/ParentDashboard.jsx                   (3 hunks : fix v1 + v2 + fix prénom)
```

### 📝 Notes (6 nouvelles)

```
notes/plan-fix-refresh-dashboard.md
notes/fix-refresh-dashboard.md
notes/plan-fix-refresh-dashboard-v2.md
notes/fix-refresh-dashboard-v2.md
notes/plan-fix-prenom-tronque.md
notes/fix-prenom-tronque.md
```

### 🗄️ Migration RLS UPDATE Supabase
**Hors-repo** (Wells l'a appliquée directement via Supabase MCP). Pas d'artefact à commiter côté Vite.

---

## ⚖️ Deux stratégies possibles

### Option A — **1 commit unique** (recommandé, simple)

Comme le Sprint 2C-2 est déjà commité dans "save", il ne reste qu'**un groupe logique de fixes UX/data** déclenchés par les tests post-Sprint 2C-2. Un seul commit suffit, avec un message qui détaille les 3 sujets.

**Avantages** :
- Simple à exécuter (`git add .` puis `git commit`)
- Pas besoin de staging sélectif (`git add -p`) qui est délicat pour un·e débutant·e
- Historiquement cohérent : "tous les fixes post-Sprint 2C-2 en 1 fois"

**Inconvénient** :
- Moins granulaire si on veut un jour revert juste un des 3 sujets

### Option B — **2 commits via `git add -p`** (plus granulaire, plus complexe)

Séparer en 2 commits via staging sélectif des hunks :
- B1 : fix refresh dashboard (v1 + v2) + cleanup logs
- B2 : fix prénom tronqué

**Avantages** :
- Granularité historique (chaque fix isolé)

**Inconvénients** :
- `git add -p` est délicat (il faut savoir lire les hunks et choisir y/n)
- Risque d'erreur de staging (oublier un hunk, en inclure un de trop)
- Les 3 fichiers `ChildDetailPage.jsx`, `ChildrenPage.jsx`, `ParentDashboard.jsx` contiennent des hunks mélangés des 2 sujets → tri manuel nécessaire

---

## ✅ Recommandation : Option A (1 commit unique)

**Pourquoi** :
- Tu es débutante en Git
- Les 3 sujets (refresh v1, refresh v2, prénom tronqué) sont tous des **bugfixes UX post-Sprint 2C-2** qui se sont enchaînés naturellement
- Le commit `"save"` ayant déjà tout regroupé pour Sprint 2C-2, garder un seul commit "suite" reste cohérent avec ton historique

### Message de commit proposé (Option A)

```
fix(parent): suite UX post-Sprint 2C-2

- refresh des données enfants après édition profil (location.key
  dans les deps + state.from posé par dashboard/liste pour navigate
  avec nouvelle key au retour)
- prénom enfant complet (retrait du .split(' ')[0] sur 8 endroits ;
  les prénoms composés comme "Jean Paul" ne sont plus tronqués)
- retrait des 2 console.log temporaires de debug dans ChildDetailPage

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

(le `Co-Authored-By` est ajouté par défaut par Claude Code lors d'un commit que je ferais — Wells peut le retirer si elle préfère, c'est juste informationnel)

### Commandes à exécuter (Option A)

```bash
git add src/pages/ChildDetail/ChildDetailActions.jsx \
        src/pages/ChildDetail/ChildDetailHero.jsx \
        src/pages/ChildDetail/EditProfileModal.jsx \
        src/pages/ChildDetailPage.jsx \
        src/pages/ChildrenPage.jsx \
        src/pages/ParentDashboard.jsx \
        notes/plan-fix-refresh-dashboard.md \
        notes/fix-refresh-dashboard.md \
        notes/plan-fix-refresh-dashboard-v2.md \
        notes/fix-refresh-dashboard-v2.md \
        notes/plan-fix-prenom-tronque.md \
        notes/fix-prenom-tronque.md

git commit -m "$(cat <<'EOF'
fix(parent): suite UX post-Sprint 2C-2

- refresh des données enfants après édition profil (location.key
  dans les deps + state.from posé par dashboard/liste pour navigate
  avec nouvelle key au retour)
- prénom enfant complet (retrait du .split(' ')[0] sur 8 endroits ;
  les prénoms composés comme "Jean Paul" ne sont plus tronqués)
- retrait des 2 console.log temporaires de debug dans ChildDetailPage
EOF
)"
```

⚠️ **Pas inclus** dans cette commande : `notes/plan-commits-sprint-2c-2.md` (cette note même). Tu peux soit l'ajouter (recommandé pour traçabilité) soit la garder hors commit (si tu juges qu'elle n'a pas vocation à rester).

---

## 🔄 Alternative : Option B (2 commits via `git add -p`)

Pour info, voici comment ça se passerait si tu veux la granularité.

### Commit B1 — fix refresh dashboard + cleanup logs

**Fichiers** :
- `src/pages/ChildDetailPage.jsx` (hunks : retrait logs + import useLocation + déclaration location + fonction retour + 2 boutons branchés sur retour — MAIS PAS le hunk `prenom: enfant.nom` ni le hunk `prenom={enfant.nom}`)
- `src/pages/ChildrenPage.jsx` (hunks : location.key dans deps + state.from au navigate — MAIS PAS le hunk `{enfant.nom}`)
- `src/pages/ParentDashboard.jsx` (hunks : import useLocation + déclaration + location.key dans deps + state.from — MAIS PAS les 2 hunks `enfantActif?.nom`)
- 4 notes : `plan-fix-refresh-dashboard.md`, `fix-refresh-dashboard.md`, `plan-fix-refresh-dashboard-v2.md`, `fix-refresh-dashboard-v2.md`

**Procédure** :
```bash
git add -p src/pages/ChildDetailPage.jsx src/pages/ChildrenPage.jsx src/pages/ParentDashboard.jsx
# Pour chaque hunk : 'y' (sujet refresh) ou 'n' (sujet prénom)
git add notes/plan-fix-refresh-dashboard*.md notes/fix-refresh-dashboard*.md
git commit -m "fix(parent): refresh des données enfants après édition profil

- location.key dans les deps des useEffect (ParentDashboard, ChildrenPage)
- state.from posé par dashboard/liste lu par ChildDetailPage au bouton retour
- retrait des 2 console.log temporaires utilisés pour diagnostiquer"
```

### Commit B2 — fix prénom tronqué

**Fichiers** :
- Les 6 fichiers code (hunks restants après B1)
- 2 notes : `plan-fix-prenom-tronque.md`, `fix-prenom-tronque.md`

**Procédure** :
```bash
git add src/pages/ChildDetail/ChildDetailActions.jsx \
        src/pages/ChildDetail/ChildDetailHero.jsx \
        src/pages/ChildDetail/EditProfileModal.jsx \
        src/pages/ChildDetailPage.jsx \
        src/pages/ChildrenPage.jsx \
        src/pages/ParentDashboard.jsx \
        notes/plan-fix-prenom-tronque.md \
        notes/fix-prenom-tronque.md
git commit -m "fix(ui): affiche le prénom enfant complet (avec espace si composé)

Les prénoms enfants étaient tronqués au premier espace via .split(' ')[0]
dans 8 endroits différents. Le champ profils.nom stocke un prénom
(potentiellement composé comme \"Jean Paul\"), pas \"Prénom Nom\".
Retrait du split sur tous les usages enfants. Le split sur parent.nom
(Bonjour [prénom parent]) reste volontairement intact."
```

⚠️ **Risque de B** : git add -p sur 3 fichiers avec hunks mélangés demande de savoir choisir les bons. Si tu te trompes, on peut récupérer avec `git reset` mais c'est stressant.

---

## 🎯 Ma reco finale

**Option A** : simple, propre, en phase avec ton historique récent qui groupe déjà des sujets via le commit "save". Tu commits une fois et c'est plié.

Si tu veux Option B (granulaire), je t'accompagne pas à pas pour le `git add -p`.

---

## ✅ Validations effectuées avant ce plan

- ✅ 2 `console.log` temporaires retirés de `ChildDetailPage.jsx` (grep confirme : plus aucun `[debug]`, `LOG TEMPORAIRE`, ou `🔬`)
- ✅ `npm run lint` : 15 problèmes total = baseline pré-fix. Aucune nouvelle erreur.

---

## 🤝 Validation attendue

Choisis :
- ✅ **A** : 1 commit unique avec le message proposé → je te donne les commandes prêtes-à-coller et tu commits toi-même.
- ✅ **B** : 2 commits via git add -p → je t'accompagne pas à pas en t'expliquant les hunks à accepter.

Dans les deux cas : **tu fais le `git add` et le `git commit` toi-même**. Je ne fais pas de commit automatique.

Une fois la stratégie validée et les commits faits par toi, on aura nettoyé tout l'historique de cette série post-Sprint 2C-2.
