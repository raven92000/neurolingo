# Plan — Sprint 2C-1 : Action "Délier l'enfant"

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-11
> **Périmètre** : 1 fichier créé · 2 fichiers modifiés · 0 modif BDD (DELETE applicatif uniquement, RLS existante)

---

## 🎯 Objectif

Rendre fonctionnel le bouton **"🔓 Délier l'enfant"** dans `ChildDetailActions`. Action sensible (irréversible côté UX), donc on bétonne avec :
- Une modale de confirmation claire et rassurante
- Un toast de succès sur la page `ChildrenPage` après redirection
- Une gestion d'erreur propre (modale qui reste ouverte, message d'erreur affiché)

**Règle métier** : Délier = supprimer UNIQUEMENT la ligne dans `parent_child_links`. Aucun impact sur `profils`, `progression`, `auth.users`. L'enfant peut toujours se connecter et être relié à un autre parent via son code `NEURI-XXXX`.

---

## 🔍 Audit préalable (déjà effectué)

### Structure de `parent_child_links` (vérifiée via Supabase MCP)

| Colonne | Type | FK |
|---------|------|----|
| `id` | uuid (PK) | — |
| `parent_id` | uuid | → `auth.users.id` |
| `child_id` | uuid | → `auth.users.id` |
| `created_at` | timestamptz | — |

**→ Conclusion clé** : `parent_id` et `child_id` référencent `auth.users.id` (et NON `profils.id`). Cohérent avec le pattern déjà utilisé partout (`ChildDetailPage.jsx:41`, `ChildrenPage.jsx:51`, `ParentLinkChild.jsx:61-73`).

### RLS sur `parent_child_links` (vérifiée)

| Policy | Commande | Condition |
|--------|----------|-----------|
| "Parents peuvent créer leurs liens" | INSERT | `WITH CHECK (auth.uid() = parent_id)` |
| "Parents peuvent supprimer leurs liens" | **DELETE** | **`USING (auth.uid() = parent_id)`** ✅ |
| "Parents peuvent voir leurs liens" | SELECT | `USING (auth.uid() = parent_id OR auth.uid() = child_id)` |

**→ Conclusion clé** : La policy DELETE existe déjà et permet exactement notre cas. **Aucune modif BDD nécessaire**.

### Identifiants à utiliser

- `parentId` = `user.id` obtenu via `supabase.auth.getUser()` (auth user de la session parent)
- `enfantUserId` = `userId` obtenu via `useParams()` dans `ChildDetailPage` (= `profils.user_id` de l'enfant, qui est aussi `auth.users.id`)

---

## 📁 Fichiers concernés

### 🆕 1. `src/pages/ChildDetail/ConfirmUnlinkModal.jsx` (NOUVEAU)

Composant modale de confirmation, stylé DA NeuroLingo.

**Props** :
```jsx
{
  isOpen: boolean,
  onClose: () => void,           // Annuler ou clic overlay
  onConfirm: () => Promise<void>, // Bouton "Délier"
  prenomEnfant: string,
  erreur: string | null,         // Message d'erreur à afficher
}
```

**Structure JSX (résumé)** :
- Overlay fixe plein écran : `position: fixed`, `inset: 0`, fond `rgba(0,0,0,0.6)`, `z-index: 1000`
- Carte centrée (flex center) : max-width `360px`, fond `#0F1424` (légèrement plus clair que #090E1A pour faire ressortir), border `1px solid rgba(139,92,246,0.25)`, border-radius `24px`, padding `24px`, glow violet subtil via `box-shadow: 0 0 40px rgba(124,58,237,0.25)`
- **Titre fort** : `"Délier {prenomEnfant} de ton compte ?"` (Nunito, 20px, 900, blanc)
- **Bloc explicatif rassurant** (3 lignes max, DM Sans 14px) :
  - ⚠️ "Tu ne pourras plus voir sa progression"
  - 💜 "Son compte et ses leçons sont conservés"
  - 🔗 "Tu pourras la relier plus tard avec son code NEURI-XXXX"
- **Bloc erreur** (conditionnel si `erreur`) : fond `rgba(252,165,165,0.08)`, bordure `rgba(252,165,165,0.25)`, texte `#FCA5A5`
- **Bouton "Annuler"** (proéminent) : fond gradient violet `linear-gradient(135deg, #7C3AED, #6D28D9)`, glow violet
- **Bouton "Délier"** (secondaire) : fond transparent, bordure rouge discrète `1px solid rgba(248,113,113,0.4)`, texte `#FCA5A5`
- **Loading state** : `useState(loading)` interne, bouton "Délier" → "Déliement en cours…" + `disabled`, bouton "Annuler" aussi `disabled`

**Logique interne** :
- `useState` local pour `loading`
- Sur clic "Délier" : `setLoading(true)` → `await onConfirm()` → `setLoading(false)` (le composant parent gère ouverture/fermeture/erreur)
- Sur clic overlay (hors carte) : `onClose()` si `!loading`
- `stopPropagation` sur la carte pour éviter de fermer en cliquant dedans

**Taille estimée** : ~140 lignes (sous la limite des 200 lignes du CLAUDE.md).

---

### ✏️ 2. `src/pages/ChildDetail/ChildDetailActions.jsx` (MODIFIÉ)

**Changements** :
1. Imports ajoutés : `useNavigate` (react-router-dom), `supabase` (../../supabase), `useParams` (react-router-dom), `ConfirmUnlinkModal`
2. Récupère `userId` via `useParams()` (l'enfant à délier)
3. Ajoute états locaux :
   - `modalOuverte` (bool)
   - `erreurDeliement` (string | null)
4. Fonction `handleConfirmDelete` async :
   ```js
   async function handleConfirmDelete() {
     setErreurDeliement(null)
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) {
       setErreurDeliement("Session expirée, reconnecte-toi")
       return
     }
     const { error } = await supabase
       .from('parent_child_links')
       .delete()
       .eq('parent_id', user.id)
       .eq('child_id', userId)
     if (error) {
       console.error('Erreur déliement', error)
       setErreurDeliement("Impossible de délier pour le moment, réessaye")
       return
     }
     // Succès : redirige avec toast
     navigate('/parent-children', {
       state: { toast: `${prenom} a été délié·e de ton compte` }
     })
   }
   ```
5. Le bouton "🔓 Délier l'enfant" :
   - `onClick` → `setModalOuverte(true)` (au lieu de `actionStub`)
   - **Retirer le sous-titre "Bientôt disponible"** sous le bouton
6. Ajout du `<ConfirmUnlinkModal />` en fin de JSX (en dehors du `<div>` flex, ou tout en bas — peu importe car `position: fixed`)

**Tous les autres stubs (Modifier profil, Voir progression, Ajouter langue) restent intacts.**

---

### ✏️ 3. `src/pages/ChildrenPage.jsx` (MODIFIÉ)

**Changements** :
1. Imports ajoutés : `useLocation` (react-router-dom)
2. Récupère `location` via `useLocation()`
3. État local : `toastMessage` (string | null)
4. `useEffect` au mount qui lit `location.state?.toast` :
   ```js
   useEffect(() => {
     if (location.state?.toast) {
       setToastMessage(location.state.toast)
       // Nettoyer le state pour éviter réapparition au refresh
       navigate(location.pathname, { replace: true, state: {} })
       // Auto-disparition après 3s
       const t = setTimeout(() => setToastMessage(null), 3000)
       return () => clearTimeout(t)
     }
   }, [location, navigate])
   ```
5. JSX : ajout d'un toast vert positionné sous le titre "Mes enfants", conditionnel sur `toastMessage` :
   - Fond `rgba(34,197,94,0.12)` (vert doux non criard)
   - Bordure `1px solid rgba(34,197,94,0.35)`
   - Texte `#86EFAC` (vert clair lisible sur fond sombre)
   - Border-radius `14px`, padding `12px 16px`
   - Léger fade-in CSS (optionnel, via `@keyframes` inline)
   - Icône `✓` en préfixe

**Le reste de ChildrenPage est intact.**

---

## 🗄️ Requête Supabase (récap)

```js
const { error } = await supabase
  .from('parent_child_links')
  .delete()
  .eq('parent_id', user.id)   // = auth.uid() côté RLS
  .eq('child_id', userId)      // = useParams().userId (= profils.user_id enfant)
```

- **Couvert par RLS** : policy `"Parents peuvent supprimer leurs liens"` (`auth.uid() = parent_id`) ✅
- **Aucune modif SQL** côté BDD nécessaire

---

## 🎨 DA respectée

- Fond #090E1A (overlay par-dessus, carte légèrement plus claire `#0F1424`)
- Border-radius 20–24px partout
- Glow violet subtil sur la carte modale (`rgba(124,58,237,0.25)`)
- Boutons cohérents avec les autres CTAs de l'app (gradient violet, fonts Nunito/DM Sans)
- Mobile-first : max-width `360px` sur la carte modale, padding adaptatif, modale qui tient sur tous les écrans ≥ 320px
- Toast : vert doux (`#22C55E` avec opacity faible), pas criard

---

## ✅ Validations post-exécution

1. `npm run lint` → 0 nouveau warning/erreur
2. `npm run dev` → démarrage propre, pas de crash console
3. **Tests visuels à faire par Wells** :
   - Cas succès : ouvrir un enfant → cliquer 🔓 Délier → modale s'affiche → confirmer → redirection `/parent-children` + toast vert visible 3s + enfant absent de la liste
   - Cas annulation : ouvrir modale → cliquer "Annuler" → modale se ferme, rien ne change
   - Cas overlay : ouvrir modale → cliquer hors de la carte → modale se ferme
   - Cas erreur (simulé en coupant le réseau) : confirmer → message d'erreur affiché dans la modale, modale reste ouverte
   - Cas refresh : après toast, F5 → toast ne réapparaît pas (state cleanup)

---

## 🚫 Hors-scope explicite

- ❌ Pas de touche aux 3 autres stubs (Modifier profil, Voir progression, Ajouter langue)
- ❌ Pas de système de toast global réutilisable (un seul toast inline dans ChildrenPage)
- ❌ Pas de collecte de "raison" du déliement
- ❌ Pas de modif BDD ni de policy RLS
- ❌ Pas de commit Git

---

## ⚠️ Risques identifiés

1. **RLS** : aucune (policy DELETE existe et matche notre cas) ✅
2. **Effets de bord BDD** : aucun cascade configuré sur `parent_child_links` (vu via `list_tables`). Le DELETE ne touche QUE cette table. `profils` enfant, `progression`, `auth.users` intacts ✅
3. **Concurrence** : si Wells supprime le lien depuis un autre onglet, le DELETE retournera 0 ligne mais pas d'erreur. La redirection se fera quand même. Acceptable pour ce sprint (la cible voulue est atteinte : plus de lien). ✅
4. **Session expirée** : géré explicitement (fallback "Session expirée, reconnecte-toi" dans la modale). ✅
5. **Mémoire de Wells sur l'URL `/parent-children`** : confirmé par la route utilisée déjà dans `BottomNavParent` et par la nav existante.

---

## 📝 Sortie finale prévue

Après exécution, je créerai `notes/sprint-2c-1-delier-enfant.md` avec :
- Fichier créé (chemin, structure, lignes)
- Fichiers modifiés (résumé des diffs)
- Requête Supabase utilisée
- Props et comportements de la modale et du toast
- Procédure de test (succès, annulation, overlay, erreur, refresh)
- Effets de bord vérifiés / risques RLS

---

## 🤝 J'attends ta validation Wells

Si OK, je :
1. Crée `ConfirmUnlinkModal.jsx`
2. Modifie `ChildDetailActions.jsx`
3. Modifie `ChildrenPage.jsx`
4. Lance `npm run lint`
5. Écris la sortie finale `notes/sprint-2c-1-delier-enfant.md`

Tu peux aussi me demander d'ajuster le plan avant (ex: changer la formulation du toast, changer la couleur du bouton "Délier", déplacer le toast, etc.).
