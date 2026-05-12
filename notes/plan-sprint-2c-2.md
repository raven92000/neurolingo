# Plan — Sprint 2C-2 : Modifier le profil enfant

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-11
> **Périmètre** : 1 fichier créé · 2 fichiers modifiés · 0 modif BDD · 0 nouvelle dépendance

---

## 🎯 Objectif

Rendre fonctionnel le bouton stub **"✏️ Modifier le profil"** de [ChildDetailActions.jsx](../src/pages/ChildDetail/ChildDetailActions.jsx). Le parent doit pouvoir éditer 4 champs du profil de son enfant depuis une modale, avec :
- pré-remplissage avec les valeurs actuelles
- validation côté client avant l'UPDATE Supabase
- confirmation si modifs non sauvées au moment de fermer
- toast vert sur `ChildDetailPage` après sauvegarde réussie
- rechargement automatique des données enfant après save

### Champs éditables

| Champ BDD | Label UI | Validation |
|-----------|----------|------------|
| `nom` | Prénom | Non vide après trim |
| `date_naissance` | Date de naissance | Date valide, pas dans le futur, enfant doit rester < 18 ans à la date du jour |
| `profil_type` | Profil cognitif | `'tdah'` ou `'dyslexie'` (liste canonique de l'app) |
| `neuri_version` | Version de Neuri | `'enfant'`, `'ado'`, `'adulte'`, `'mature'` |

---

## 🔍 Audit préalable

### `profil_type` — liste canonique trouvée
- [ParentCreateChild.jsx:247](../src/pages/ParentCreateChild.jsx#L247) **force `'tdah'` en dur** à la création (pas de sélecteur dans le formulaire de création).
- [profileSettings.js:4](../src/profileSettings.js#L4) définit 2 profils : `tdah` et `dyslexie`.
- [Profile.jsx:131-133](../src/pages/Profile.jsx#L131-L133) expose ces 2 mêmes profils dans un sélecteur (cartes-radio violet/bleu avec descriptions).
- [ChildDetailHero.jsx:7-10](../src/pages/ChildDetail/ChildDetailHero.jsx#L7-L10) utilise `LIBELLE_PROFIL = { tdah: 'TDAH', dyslexie: 'Dyslexie' }`.

**→ Décision** : reprendre les 2 mêmes cartes-radio que `Profile.jsx` (style + couleurs + descriptions identiques). Pas de 3ᵉ option inventée.

❓ **Point ouvert (à valider par Wells)** : OK uniquement `tdah` + `dyslexie` ? Sinon préciser le 3ᵉ profil souhaité.

### `calculateAgeYears` — fonction existante
[ParentCreateChild.jsx:54-68](../src/pages/ParentCreateChild.jsx#L54-L68) contient déjà la logique correcte. Comme `ParentCreateChild.jsx` est hors-périmètre (interdit de toucher), la fonction sera **dupliquée** dans `EditProfileModal.jsx` (~15 lignes). Dette mineure assumée.

### Toast réutilisable — aucun trouvé
`src/components/` ne contient aucun composant Toast. Les toasts existants (Sprint 2C-1 sur `ChildrenPage`, `Settings.jsx`) sont inline. **→ Décision** : toast inline dans `ChildDetailPage`, **même style que Sprint 2C-1** (vert doux `#86EFAC` sur fond `rgba(34,197,94,0.12)`) pour la cohérence visuelle.

---

## 📁 Fichiers concernés

### 🆕 Créé
- **`src/pages/ChildDetail/EditProfileModal.jsx`** — modale d'édition autonome (~230 lignes estimées, split en `EditProfileForm.jsx` si dépasse 250 lignes franchement)

### ✏️ Modifiés
- **`src/pages/ChildDetail/ChildDetailActions.jsx`** — ouvre la modale + reçoit `onProfileUpdated` du parent
- **`src/pages/ChildDetailPage.jsx`** — refresh + toast après save

### 🚫 NON touchés
- `ParentCreateChild.jsx`, `Profile.jsx`, `Settings.jsx`, `profileSettings.js`, `ChildDetailHero.jsx`, `ConfirmUnlinkModal.jsx`, `ChildrenPage.jsx`
- Aucune modif BDD (la table `profils` a déjà toutes les colonnes nécessaires)
- Aucune nouvelle dépendance npm

---

## 🧩 Structure de `EditProfileModal.jsx`

### Props
```js
{
  isOpen: boolean,
  onClose: () => void,
  enfant: object,         // profil enfant complet (avec user_id, nom, date_naissance, profil_type, neuri_version)
  onSuccess: () => void,  // callback après UPDATE réussi
}
```

### States internes
| State | Rôle |
|-------|------|
| `valeursInitiales` | Snapshot au montage, jamais modifié. Sert à détecter les modifs. |
| `prenom`, `dateNaissance`, `profilType`, `neuriVersion` | Les 4 champs éditables |
| `erreurs` | `{ prenom?, dateNaissance?, profilType?, neuriVersion?, global? }` — erreurs par champ |
| `confirmFermeture` | Si `true`, affiche l'overlay de confirmation "modifs non enregistrées" |
| `enregistrement` | Loading state du bouton Enregistrer |

### Constantes locales
```js
const PROFIL_OPTIONS = [
  { id: 'tdah', label: 'TDAH', desc: 'Rapide · Visuel · Stimulant', color: '#8B5CF6', colorBg: 'rgba(139,92,246,0.15)', colorBorder: 'rgba(139,92,246,0.5)' },
  { id: 'dyslexie', label: 'Dyslexie', desc: 'Lent · Lisible · Simple', color: '#3B82F6', colorBg: 'rgba(59,130,246,0.15)', colorBorder: 'rgba(59,130,246,0.5)' },
]
const NEURI_OPTIONS = [
  { id: 'enfant', label: 'Enfant' },
  { id: 'ado', label: 'Ado' },
  { id: 'adulte', label: 'Adulte' },
  { id: 'mature', label: 'Mature' },
]
const PROFIL_IDS = PROFIL_OPTIONS.map(p => p.id)
const NEURI_IDS = NEURI_OPTIONS.map(n => n.id)
```

### Logique
- `useEffect(() => { ... }, [isOpen])` : à l'ouverture, reset les 4 states aux valeurs de `enfant`, snapshot dans `valeursInitiales`, vide les erreurs, ferme confirmFermeture
- `aDesModifsNonSauvees()` : compare `{ prenom.trim(), dateNaissance, profilType, neuriVersion }` vs `valeursInitiales`
- `handleClose()` : si `!aDesModifsNonSauvees()` → `onClose()` direct ; sinon `setConfirmFermeture(true)`
- `quitterSansEnregistrer()` : `onClose()` (utilisé par le bouton "Quitter sans enregistrer")
- `validerEtSauvegarder()` :
  1. Validation client (4 règles ci-dessous → `setErreurs` + return si erreur)
  2. `setEnregistrement(true)`
  3. `supabase.from('profils').update({ nom: prenom.trim(), date_naissance: dateNaissance, profil_type: profilType, neuri_version: neuriVersion }).eq('user_id', enfant.user_id)`
  4. Erreur Supabase → `setErreurs({ global: 'Erreur lors de la sauvegarde, réessayez.' })`
  5. Succès → `onSuccess()` (côté parent : ferme modale + refresh + toast)
  6. `setEnregistrement(false)` (finally)

### Règles de validation
| Champ | Règle | Message |
|-------|-------|---------|
| `prenom` | `prenom.trim().length > 0` | "Le prénom est obligatoire." |
| `dateNaissance` | parseable, pas dans le futur, `calculateAgeYears(dateNaissance) < 18` | "Date invalide." / "La date de naissance ne peut pas être dans le futur." / "L'enfant doit avoir moins de 18 ans." |
| `profilType` | `PROFIL_IDS.includes(profilType)` | "Profil cognitif invalide." (ne devrait jamais arriver via UI) |
| `neuriVersion` | `NEURI_IDS.includes(neuriVersion)` | "Version de Neuri invalide." (idem) |

### Layout (mobile-first, DA cohérente)
- Overlay `rgba(0,0,0,0.6)` plein écran, clic dehors → `handleClose` (donc déclenche la confirmation si modifs)
- Carte centrée max-width 400px, fond `#0F1424`, bordure violette discrète `rgba(139,92,246,0.25)`, border-radius 24px, glow violet `0 0 40px rgba(124,58,237,0.25)`
- Header : titre "Modifier le profil de {prénom}" (Nunito 800/20px) + croix de fermeture top-right
- Form scrollable (`maxHeight: 80vh`, `overflowY: auto`), padding 24px
- 4 champs avec label uppercase 11px violet + input/sélecteur + erreur en dessous (rouge `#FCA5A5` discret)
- Inputs : style aligné sur `ParentCreateChild.jsx:303-310` (52px hauteur, fond `rgba(255,255,255,0.06)`, bordure subtile, border-radius 14px)
- Sélecteurs `profilType` / `neuriVersion` : grille de cartes-radio (2 cols pour profil, 2 cols pour Neuri)
- Bouton "Enregistrer" pleine largeur, gradient violet `linear-gradient(135deg, #7C3AED, #6D28D9)`, glow, `disabled` si pas de modif OU en cours d'enregistrement
- Si `confirmFermeture` : overlay interne dans la carte avec titre "Vous avez des modifications non enregistrées. Quitter quand même ?" + 2 boutons "Annuler" (violet plein) / "Quitter sans enregistrer" (bordure rouge discrète)

---

## 🔧 Diff sommaire — `ChildDetailActions.jsx`

```diff
+ import EditProfileModal from './EditProfileModal'

- const STUBS = [
-   { icon: '✏️', label: 'Modifier le profil' },
-   { icon: '📊', label: 'Voir progression détaillée' },
-   { icon: '🌍', label: 'Ajouter une langue' },
- ]
+ const STUBS = [
+   { icon: '📊', label: 'Voir progression détaillée' },
+   { icon: '🌍', label: 'Ajouter une langue' },
+ ]

- export default function ChildDetailActions({ enfant }) {
+ export default function ChildDetailActions({ enfant, onProfileUpdated }) {
+   const [isEditOpen, setIsEditOpen] = useState(false)

  // Dans le JSX, AVANT le .map(STUBS), ajout d'un nouveau bouton :
+ <button onClick={() => setIsEditOpen(true)} style={...mêmes styles que stubs sans 'Bientôt disponible'...}>
+   <span>✏️</span> Modifier le profil ›
+ </button>

  // À la fin du JSX, à côté de ConfirmUnlinkModal :
+ <EditProfileModal
+   isOpen={isEditOpen}
+   onClose={() => setIsEditOpen(false)}
+   enfant={enfant}
+   onSuccess={() => { setIsEditOpen(false); onProfileUpdated?.() }}
+ />
```

**Justification du retrait de "Modifier le profil" de `STUBS`** : ce bouton devient fonctionnel donc il ne doit plus afficher "Bientôt disponible". Les 2 autres entrées (Voir progression, Ajouter une langue) restent stubs et conservent leur sous-titre.

---

## 🔧 Diff sommaire — `ChildDetailPage.jsx`

```diff
+ const [refreshKey, setRefreshKey] = useState(0)
+ const [toastProfil, setToastProfil] = useState(null)

  useEffect(() => {
    async function charger() { ... }
    charger()
- }, [navigate, userId])
+ }, [navigate, userId, refreshKey])

+ function handleProfileUpdated() {
+   setRefreshKey(k => k + 1)
+   setToastProfil('Profil mis à jour ✓')
+ }

+ useEffect(() => {
+   if (!toastProfil) return
+   const t = setTimeout(() => setToastProfil(null), 3000)
+   return () => clearTimeout(t)
+ }, [toastProfil])

  // Dans le JSX, AVANT <ChildDetailHero> :
+ {toastProfil && (
+   <div role="status" style={{ /* vert doux Sprint 2C-1 */ }}>
+     <span>✓</span> {toastProfil}
+   </div>
+ )}

- <ChildDetailActions enfant={enfant} />
+ <ChildDetailActions enfant={enfant} onProfileUpdated={handleProfileUpdated} />
```

---

## 🧪 Liste des 7 tests visuels prévus

1. ✏️ **Édition du prénom** : ouvrir la modale, changer "Léa" en "Léa B", enregistrer → modale se ferme, toast vert "Profil mis à jour ✓" visible 3s, prénom mis à jour partout sur `ChildDetailPage`
2. 🎂 **Date qui rend l'enfant ≥ 18 ans** (ex: `2005-01-01`) → message d'erreur sous le champ date, pas d'appel Supabase, modale reste ouverte
3. 🧠 **Changement de profil cognitif** (tdah → dyslexie) → enregistrer, toast vert, badge mis à jour dans le `ChildDetailHero`
4. 🎨 **Changement de version Neuri** (ex: enfant → ado) → enregistrer, toast vert, mascotte rechargée
5. 🔙 **Confirmation fermeture** : modifier le prénom, cliquer sur la croix → overlay "Vous avez des modifications non enregistrées" avec 2 boutons (Annuler revient au form, Quitter sans enregistrer ferme la modale sans UPDATE)
6. ❌ **Fermeture propre** : ouvrir la modale sans modifier, cliquer la croix → ferme direct, pas de confirmation
7. 📭 **Prénom vide** : effacer entièrement le prénom, cliquer Enregistrer → erreur "Le prénom est obligatoire." sous le champ, pas d'UPDATE

---

## ⚠️ Points d'attention / risques identifiés

### 1. ⚠️ Liste `profil_type` non documentée formellement
La BDD n'a pas de CHECK constraint sur `profil_type` (toute string passe). On s'aligne sur la convention applicative `tdah`/`dyslexie` (utilisée dans `profileSettings.js`, `Profile.jsx`, `ChildDetailHero.jsx`). Si Wells veut ajouter une 3ᵉ option (ex: `standard`), me prévenir avant.

### 2. Duplication de `calculateAgeYears`
Fonction recopiée depuis `ParentCreateChild.jsx` car celui-ci est hors-périmètre. ~15 lignes. Pas un problème immédiat mais à factoriser dans un futur sprint dédié (ex: `src/utils/age.js`).

### 3. RLS UPDATE sur `profils`
**Hypothèse** : la policy RLS de `profils` permet à un parent de mettre à jour le profil d'un enfant lié (via la jointure `parent_child_links`). Si ce n'est pas le cas, l'UPDATE échouera silencieusement (ou avec une erreur). Le fallback "Erreur lors de la sauvegarde, réessayez." est déjà prévu côté UI. **À vérifier au test #1** : si ça échoue avec une erreur RLS, signaler à Wells (ne PAS modifier la BDD sans son OK).

### 4. Refresh de l'enfant après UPDATE
Le `refreshKey` re-déclenche le `useEffect` de chargement complet (profil + langues + progression). C'est légèrement plus coûteux qu'un refresh ciblé du seul profil, mais c'est simple et garantit la cohérence visuelle. Acceptable pour ce sprint.

### 5. Taille du composant > 200 lignes
Estimation ~230 lignes pour `EditProfileModal.jsx`. Si la version implémentée dépasse franchement 250 lignes, je sortirai `EditProfileForm.jsx` (les 4 champs + erreurs locales) comme demandé dans le brief. Décision prise au moment de l'implémentation.

### 6. `id` du profil enfant utilisé pour l'UPDATE
On utilise `enfant.user_id` (et non `enfant.id`) car c'est la clé de jointure cohérente avec le reste du code (`ChildDetailPage.jsx:54` fait déjà `.eq('user_id', userId)`).

---

## 🚫 Hors-scope explicite

- ❌ Pas de touche aux 2 autres stubs (Voir progression, Ajouter une langue)
- ❌ Pas de système de toast global ni d'extraction de `Toast.jsx` partagé
- ❌ Pas de migration BDD ni de modification RLS
- ❌ Pas de refacto opportuniste (calculateAgeYears reste dupliquée, etc.)
- ❌ Pas de `git commit` ni `git push`
- ❌ Pas de `npm install`

---

## 🤝 Validation attendue

Pour pouvoir démarrer l'implémentation, j'attends :
1. ✅ Ton **OK explicite** sur le plan
2. ❓ Ta réponse sur la **question `profil_type`** : OK uniquement `tdah` + `dyslexie` ? Ou ajouter un 3ᵉ profil ?

Une fois implémenté + `npm run lint` OK, je produirai `notes/sprint-2c-2-modifier-profil.md`.
