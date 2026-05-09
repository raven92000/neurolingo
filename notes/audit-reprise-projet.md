# Audit de reprise — NeuroLingo

> État des lieux du projet avant reprise du travail. Aucun fichier modifié pendant l'audit.

---

## ÉTAPE 1 — Vérifications techniques de base

### Lint (`npm run lint`)
**15 problèmes : 11 erreurs + 4 warnings** — tous **pré-existants**, rien de bloquant pour le build/dev.

Résumé par type :
- **Variables déclarées mais inutilisées** (8 erreurs) : `useState` dans `Neuri2D.jsx`, `navigate`/`setEquipes` dans `Dashboard.jsx`, `objectifMinutes` dans `Lesson.jsx`, `setEquipes` dans `Profile.jsx`, `modeFocus`/`setModeFocusSync`/`setVolumeSync`/`e` dans `Settings.jsx`.
- **Hooks React** (1 erreur + 4 warnings) : `Dashboard.jsx:223` appelle `setState` directement dans un `useEffect` (cascade renders), et plusieurs `useEffect` ont des dépendances manquantes (`Profile.jsx`, `Settings.jsx`, `Shop.jsx`).
- **React Compiler** (1 erreur) : `SentenceExercise.jsx:295` — mémorisation manuelle non préservable (mineur).

➡️ Aucun nouveau warning n'a été introduit par les sprints récents.

### Imports / fichiers manquants
✅ Tous les imports résolvent. Aucun fichier référencé manquant.

### Git
**Branche** : `main` (à jour avec `origin/main`).

**Modifications non-committées** :
- `CLAUDE.md` (modifié)
- `src/pages/ParentDashboard.jsx` (modifié — ajout du `try/catch` + `erreurStats` + 4 `console.log` de DIAGNOSTIC)
- `notes/` (untracked — dossier créé à l'instant)

**5 derniers commits** :
```
c7da68e save
3cfea98 feat(settings): cacher faux email enfant et afficher identifiant (Sprint 2E)
638b471 save
c3520aa feat(parent): livraisons 1-4 espace parent (dashboard, liaison, settings, navigation)
c77d7c7 save
```

---

## ÉTAPE 2 — État du système d'auth enfant (Sprint 2C+2D)

### [src/utils/childAuth.js](src/utils/childAuth.js) — 16 lignes

✅ **Fait et fonctionnel**
- 3 fonctions pures : `normalizeLogin`, `buildChildPassword`, `buildChildFakeEmail`.
- Le format `{login}@neurolingo.internal` est **centralisé ici** (excellente pratique : un seul endroit à modifier).
- Normalisation propre (trim, lowercase, suppression accents, regex).

🟡 Aucun TODO ni mock.
🐛 Aucun bug visible.
⚠️ Aucun risque de fuite du faux email — la fonction le construit, ne l'expose pas.

---

### [src/pages/Login.jsx](src/pages/Login.jsx) — 391 lignes

✅ **Fait et fonctionnel**
- Détection automatique enfant/parent via la présence d'un `@` dans le champ « Email ou identifiant » : `const isChildMode = !email.includes('@')` (ligne 153). Élégant.
- À la connexion enfant, le faux email est construit en interne via `buildChildFakeEmail(normalizeLogin(email))` (ligne 204) et **jamais affiché à l'écran**.
- Composant `PasswordInput` réutilisable avec œil afficher/masquer.
- Modale « mot de passe oublié » différenciée :
  - Adulte → `PopupForgotPassword` envoie un vrai email Supabase reset.
  - Enfant → `PopupForgotPasswordChild` affiche « Demande à ton parent » (cohérent avec Sprint 2E).
- Validation côté client de la confirmation de mot de passe (avec retour visuel coloré).

🟡 **Mocké / TODO** : rien d'explicite.

🐛 **Incohérences mineures**
- Mode inscription : si l'utilisateur tape un identifiant sans `@` *et* coche « Je crée un compte pour mon enfant », le `signUp` partira avec ce texte comme email — Supabase renverra une erreur. Ce n'est pas bloquant car l'inscription enfant passe normalement par `ParentCreateChild`, mais aucun garde-fou ne le signale.
- Le fichier dépasse les **200 lignes** (391) — CLAUDE.md préconise un split (les 2 modales pourraient sortir dans `src/components/`).

⚠️ **Visibilité du faux email** : ✅ aucune fuite. Le faux email n'apparaît jamais à l'écran.

---

### [src/pages/ParentCreateChild.jsx](src/pages/ParentCreateChild.jsx) — 458 lignes

✅ **Fait et fonctionnel**
- Validation complète : prénom, identifiant (regex `[a-z0-9_]{3,20}`), PIN 4 chiffres, confirmation PIN, date de naissance, âge < 18.
- Vérification d'unicité de l'identifiant avant création.
- Création du profil enfant + insertion dans `parent_child_links`.
- **Très bien : restauration de la session parent** après le `signUp` enfant (sinon le parent serait déconnecté). Voir `restoreParentSession` (ligne 81).
- Rollback du profil enfant en cas d'échec de la liaison (ligne 92).
- Écran de succès propre affichant : identifiant de connexion, code NEURI-XXXX, identifiant PARENT-XXXX.

🟡 **Mocké / TODO** : rien d'explicite.

🐛 **Bugs / fragilités**
- Le rollback supprime le profil dans la table `profils` mais **pas** l'utilisateur créé dans `auth.users` côté Supabase. En cas d'échec, un compte fantôme côté Auth pourrait rester (et bloquer une re-tentative avec le même identifiant). C'est une limitation Supabase côté client : seul le service role peut supprimer un user. À documenter, pas critique.
- Le fichier dépasse les **200 lignes** (458) — l'écran de succès (lignes 313-366) et l'écran de création (lignes 369-457) gagneraient à être deux composants séparés.

⚠️ **Visibilité du faux email** : ✅ aucune fuite. L'écran de succès affiche `identifiantLogin` (le login choisi par le parent) et **pas** le `fakeEmail`.

---

## ÉTAPE 3 — État de la Livraison 4 (Dashboard Parent)

### [src/pages/ParentDashboard.jsx](src/pages/ParentDashboard.jsx) — 309 lignes

✅ **Fait**
- Charge le parent, ses enfants liés via `parent_child_links`, sélectionne le premier enfant par défaut.
- Calcule le niveau pédagogique courant (`calculerNiveauActuel`) à partir des progressions.
- État vide propre quand aucun enfant n'est lié (CTA « créer » + « lier »).
- **Gestion d'erreur Supabase ajoutée** (modif non-committée) : `try/catch` + état `erreurStats` affiché à l'utilisateur.
- Header, carte enfant avec mascotte, grille 2x2 de stats, grille 4 fonctionnalités, conseil du jour, BottomNav.

🟡 **Mocké / hardcodé**
- Les 4 **conseils du jour** sont des phrases en dur (ligne 202-207). Pas un vrai système.
- Les 4 cartes « Fonctionnalités » (Progression, Langues, Temps, Historique) ont `cursor: 'pointer'` mais **aucun `onClick`** (lignes 284-292) — l'utilisateur croit pouvoir cliquer mais rien ne se passe.
- La **carte enfant** (en haut) n'est pas cliquable : pas de page détail enfant.

❌ **Manquant**
- Page détail enfant (cible des cartes enfant).
- Vraies pages Progression / Historique / Langues / Temps.

🐛 **Bugs visibles**
- ⚠️ **Bug majeur** : la ligne `const codeLangue = enfantActif?.langue_id ? null : null` mentionnée dans la mission **n'existe plus** dans la version actuelle. Elle a été remplacée par :
  ```js
  const nomLangue = enfantActif?.langues?.nom || 'Langue à définir'
  const drapeau = enfantActif?.langues?.emoji || '🌍'
  ```
  **MAIS** la requête Supabase qui charge les enfants (ligne 120-123) ne fait **pas** le join avec `langues` :
  ```js
  await supabase.from('profils').select('*').in('user_id', childIds)
  ```
  Il manque `'*, langues(code, nom, emoji)'`. Résultat : `enfantActif?.langues` est toujours `undefined`, donc on tombe **toujours** sur les fallbacks « Langue à définir » et 🌍. **Le bug du codeLangue a été déplacé, pas réglé.**
- Emoji 🌍 hardcodé dans la liste des fonctionnalités (ligne 197) — c'est l'icône de la carte « Langues étudiées », pas le drapeau de la langue. Acceptable, mais visuellement on a 2 fois 🌍 sur la même page (icône + fallback).
- 4 `console.log('🔍 DIAGNOSTIC ...')` à nettoyer (lignes 94, 111, 114, 124).
- Fichier > 200 lignes (309) — split recommandé.

---

### [src/pages/ChildrenPage.jsx](src/pages/ChildrenPage.jsx) — 140 lignes

✅ **Fait**
- Liste des enfants liés avec mascotte, prénom, âge, mini barre XP.
- Bouton « + » pour créer un enfant, carte « Lier un enfant existant ».
- Vérifications de rôle propres (redirection si non-parent).

🟡 **Mocké / hardcodé**
- Les cartes enfant ont `cursor: 'pointer'` mais **aucun `onClick`** (ligne 94) → trompeur.
- Même problème que `ParentDashboard` : `select('*')` sans join `langues`. Impossible d'afficher la langue par enfant.

❌ **Manquant**
- Action de clic sur une carte enfant (page détail).
- Bouton « Délier » un enfant.
- Affichage de la langue par enfant.

🐛 Aucun bug bloquant.

---

### [src/pages/ParentSettings.jsx](src/pages/ParentSettings.jsx) — 132 lignes

✅ **Fait**
- Affichage propre de l'identifiant parent (PARENT-XXXX).
- Lien fonctionnel vers `/parent-children` (gérer les enfants liés).
- Déconnexion fonctionnelle.
- Section « expérience bienveillante » bien dans la DA.

🟡 **Mocké**
- **6 sections sur 7** affichent juste `alert('Bientôt disponible')` : Profil parent, Notifications, Objectifs, Contrôle écran, Confidentialité, Aide & support.

❌ **Manquant**
- Toutes les vraies pages de settings (6 manquantes).

🐛 Aucun bug.

---

### [src/components/BottomNavParent.jsx](src/components/BottomNavParent.jsx) — 50 lignes

✅ **Fait**
- 3 onglets (Accueil, Enfants, Paramètres), tous routés correctement.
- Indicateur visuel de l'onglet actif (couleur + opacité + poids de la police).
- Bien dans la DA, court et propre.

🟡 Rien.
❌ Rien.
🐛 Rien.

✅ **Vérification routes** : les 3 routes (`/parent-dashboard`, `/parent-children`, `/parent-settings`) existent toutes dans `App.jsx`. Navigation OK.

---

## ÉTAPE 4 — Routes parent

### Routes définies dans [src/App.jsx](src/App.jsx)
| Route | Composant |
|---|---|
| `/parent-create-child` | `ParentCreateChild` |
| `/parent-link-child` | `ParentLinkChild` |
| `/parent-dashboard` | `ParentDashboard` |
| `/parent-children` | `ChildrenPage` |
| `/parent-settings` | `ParentSettings` |

✅ **Toutes les pages parent existant dans `/pages` sont routées.** Aucune page orpheline.

### Routes manquantes (mentionnées dans le roadmap CLAUDE.md mais non créées)
- ❌ Page **détail enfant** (cible des cartes enfant cliquables)
- ❌ Page **Progression** (carte du dashboard)
- ❌ Page **Historique** (carte du dashboard)
- ❌ Page **Langues** (carte du dashboard + section settings)
- ❌ Page **Temps d'apprentissage** (carte du dashboard)
- ❌ Pages settings parent : **Profil parent**, **Notifications**, **Objectifs**, **Contrôle du temps d'écran**, **Confidentialité**, **Aide & support** (6 pages)

---

## ÉTAPE 5 — Verdict global

**État global** : 🟡 **Sain mais inachevé**. Le build tourne, le lint n'a pas régressé, l'auth (parent + enfant) est solide et bien pensée. La Livraison 4 a un beau squelette mais beaucoup de cartes sont décoratives (pas de `onClick`).

**1 bug à fixer en priorité** : le join `langues` est cassé dans `ParentDashboard` (ligne 120) et `ChildrenPage` (ligne 46) → la langue de l'enfant ne s'affichera **jamais**, on aura toujours « Langue à définir » et 🌍. Le bug `codeLangue` a été déplacé, pas résolu.

**3 priorités à attaquer dans l'ordre**
1. **Fix du join `langues`** + nettoyage des 4 `console.log('🔍 DIAGNOSTIC')` dans `ParentDashboard.jsx` (les modifs sont déjà non-committées, autant les compléter avant commit).
2. **Rendre les cartes enfant et fonctionnalités cliquables** + créer les 4 vraies pages (Progression, Historique, Langues, Temps) — cœur de la promesse « Espace Parent ».
3. **Vraies pages settings** (6 pages) ou décision de descope si non-prioritaires.

**Risques / alertes**
- Le rollback dans `ParentCreateChild` laisse des comptes orphelins dans `auth.users` côté Supabase si la création échoue après le `signUp`. Pas critique, mais à documenter.
- 2 fichiers (`Login.jsx` 391 lignes, `ParentCreateChild.jsx` 458 lignes) dépassent largement le seuil de 200 lignes — split recommandé par CLAUDE.md.
- Lint dette technique stable (15 problèmes pré-existants) : à attaquer en sprint dédié, ou laisser tant qu'on développe.
- Modifs non-committées sur `ParentDashboard.jsx` : à commiter ou à compléter avant la prochaine session pour ne pas s'y perdre.
