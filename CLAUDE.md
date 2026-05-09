# CLAUDE.md — NeuroLingo

> Ce fichier est lu automatiquement par Claude Code au début de chaque session. Il sert à donner du contexte sur le projet pour ne pas avoir à tout réexpliquer à chaque fois.

---

## 🎯 Mission du projet

**NeuroLingo** est une application web d'apprentissage des langues conçue **spécifiquement pour les enfants neuroatypiques** (TDAH, dyslexie). C'est le cœur du projet : tout choix de design, de pédagogie, de rythme et de progression doit servir cette mission.

L'application met en scène **Neuri**, une mascotte 3D bienveillante qui guide l'enfant. Un système **parent / enfant** permet aux parents de créer les comptes de leurs enfants, suivre leur progression et gérer les paramètres.

- **URL de production** : neurolingo.vercel.app
- **Cible** : enfants neuroatypiques (mobile-first)

## 🛠️ Stack technique

- **Build tool** : Vite 8
- **Framework** : React 19 (JSX, pas TypeScript)
- **Routing** : React Router DOM 7
- **Backend / Base de données / Auth** : Supabase (`@supabase/supabase-js`)
- **3D et animations** : Three.js + React Three Fiber + Drei (mascotte Neuri)
- **Styling** : CSS classique (fichiers `.css` importés dans les composants)
- **Linter** : ESLint
- **Hébergement** : Vercel

## 🗄️ Base de données Supabase

L'application utilise 8 tables. Voici leur rôle :

### Tables principales

**`profils`** — Tous les utilisateurs (parents et enfants)
- `role` : `'parent'` ou `'child'`
- `code_enfant` : identifiant unique enfant au format `NEURI-XXXX`
- `identifiant_parent` : identifiant unique parent au format `PARENT-XXXX`
- `langue_id` : UUID référence vers `langues.id`
- + champs profil classiques (nom, prénom, âge, etc.)

**`parent_child_links`** — Liaisons parent ↔ enfant
- `parent_id` (UUID, référence profils.id)
- `child_id` (UUID, référence profils.id)
- Sécurisée par RLS (Row Level Security)

**`langues`** — Langues disponibles dans l'app
- `id` (uuid, clé primaire)
- `nom` (text) — ex : "Anglais", "Espagnol", "Portugais", "Allemand"
- `code` (text) — ex : "en", "es", "pt", "de"
- `emoji` (text) — ex : 🇬🇧 (souvent NULL pour l'instant, à compléter)
- `actif` (bool) — toutes à TRUE actuellement
- `created_at` (timestamp)
- **4 langues actives** : Anglais, Espagnol, Portugais, Allemand

### Tables d'apprentissage

- **`chapitres`** — Les chapitres regroupent les leçons
- **`lecons`** — Leçons individuelles (rattachées à un chapitre)
- **`phrases`** — Phrases utilisées dans les exercices
- **`mots`** — Vocabulaire (mots à apprendre)
- **`progression`** — Suivi de la progression de chaque enfant (leçons faites, XP, etc.)

### Comment requêter la langue d'un enfant

Pour récupérer le code/nom/emoji de la langue d'un enfant, faire un join avec `langues` :

```javascript
const { data } = await supabase
  .from('profils')
  .select('*, langues(code, nom, emoji)')
  .eq('id', enfantId)
  .single()
// Puis utiliser data.langues?.code, data.langues?.nom, data.langues?.emoji
```

## 🎨 Direction artistique

Le design est **premium** avec un univers nocturne et bienveillant. À respecter dans tout nouveau composant.

- **Fond** : `#090E1A` (bleu nuit) avec glow violet subtil
- **Cartes** : arrondies (border-radius `20-24px`), aspect "premium"
- **Mobile-first** : max-width `430px`
- **Référence visuelle** : `Stats.jsx` (hero premium déjà refait)
- **Mascotte** : utiliser `Neuri2D` (statique) ou `Neuri3D` (animé) selon le contexte

## 📂 Structure des dossiers

### `public/`
- `Neuri.glb` — Modèle 3D de la mascotte
- `neuri/` — Fichiers liés au modèle 3D
- `favicon.svg`, `icons.svg`

### `src/assets/`
- `hero.png` — Image de la page d'accueil
- `react.svg`, `vite.svg`

### `src/components/`
- `BottomNav.jsx` — Navigation mobile pour les enfants
- `BottomNavParent.jsx` — Navigation mobile pour les parents
- `Neuri2D.jsx` — Mascotte en 2D (statique)
- `Neuri3D.jsx` — Mascotte en 3D animée

### `src/pages/`

**Pages communes :**
- `Home.jsx` — Page d'accueil (avant connexion)
- `Login.jsx` — Connexion + choix Enfant / Parent
- `Onboarding.jsx` — Parcours du nouveau utilisateur
- `Pricing.jsx` — Tarifs / abonnements

**Pages enfant (apprentissage) :**
- `Dashboard.jsx` — Tableau de bord enfant
- `Learn.jsx` — Hub d'apprentissage
- `Lesson.jsx` — Affichage d'une leçon
- `LessonSentence.jsx` — Phrase au sein d'une leçon
- `SentenceExercise.jsx` — Exercice de phrase
- `TestSentence.jsx` — Test / évaluation
- `Alphabet.jsx` — Apprentissage de l'alphabet
- `Stats.jsx` (+ `Stats.css`) — Statistiques de progression
- `Shop.jsx` — Boutique (récompenses)
- `Profile.jsx` — Profil utilisateur
- `Settings.jsx` — Réglages

**Pages parent :**
- `ParentDashboard.jsx` — Tableau de bord parent
- `ParentCreateChild.jsx` — Créer un compte enfant
- `ParentLinkChild.jsx` — Lier un enfant existant (via code NEURI-XXXX)
- `ParentSettings.jsx` — Réglages parent
- `ChildrenPage.jsx` — Liste des enfants liés

### `src/utils/`
- `languages.js` — Données / helpers liés aux langues
- `neuriUtils.js` — Helpers pour la mascotte 3D

### `src/` (racine)
- `main.jsx` — Point d'entrée
- `App.jsx` (+ `App.css`) — Composant racine, routes
- `index.css` — Styles globaux
- `supabase.js` — Configuration et client Supabase
- `profileSettings.js` — Logique liée aux paramètres de profil

## 🚀 Roadmap des livraisons

### Système Parent / Enfant (4 livraisons)

- ✅ **Livraison 1/4 — Database + Auth** : colonnes `role`, codes `NEURI-XXXX` et `PARENT-XXXX`, table `parent_child_links`, RLS sécurisées, triggers de génération automatique
- ✅ **Livraison 2/4 — Onboarding** : `Login.jsx` modifié (choix Enfant/Parent), `ParentCreateChild.jsx` (parent crée le compte enfant)
- ✅ **Livraison 3/4 — Liaison** : `ParentLinkChild.jsx` (parent saisit le code `NEURI-XXXX` pour lier un enfant existant)
- 🟡 **Livraison 4/4 — Dashboard Parent** : EN COURS (≈65%)
  - Reste à faire : actions des 4 cartes du dashboard, vraies pages settings, cartes enfant cliquables, données dynamiques

### Sprints en cours sur la Livraison 4

1. **Polish & quick wins** — fix `codeLangue`, vraie langue au lieu de 🌍, gestion d'erreur Supabase
2. **Page détail enfant** — rendre les cartes enfant cliquables
3. **Carte "Progression"** — vraie page Progression
4. **Carte "Historique"** — vraie page Historique
5. **Carte "Langues"** — vraie page gestion des langues
6. **Carte "Temps"** — vraie page Temps d'apprentissage
7. **Settings (6 options)** — vraies pages des paramètres parent

## ✍️ Conventions de code

- Composants React en **fonctions** (jamais de classes)
- Noms de composants en **PascalCase** (`Dashboard`, pas `dashboard`)
- Utiliser les **hooks React** : `useState`, `useEffect`, `useContext`
- Pour les appels Supabase : utiliser `async/await` (pas de `.then()`)
- **Toujours gérer les erreurs** Supabase avec `try/catch` + message clair
- **Composants réutilisables** dans `src/components/`, **écrans complets** dans `src/pages/`
- Pour récupérer la langue : faire un join avec la table `langues` (voir section BDD)

## ⚠️ Règles importantes

- **Ne pas modifier `supabase.js`** sans prévenir : contient la connexion BDD
- **Ne jamais exposer les clés API** dans le code (et ne pas les pousser sur Git)
- **Demander avant d'installer** une nouvelle dépendance
- **Tester avec `npm run dev`** avant de considérer une tâche terminée
- **Garder les composants courts** (idéalement moins de 200 lignes)
- **Performance 3D** : éviter de re-render `Neuri3D` inutilement
- **Bien séparer** la logique parent et enfant (routes, navigations distinctes)
- **Respecter la DA** : fond `#090E1A`, glow violet, cartes arrondies, mobile-first

## 🧰 Commandes utiles

- `npm run dev` — Lance l'application en mode développement
- `npm run build` — Génère la version finale prête pour la production
- `npm run lint` — Vérifie la qualité du code

## 💬 Notes pour Claude

Je suis **débutante en développement web**. Donc, dans tes réponses :

- Explique ce que tu fais en termes simples, sans jargon inutile
- Quand tu introduis un nouveau concept (hook, pattern, syntaxe), explique-le brièvement la première fois
- Privilégie les solutions **simples et lisibles** aux solutions élégantes mais compliquées
- Si tu vas faire quelque chose de risqué (supprimer un fichier, modifier plusieurs composants, changer la structure), **préviens-moi avant** d'agir
- Quand tu modifies du code, indique clairement quel fichier tu touches et pourquoi
- Pour la 3D et Three.js, c'est un domaine que je connais peu : explique avec encore plus de pédagogie
- **Avant toute modification importante**, propose un plan en mode "dry-run" que je validerai
- N'hésite pas à demander si la structure de la BDD a évolué, plutôt que de deviner

## 🌍 Langue de communication

**Toutes les réponses doivent être en français.** Code, commentaires, messages d'erreur, explications : tout en français. Sauf cas où l'anglais est techniquement requis (noms de fonctions React standard, mots-clés JS, etc.).

## 🔐 Variables d'environnement

Le projet utilise un fichier `.env.local` à la racine pour les clés Supabase :

- `VITE_SUPABASE_URL` — URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` — clé publique anonyme

**Règles strictes :**
- Ne JAMAIS lire, afficher ou modifier le contenu de `.env.local`
- Ne JAMAIS écrire ces clés en dur dans le code
- Si une nouvelle variable d'env est nécessaire, me prévenir et m'expliquer comment l'ajouter — je le ferai moi-même
- `.env.local` est dans `.gitignore`, ne pas le retirer

## 🗄️ Modifications de la base de données

**Toute modification de la BDD Supabase nécessite mon accord explicite avant action.**

Cela inclut : créer/supprimer/renommer une table, ajouter/modifier/supprimer une colonne, modifier une politique RLS, créer un trigger, modifier un type enum.

Workflow attendu :
1. M'expliquer ce qui doit changer et pourquoi
2. Me proposer le SQL ou les étapes dans le dashboard Supabase
3. Attendre ma validation
4. Une fois que J'AI appliqué le changement côté Supabase, mettre à jour le code en conséquence

Ne jamais supposer que la structure de la BDD a changé — me demander en cas de doute.

## 🤖 Niveau d'autonomie

- **Tâches simples** (fix typo, ajustement CSS, renommage de variable, ajout d'un petit composant isolé) → tu peux y aller en mode auto-accept
- **Tâches importantes ou risquées** → mode Plan obligatoire : tu présentes ton plan d'action complet, j'approuve, puis tu exécutes

Sont considérés comme **importants/risqués** :
- Toute modification touchant plusieurs fichiers
- Refactor d'un composant existant
- Modifications dans `supabase.js`, `App.jsx`, `main.jsx`
- Ajout d'une nouvelle dépendance npm
- Changements affectant le routing
- Modifications de la logique parent/enfant ou des permissions
- Toute action qui crée ou supprime des fichiers

En cas de doute : passer en mode Plan plutôt qu'auto-accept.

## ✂️ Découpage des fichiers longs

**Quand un composant dépasse 200 lignes, le splitter automatiquement en sous-composants.**

Règles de split :
- Extraire les sous-blocs JSX cohérents en composants nommés (ex: `<HeaderCard />`, `<ProgressList />`)
- Placer les sous-composants dans `src/components/` s'ils sont réutilisables, ou dans un sous-dossier dédié à la page si ils sont spécifiques (ex: `src/pages/Dashboard/components/`)
- Les nouveaux sous-composants doivent rester courts et avoir une responsabilité unique
- Garder le fichier principal comme orchestrateur (state, effets, logique)
- Préserver le style premium et la DA (#090E1A, glow violet, cartes arrondies)

Toujours m'expliquer brièvement la nouvelle structure après un split.

## ✅ Définition de "tâche terminée"

Avant de me dire qu'une tâche est finie, vérifier dans cet ordre :

1. Le code fait bien ce qui était demandé
2. `npm run lint` passe sans nouveau warning/erreur
3. L'application se lance toujours avec `npm run dev` (pas de crash au démarrage)
4. Les imports sont propres (pas d'imports inutilisés)
5. Pas de `console.log` oubliés (sauf si demandés explicitement)
6. Le style premium (DA NeuroLingo) est respecté pour tout nouveau visuel

Si un de ces points pose problème : le signaler clairement plutôt que de prétendre que c'est fini.

## 🚫 Ce que Claude Code ne fait pas

- **Pas de commits Git** — Wells push elle-même sur GitHub
- **Pas de `git push`, `git commit`, `git add`** — laisser le contrôle de version à Wells
- **Pas de bilans de session** — Wells gère ce suivi autrement
- **Pas d'installation de dépendances** sans demander d'abord
- **Pas de modification de `.env.local`**, `package-lock.json`, `vite.config.js` sans prévenir