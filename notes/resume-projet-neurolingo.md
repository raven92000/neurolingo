# NeuroLingo — Mini résumé du projet

## 🎯 Mission

**NeuroLingo** est une application web d'apprentissage des langues conçue **spécifiquement pour les enfants neuroatypiques** (TDAH, dyslexie). Chaque choix de design, de pédagogie, de rythme et de progression est orienté vers cette mission.

L'application met en scène **Neuri**, une mascotte 3D bienveillante qui guide l'enfant. Un système **parent / enfant** permet aux parents de créer les comptes de leurs enfants, suivre leur progression et gérer les paramètres.

- **URL de production** : [neurolingo.vercel.app](https://neurolingo.vercel.app)
- **Cible** : enfants neuroatypiques
- **Approche** : mobile-first (largeur max 430px)

## 🛠️ Stack technique

| Domaine | Outil |
|---|---|
| Build | Vite 8 |
| Framework | React 19 (JSX, pas TypeScript) |
| Routing | React Router DOM 7 |
| Backend / Auth / BDD | Supabase |
| 3D | Three.js + React Three Fiber + Drei |
| Styling | CSS classique |
| Hébergement | Vercel |

## 🎨 Direction artistique

- Univers **nocturne et bienveillant**, design **premium**
- Fond `#090E1A` (bleu nuit) avec glow violet subtil
- Cartes arrondies (border-radius 20–24px)
- Mascotte **Neuri** en 2D (statique) ou 3D (animée) selon le contexte

## 🗄️ Base de données (Supabase)

8 tables principales :

- **`profils`** — utilisateurs (parents et enfants), avec `role`, `code_enfant` (`NEURI-XXXX`), `identifiant_parent` (`PARENT-XXXX`)
- **`parent_child_links`** — liaisons parent ↔ enfant (sécurisées par RLS)
- **`langues`** — 4 langues actives : Anglais, Espagnol, Portugais, Allemand
- **`chapitres`**, **`lecons`**, **`phrases`**, **`mots`** — contenu pédagogique
- **`progression`** — suivi de la progression de chaque enfant

## 👨‍👩‍👧 Système Parent / Enfant

L'application sépare clairement deux espaces :

- **Espace enfant** : Dashboard, Learn, Lesson, Stats, Shop, Profile…
- **Espace parent** : ParentDashboard, création/liaison d'un enfant, gestion des paramètres

## 🚀 État d'avancement

### Système Parent / Enfant (4 livraisons)

- ✅ **1/4 — Database + Auth** : rôles, codes uniques, liaisons, RLS, triggers
- ✅ **2/4 — Onboarding** : choix Enfant/Parent, création d'un enfant
- ✅ **3/4 — Liaison** : parent saisit le code `NEURI-XXXX`
- 🟡 **4/4 — Dashboard Parent** : en cours (~65%)

### Sprints en cours

1. Polish & quick wins (langue dynamique, gestion d'erreur)
2. Page détail enfant (cartes cliquables)
3. Vraies pages : Progression, Historique, Langues, Temps
4. Pages Settings parent (6 options)

## 📂 Structure simplifiée

```
src/
├── components/   # BottomNav, Neuri2D, Neuri3D…
├── pages/        # Pages enfant + pages parent
├── utils/        # Helpers (langues, mascotte)
├── App.jsx       # Routes
└── supabase.js   # Client Supabase
```

## 💡 Points clés

- Application **bilingue dans son code** : interface en français, contenu pédagogique multilingue
- Forte importance accordée à l'**accessibilité cognitive** (rythme, lisibilité, encouragements)
- Architecture pensée pour qu'un parent puisse **suivre et accompagner** sans complexité
