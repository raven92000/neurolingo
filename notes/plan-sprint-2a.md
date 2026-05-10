# Plan Sprint 2A — Page détail enfant (`ChildDetailPage`)

> Plan dry-run à valider par Wells avant exécution.
> Date : 2026-05-10

---

## 🎯 Mission rappelée

Créer une page **émotionnelle et rassurante** (pas de "contrôle parental") qui montre la progression d'un enfant et donne accès à quelques actions.

**Périmètre Sprint 2A** :
- Création de `src/pages/ChildDetailPage.jsx` avec 3 sections (hero, stats, actions)
- Routing via `/parent/enfant/:id`
- Cartes enfant cliquables depuis `ParentDashboard` et `ChildrenPage`

---

## 🔍 Découvertes BDD (à arbitrer par Wells avant exécution)

J'ai inspecté la table `profils`. Voici 3 points qui modifient légèrement le brief :

### 1. La colonne `profil_type` existe déjà ✅

Le brief demande de **mocker** le badge profil à `'TDAH'` avec un TODO `profil_neuro`. Mais en BDD, on a déjà :

```
profils.profil_type  text  default 'tdah'
```

→ **Proposition** : utiliser `enfant.profil_type` directement (mappé vers `'TDAH'` / `'Dyslexie'` à l'affichage), **sans mock** ni TODO. Plus propre.

**Question à Wells** : OK pour utiliser `profil_type` au lieu de mocker ?

---

### 2. La colonne `temps_total_minutes` existe (mais c'est un total, pas hebdo) 🟡

Le brief demande de **mocker** "Temps appris cette semaine" à `42 min` avec TODO. Mais en BDD on a :

```
profils.temps_total_minutes  int  default 0
```

→ **Trois options possibles** :

- **Option A** (fidèle au brief) : mocker à `42 min` avec commentaire `// MOCK: pas de tracking hebdo`. Carte = "Temps cette semaine".
- **Option B** (pragmatique) : afficher `enfant.temps_total_minutes` avec label changé en **"Temps total appris"**. Pas de mock, donnée réelle, label honnête.
- **Option C** (précis) : calculer le temps de la semaine via `progression.completee_le` (7 derniers jours) × `lecons.duree_minutes`. Plus de requêtes, plus complexe.

→ **Recommandation : Option B** (label "Temps total appris", `temps_total_minutes`). Pas de mensonge visuel, pas de mock à corriger plus tard. Si tu veux du hebdo, on fera C dans un sprint dédié.

**Question à Wells** : Option A, B ou C ?

---

### 3. `derniere_activite_at` n'existe pas dans `profils`, mais dérivable 🟡

Pour le message émotionnel ("activité dans les 7 derniers jours"), le brief mentionne `derniere_activite_at`. Cette colonne n'existe pas. Mais on peut faire :

```js
const { data } = await supabase
  .from('progression')
  .select('completee_le')
  .eq('user_id', enfant.user_id)
  .order('completee_le', { ascending: false })
  .limit(1)
  .maybeSingle()
const derniereActivite = data?.completee_le
```

→ **Proposition** : 1 requête simple en plus, on récupère la vraie dernière activité. Pas de mock.

**Question à Wells** : OK pour 1 requête supplémentaire à `progression` ?

---

## 📐 Structure proposée

Le fichier va probablement dépasser 200 lignes (3 sections riches + logique). Je propose de splitter en sous-composants dès la création (CLAUDE.md → règle des 200 lignes) :

```
src/pages/
  ChildDetailPage.jsx                              (orchestrateur, ~150 lignes)
  ChildDetail/
    ChildDetailHero.jsx                            (~110 lignes)
    ChildDetailStats.jsx                           (~70 lignes)
    ChildDetailActions.jsx                         (~140 lignes)
    genererMessageEmotionnel.js                    (fonction pure, ~30 lignes)
```

- **`ChildDetailPage.jsx`** : auth, fetch enfant + langue + progression, gestion erreurs/loading, agencement des 3 blocs.
- **`ChildDetailHero.jsx`** : Avatar Neuri2D + prénom + badge profil (TDAH/Dyslexie) + langue (drapeau) + streak 🔥 + message émotionnel.
- **`ChildDetailStats.jsx`** : Grille 2x2 simple (XP, leçons, mots, temps).
- **`ChildDetailActions.jsx`** : Bloc code NEURI-XXXX + 4 boutons stubs.
- **`genererMessageEmotionnel.js`** : fonction pure isolée (testable).

> Si tu préfères tout dans un seul fichier quitte à dépasser 200 lignes, dis-le. Je peux aussi mettre les sous-composants directement dans `src/components/` mais ils sont très spécifiques à cette page → un sous-dossier `ChildDetail/` me semble plus propre.

---

## 🧠 Logique du message émotionnel

Fonction pure dans `genererMessageEmotionnel.js`. Reçoit `{ prenom, streak, lecons_completees, derniereActivite }`, renvoie un string.

```js
export function genererMessageEmotionnel({ prenom, streak, lecons_completees, derniereActivite }) {
  // Cas 1 : streak forte
  if (streak >= 7) return `${prenom} apprend tous les jours ! 🌟`
  if (streak >= 3) return `${prenom} apprend régulièrement cette semaine ✨`

  // Cas 2 : activité récente mais streak < 3
  if (derniereActivite) {
    const joursDepuis = Math.floor((Date.now() - new Date(derniereActivite).getTime()) / 86400000)
    if (joursDepuis <= 7) return `${prenom} a fait des progrès cette semaine 💜`
    if (joursDepuis <= 30) return `${prenom} reprend doucement, c'est très bien 🌱`
  }

  // Cas 3 : tout début
  if (lecons_completees === 0) return `${prenom} est prêt(e) à découvrir une nouvelle langue ✨`

  // Cas 4 : fallback bienveillant
  return `${prenom} avance à son rythme, et c'est parfait 💜`
}
```

→ **Question à Wells** : les 5 messages te conviennent ? Tu veux en ajouter / modifier ?

---

## 🧱 Détail des 3 sections

### Section 1 — Hero émotionnel
- Background : gradient violet (cohérent avec ParentDashboard.jsx:259-267).
- Avatar Neuri2D taille 110-120px (`version` selon `neuri_version` ou `getVersionFromDate`).
- Prénom : Nunito 900, ~32px, blanc.
- Badge profil : pastille arrondie, fond violet doux, texte "TDAH" ou "Dyslexie".
- Ligne langue : `🇬🇧 Anglais` (fallback 3 niveaux : `enfant.langues.emoji` → `DRAPEAUX[code]` → `'🌍'`).
- Ligne streak : `🔥 12 jours d'apprentissage`.
- Message émotionnel en bas, taille 14-15px, opacity douce.

### Section 2 — Progression (grille 2x2)
- Style identique à ParentDashboard.jsx:296-309.
- 4 cartes :
  - 🌟 XP total → `enfant.xp`
  - 📚 Leçons → `enfant.lecons_completees`
  - 🔤 Mots appris → `enfant.mots_appris`
  - ⏱️ Temps total appris → `enfant.temps_total_minutes` (Option B recommandée)

### Section 3 — Actions parent

**Bloc Code (fonctionnel) :**
```
┌─────────────────────────────────────┐
│  CODE DE L'ENFANT                   │
│                                     │
│  ┌───────────────────┐  ┌────────┐ │
│  │   NEURI-XK4P      │  │📋 Copier│ │
│  └───────────────────┘  └────────┘ │
│                                     │
│  Léa peut se connecter avec ce code │
└─────────────────────────────────────┘
```
- Code en grand (Nunito 900, ~22px, espacement letter-spacing).
- Bouton "📋 Copier" → `navigator.clipboard.writeText(code)` + state local `copie` qui passe à `true` 2s.

**Bloc Actions (stubs avec "Bientôt disponible") :**
- ✏️ Modifier le profil
- 📊 Voir progression détaillée
- 🌍 Ajouter une langue
- 🔓 Délier l'enfant (couleur secondaire grisée)

Style stub : carte cliquable avec `onClick={() => alert('Bientôt disponible')}`, sous-titre gris discret "Bientôt disponible" pour assumer.

---

## 🔌 Intégrations (3 fichiers existants modifiés)

### 1. `src/App.jsx`
- Ajout import `ChildDetailPage`.
- Ajout route `<Route path="/parent/enfant/:id" element={<ChildDetailPage />} />`.

### 2. `src/pages/ParentDashboard.jsx` (lignes 259-287)
- La grande carte enfant en haut devient cliquable :
  - Wrapper avec `onClick={() => navigate('/parent/enfant/' + enfantActif.id)}`
  - `cursor: 'pointer'`, hover effect (`transition: 'transform 0.2s'`, `transform: 'translateY(-1px)'` au hover via `onMouseEnter`/`onMouseLeave` ou simplement `:hover` non — JS inline donc handler).
- ⚠️ Je passe `enfantActif.id` (UUID profils.id), pas `user_id`. À confirmer (voir question ci-dessous).

### 3. `src/pages/ChildrenPage.jsx` (lignes 121-152)
- Sur chaque carte enfant : `onClick={() => navigate('/parent/enfant/' + enfant.id)}`.
- `cursor: 'pointer'` est déjà là (ligne 123), juste ajouter le handler.

---

## ❓ Question routing : id ou user_id ?

L'URL `/parent/enfant/:id` peut pointer vers :
- **Option 1** : `profils.id` (PK de la table). C'est ce qu'on utilise classiquement pour identifier un profil.
- **Option 2** : `profils.user_id` (FK auth.users). Plus stable car c'est l'identité auth.

Dans le code existant (ParentDashboard, ChildrenPage), je vois que les enfants sont identifiés via `user_id` (`enfant.user_id`). Pour cohérence, je propose **Option 2 : `user_id`**.

→ **Question à Wells** : OK pour `user_id` dans l'URL ?

---

## 🧪 Comment tester (post-exécution)

1. `npm run dev` → application démarre sans crash.
2. Se connecter en parent.
3. Sur `ParentDashboard`, cliquer sur la grande carte enfant en haut → arrive sur `/parent/enfant/:id`.
4. Vérifier le hero : avatar Neuri, prénom, badge TDAH/Dyslexie, langue avec drapeau, streak, message émotionnel.
5. Vérifier les 4 cartes stats (XP, leçons, mots, temps).
6. Cliquer sur "📋 Copier" → badge "Copié !" qui apparaît 2s.
7. Cliquer sur les 4 boutons stubs → alert "Bientôt disponible".
8. Aller sur `/parent-children` (Mes enfants), cliquer sur une carte enfant → même page, données du bon enfant.
9. `npm run lint` → 0 nouveau warning.

---

## ⚠️ Risques / effets de bord

- **Aucun changement BDD** : pas de migration, pas de RLS modifiée.
- **3 fichiers modifiés** : App.jsx (1 import + 1 route), ParentDashboard.jsx (un onClick + cursor), ChildrenPage.jsx (un onClick).
- **Nouvelle requête à `progression`** : très légère (1 ligne max, ordre desc + limit 1). Si Option C choisie pour temps hebdo, plus lourd.
- **RLS sur `progression`** : à vérifier que le parent peut bien lire la progression de son enfant lié. Si pas de policy permissive, on aura un tableau vide → `derniereActivite` à null → tombera sur le fallback du message émotionnel. Dégradé gracieux.
- **Cas où l'enfant n'existe pas / pas lié au parent connecté** : redirection vers `/parent-dashboard` avec console.warn (sécurité minimale).
- **Pas de modif Git, pas de commit** (Wells push).

---

## ✅ Récapitulatif des questions à Wells

1. **profil_type** : utiliser la vraie colonne `profils.profil_type` au lieu de mocker à `'TDAH'` ?
2. **Temps appris** : Option A (mock 42 min), B (temps_total_minutes recommandée), ou C (calcul hebdo) ?
3. **Dernière activité** : OK pour 1 requête en plus à `progression` pour récupérer la vraie date ?
4. **Messages émotionnels** : les 5 cas + fallback proposés conviennent ?
5. **Routing** : `/parent/enfant/:id` reçoit `profils.user_id` (recommandé) ou `profils.id` ?
6. **Split en sous-composants** : OK pour `src/pages/ChildDetail/` avec 3 sous-composants + 1 fonction pure ?

Une fois ces 6 points tranchés, j'exécute en une passe et je livre `notes/sprint-2a-page-detail-enfant.md`.
