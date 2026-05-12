# Plan — Fix prénom tronqué au premier espace

> **Statut** : 📋 Plan en attente de validation Wells
> **Date** : 2026-05-12
> **Type** : Bug fix UX
> **Périmètre proposé** : 6 fichiers · 10 occurrences au total

---

## 🐛 Bug observé

Quand `profils.nom = "Lea test"` (avec espace), l'UI affiche "Lea" au lieu du prénom complet.

**Cause confirmée** : usage généralisé de `nom?.split(' ')[0]` qui suppose à tort que le champ `profils.nom` contiendrait "Prénom Nom de famille". En réalité, le champ stocke uniquement le prénom de l'enfant (entré par le parent dans le formulaire de création — [ParentCreateChild.jsx:238](../src/pages/ParentCreateChild.jsx#L238) : `nom: trimmedPrenom`).

Donc un enfant nommé **"Jean Paul"** ou **"Marie Anne"** (prénom composé avec espace) s'affiche tronqué.

---

## 🔍 Inventaire exhaustif des troncatures trouvées

Recherche effectuée via grep sur `\.split(' ')`, `nom\?\.split`, `nom\.split`, `.substring`, `.slice(0` dans tout `src/`.

### Sur des enfants (à corriger — 8 occurrences sur 5 fichiers)

| Fichier | Ligne | Code actuel | Contexte |
|---------|-------|-------------|----------|
| [ParentDashboard.jsx](../src/pages/ParentDashboard.jsx) | 235 | `${enfantActif?.nom?.split(' ')[0]} progresse davantage...` | Conseil personnalisé |
| [ParentDashboard.jsx](../src/pages/ParentDashboard.jsx) | 291 | `{enfantActif?.nom?.split(' ')[0]}{ageEnfant && ...}` | Carte enfant en haut |
| [ChildrenPage.jsx](../src/pages/ChildrenPage.jsx) | 167 | `{enfant.nom?.split(' ')[0]}` | Carte de chaque enfant dans la liste |
| [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) | 149 | `prenom: enfant.nom?.split(' ')[0]` | Prop pour `genererMessageEmotionnel` |
| [ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) | 193 | `prenom={enfant.nom?.split(' ')[0]}` | Prop pour `<ChildDetailActivity>` |
| [ChildDetailHero.jsx](../src/pages/ChildDetail/ChildDetailHero.jsx) | 20 | `enfant?.nom?.split(' ')[0] \|\| 'Ton enfant'` | Titre principal du Hero |
| [ChildDetailActions.jsx](../src/pages/ChildDetail/ChildDetailActions.jsx) | 38 | `enfant?.nom?.split(' ')[0] \|\| 'Ton enfant'` | Variable `prenom` utilisée dans toast déliement + texte UI |
| [EditProfileModal.jsx](../src/pages/ChildDetail/EditProfileModal.jsx) | 142 | `(valeursInitiales?.prenom \|\| enfant?.nom \|\| 'Ton enfant').split(' ')[0]` | Titre "Modifier le profil de {prenomAffiche}" |

### Sur le parent (à NE PAS toucher dans ce sprint sans validation)

| Fichier | Ligne | Code actuel | Contexte |
|---------|-------|-------------|----------|
| [ParentDashboard.jsx](../src/pages/ParentDashboard.jsx) | 178 | `Bonjour {parent?.nom?.split(' ')[0]}` | Header "écran vide" |
| [ParentDashboard.jsx](../src/pages/ParentDashboard.jsx) | 247 | `Bonjour {parent?.nom?.split(' ')[0]}` | Header normal |

❓ **Question à Wells** : pour le parent, le champ `profils.nom` contient-il "Prénom Nom" ou juste "Prénom" ? Si c'est "Prénom Nom" (cas classique d'inscription parent), le `.split(' ')[0]` est **intentionnel** pour saluer avec juste le prénom — à laisser tel quel. Si c'est juste "Prénom", à corriger comme pour les enfants. **Sans ta réponse, je laisse intact par défaut** (les 2 lignes parent sont hors-périmètre de ce fix).

### Exclu (non concerné)

`src/pages/SentenceExercise.jsx` ligne 111, 194, 283 : `phrase.en.split(' ')` — découpe une phrase anglaise en mots pour le gameplay. **Rien à voir avec un prénom**. Exclu.

---

## ⚠️ Signal périmètre étendu — validation Wells requise

Le brief mentionne : *"Si tu trouves la troncature dans un fichier hors-périmètre habituel, SIGNALE-LE-MOI dans la note pour validation avant d'y toucher."*

Les fichiers concernés sont **tous déjà touchés dans des sprints précédents** (Sprint 2C-1, 2C-2, fixes refresh), donc dans le périmètre familier. Liste des 6 fichiers à modifier :

1. `src/pages/ParentDashboard.jsx`
2. `src/pages/ChildrenPage.jsx`
3. `src/pages/ChildDetailPage.jsx` (⚠️ contient les 2 console.log temporaires — **ils restent intacts** dans ce fix)
4. `src/pages/ChildDetail/ChildDetailHero.jsx`
5. `src/pages/ChildDetail/ChildDetailActions.jsx`
6. `src/pages/ChildDetail/EditProfileModal.jsx`

**Aucun fichier vraiment hors-périmètre**, mais je préfère lister explicitement pour que tu valides.

---

## ✅ Fix proposé

**Principe** : remplacer `nom?.split(' ')[0]` par juste `nom` (en conservant le `?.` optional chaining et le fallback `|| 'Ton enfant'` quand il existe).

**Pourquoi pas autre chose** :
- ❌ Renommer le champ BDD `nom` → `prenom` : hors-scope, casserait tout.
- ❌ Ajouter un computed prénom dans une util : sur-engineering pour un fix qui consiste à retirer 16 caractères.
- ✅ Retirer simplement `?.split(' ')[0]` : minimal, lisible, sémantiquement correct (le champ stocke un prénom complet, on l'affiche tel quel).

---

## 📋 Diff précis pour chaque fichier

### 📝 1. `src/pages/ParentDashboard.jsx` — 2 modifications

#### Ligne 235
```diff
-    `${enfantActif?.nom?.split(' ')[0]} progresse davantage le matin.`,
+    `${enfantActif?.nom} progresse davantage le matin.`,
```

#### Ligne 291
```diff
-              {enfantActif?.nom?.split(' ')[0]}{ageEnfant && ` (${ageEnfant} ans)`}
+              {enfantActif?.nom}{ageEnfant && ` (${ageEnfant} ans)`}
```

⚠️ Les lignes 178 et 247 (`parent?.nom?.split(' ')[0]`) **ne sont PAS modifiées** sauf validation explicite de Wells (voir question ci-dessus).

---

### 📝 2. `src/pages/ChildrenPage.jsx` — 1 modification

#### Ligne 167
```diff
-                    {enfant.nom?.split(' ')[0]}
+                    {enfant.nom}
```

---

### 📝 3. `src/pages/ChildDetailPage.jsx` — 2 modifications

#### Ligne 149
```diff
-      prenom: enfant.nom?.split(' ')[0],
+      prenom: enfant.nom,
```

#### Ligne 193
```diff
-        <ChildDetailActivity activites={activites} prenom={enfant.nom?.split(' ')[0]} />
+        <ChildDetailActivity activites={activites} prenom={enfant.nom} />
```

⚠️ Les 2 `console.log` temporaires (marqueurs `🔬 LOG TEMPORAIRE`) **restent intacts** comme demandé.

---

### 📝 4. `src/pages/ChildDetail/ChildDetailHero.jsx` — 1 modification

#### Ligne 20
```diff
-  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'
+  const prenom = enfant?.nom || 'Ton enfant'
```

---

### 📝 5. `src/pages/ChildDetail/ChildDetailActions.jsx` — 1 modification

#### Ligne 38
```diff
-  const prenom = enfant?.nom?.split(' ')[0] || 'Ton enfant'
+  const prenom = enfant?.nom || 'Ton enfant'
```

Cette variable `prenom` est utilisée dans :
- Le toast "{prenom} a été délié·e de ton compte" → affichera désormais "Jean Paul a été délié·e..."
- Le texte "{prenom} peut se connecter avec ce code." → idem

---

### 📝 6. `src/pages/ChildDetail/EditProfileModal.jsx` — 1 modification

#### Ligne 142
```diff
-  const prenomAffiche = (valeursInitiales?.prenom || enfant?.nom || 'Ton enfant').split(' ')[0]
+  const prenomAffiche = valeursInitiales?.prenom || enfant?.nom || 'Ton enfant'
```

Utilisé dans le titre de la modale : "Modifier le profil de {prenomAffiche}" → affichera désormais "Modifier le profil de Jean Paul".

---

## ⚠️ Points d'attention / risques

### Impact UX
- ✅ Les prénoms à un seul mot (cas majoritaire) : **comportement inchangé** (`"Lea"` reste `"Lea"`).
- ✅ Les prénoms composés avec tiret : **déjà OK avant** (`"Marie-Claire"` n'a pas d'espace, jamais tronqué).
- ✅ Les prénoms composés avec espace : **bug corrigé** (`"Jean Paul"` s'affichera bien `"Jean Paul"`).
- ⚠️ Si quelqu'un avait stocké "Prénom Nom de famille" dans `profils.nom` en s'inspirant du `.split(' ')[0]` pour "extraire le prénom", il verra désormais le nom complet. Probabilité : très faible vu le formulaire qui demande explicitement "Prénom de votre enfant".

### Cohérence avec la BDD
Le formulaire de création ([ParentCreateChild.jsx:386-389](../src/pages/ParentCreateChild.jsx#L386-L389)) demande "Prénom de votre enfant" et stocke directement la valeur dans `profils.nom`. Donc le champ contient un prénom (qui peut contenir un espace pour les prénoms composés). Le fix est aligné avec cette sémantique.

### Risque de longueur d'affichage
Un prénom composé long (ex: "Marie Anne Charlotte") pourrait déborder dans certaines cartes mobiles. À tester visuellement (cas 4 ci-dessous), mais probablement OK avec les `text-overflow` ou wrap naturels du CSS.

### Hors-scope explicite
- Pas de modif des `parent?.nom?.split(' ')[0]` (lignes 178 et 247 de ParentDashboard) sans validation.
- Pas de modif BDD ni de migration sur le champ `nom`.
- Pas de retrait des 2 console.log temporaires.
- Pas de modif des `phrase.en.split(' ')` dans SentenceExercise (gameplay, non concerné).

---

## 🧪 Tests visuels à faire après application

### Cas 1 — Prénom à un seul mot (régression check)
1. Avoir un enfant nommé "Lea" (sans espace)
2. Vérifier sur `/parent-dashboard`, `/parent-children`, `/parent/enfant/:userId`, modale Modifier le profil → affiche "Lea" partout.

### Cas 2 — Prénom composé avec espace (le bug)
1. Modifier le prénom d'un enfant en "Jean Paul" via la modale
2. Vérifier que ces 8 endroits affichent "Jean Paul" complet :
   - Carte enfant en haut du `/parent-dashboard`
   - Conseil personnalisé en bas du `/parent-dashboard` ("Jean Paul progresse davantage...")
   - Carte enfant dans la liste `/parent-children`
   - Titre principal du Hero `/parent/enfant/:userId`
   - Section "Activité récente" (texte "Jean Paul a fait sa première leçon..." etc.)
   - Variable `prenom` dans Actions (toast déliement + texte "Jean Paul peut se connecter...")
   - Titre de la modale "Modifier le profil de Jean Paul"
   - Toast vert après save : "Profil mis à jour ✓" (n'utilise pas le prénom, juste vérifier qu'il n'y a pas d'erreur)

### Cas 3 — Prénom avec tiret (déjà OK)
1. Modifier en "Marie-Claire"
2. Vérifier : affiché "Marie-Claire" partout (comportement déjà correct avant).

### Cas 4 — Prénom long (risque UI)
1. Modifier en "Marie Anne Charlotte" (long avec 2 espaces)
2. Vérifier : pas de débordement visible / wrap propre sur les cartes mobiles.

### Cas 5 — Pas de régression
1. Navigation classique entre toutes les pages, sans modif → tout fonctionne.

---

## 🤝 Validation attendue

J'attends ton **OK explicite** pour appliquer les 8 modifs sur les 6 fichiers, ET ta réponse sur :

❓ **Question parent** : faut-il aussi corriger `parent?.nom?.split(' ')[0]` sur les lignes 178 et 247 de ParentDashboard ?
- **Si OUI** → on ajoute ces 2 lignes au diff (Bonjour s'affichera avec le nom complet du parent)
- **Si NON** → on laisse intact (comportement actuel : "Bonjour [premier mot]" pour le parent)

Après application :
1. `npm run lint` doit passer sans nouveau warning
2. J'écris `notes/fix-prenom-tronque.md` avec le diff réellement appliqué + résultat lint
3. Tu testes les 5 cas visuels ci-dessus
