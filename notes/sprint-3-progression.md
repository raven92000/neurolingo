# Sprint 3 — Page Progression détaillée

## Objectif
Rendre fonctionnel le bouton « 📊 Voir progression détaillée » sur la page détail enfant (`/parent/enfant/:userId`) en créant une nouvelle page `/parent/enfant/:userId/progression`.

## Fichiers créés

### `src/pages/ParentChildProgression.jsx` (220 lignes)
Page principale (orchestrateur). Gère :
- Auth + check rôle parent + check lien parent-enfant (mêmes garde-fous que `ChildDetailPage`)
- Récupération du profil enfant (nom + langue)
- Résolution code langue (text) → uuid via la table `langues` (pattern documenté dans CLAUDE.md)
- Récupération des chapitres + leçons + progression
- Calcul en mémoire des statistiques par chapitre (pourcentage, nb leçons terminées, statut de chaque leçon)
- Bouton retour avec `location.state?.from` (cohérent avec le pattern existant)
- États : chargement (spinner), erreur, aucune langue (message bienveillant), liste vide (chapitres absents)

### `src/pages/ParentChildProgression/ChapitreCard.jsx` (140 lignes)
Une carte chapitre :
- Header : label « CHAPITRE N » violet + badge ✅ « Terminé » si 100% + chevron rotatif
- Titre du chapitre
- Compteur « X/Y leçons »
- Barre de progression (violet → vert si terminé)
- Pourcentage à droite de la barre
- Toute la carte est un `<button>` qui toggle l'expand → affiche les `<LeconRow>` du chapitre
- Bordure verte subtile si chapitre 100%

### `src/pages/ParentChildProgression/LeconRow.jsx` (60 lignes)
Une ligne leçon :
- Icône : ✅ vert (terminée) / ⏳ orange (en cours) / • gris (non commencée)
- Titre de la leçon (couleur atténuée si non commencée)
- Label de statut à droite (TERMINÉE / EN COURS / NON COMMENCÉE)

## Fichiers modifiés

### `src/App.jsx`
- Import `ParentChildProgression`
- Nouvelle route : `<Route path="/parent/enfant/:userId/progression" element={<ParentChildProgression />} />`

### `src/pages/ChildDetail/ChildDetailActions.jsx`
- Import `useLocation` ajouté
- Retrait de `{ icon: '📊', label: 'Voir progression détaillée' }` du tableau `STUBS` (il ne reste que « Ajouter une langue »)
- Ajout d'un bouton fonctionnel « 📊 Voir progression détaillée » juste après « Modifier le profil », avec :
  ```js
  navigate(`/parent/enfant/${userId}/progression`, {
    state: { from: location.pathname }
  })
  ```

## Choix techniques notables

### Résolution langue text → uuid
Comme indiqué dans CLAUDE.md, `profils.langue_id` est en TEXT (code comme `'en'`) alors que `chapitres.langue_id` est en UUID. La page fait donc :
1. `profils.langue_id` (text) → `langues.id` (uuid) via `.eq('code', profils.langue_id)`
2. Puis `chapitres.langue_id = langues.id`

Si la résolution échoue (enfant sans langue, ou code invalide) → message bienveillant « Aucune langue assignée ».

### Définition de « terminée » / « en cours » / « non commencée »
Suivant le brief :
- Pas de ligne `progression` pour la leçon → **non commencée**
- Ligne avec `completee_le NOT NULL` → **terminée**
- Ligne avec `completee_le IS NULL` → **en cours**

⚠️ À noter : `Stats.jsx` utilise `partie_completee === 2` pour définir « complète ». Si le test révèle une divergence (ex: leçon avec `completee_le` mais `partie_completee < 2`), on ajustera dans un patch dédié.

### Sécurité progression
La lecture de la table `progression` est enveloppée dans un try/catch (comme dans `ChildDetailPage`). Si RLS bloque → fallback gracieux : tous les chapitres à 0%, message dans la console.

## Vérifications

### `npm run lint` ✅
Aucune nouvelle erreur ni warning sur les fichiers créés ou modifiés. Les 15 erreurs/warnings restants sont préexistants dans `Profile.jsx`, `Settings.jsx`, `Shop.jsx`, `Lesson.jsx`, `SentenceExercise.jsx` — non liés à ce sprint.

```
$ npm run lint 2>&1 | grep -E "ParentChildProgression|ChildDetailActions|App\.jsx"
→ aucune ligne (= rien à signaler)
```

### Découpage des fichiers
- `ParentChildProgression.jsx` : ~220 lignes (juste au-dessus du seuil de 200). Très peu de marge — si on ajoute des features plus tard, prévoir d'extraire le `useEffect` de fetch en hook custom (`useChildProgression`).
- `ChapitreCard.jsx` : ~140 lignes
- `LeconRow.jsx` : ~60 lignes

## Tests visuels à faire par Wells

1. **Sur la page détail Léa** (`/parent/enfant/<userId-de-Lea>`), cliquer sur **« 📊 Voir progression détaillée »** → la page s'ouvre, URL = `/parent/enfant/<userId>/progression`.
2. **Header** : titre « Progression de Léa » + bouton ← en haut à gauche.
3. **Liste des chapitres anglais** (langue de Léa) : barres de progression à 0%, compteurs « 0/X leçons ». Pas de badge ✅.
4. **Cliquer sur une carte chapitre** → expand qui révèle la liste des leçons, toutes en gris « NON COMMENCÉE ». Cliquer à nouveau → collapse.
5. **Chevron** : tourne de 0° à 90° pendant l'expand.
6. **Bouton retour ←** → revient sur `/parent/enfant/:userId`.
7. **Console** : pas d'erreur ni warning React.
8. **Mobile** : tout tient dans une largeur de 430px max.
9. **F5 sur la page progression** : pas de crash, la page se recharge et le bouton retour mène toujours à `/parent/enfant/:userId` (fallback sans `state.from`).
10. **Cas particuliers à vérifier si tu peux** :
    - Si un enfant n'a pas de langue (`langue_id` NULL) : affichage du message « Aucune langue assignée à {prénom} ».
    - Si un chapitre n'a pas de leçons : la carte affiche « 0/0 leçon » et 0%. Quand on l'expand, message « Aucune leçon dans ce chapitre pour le moment. »

## Hors-périmètre signalé (non touché)
- **Pas de refacto de `Stats.jsx`** malgré le bug latent identifié sur `langue_id` text/uuid (refacto opportuniste interdite — sera traité dans le sprint dédié à la migration `langue_id`).
- **Pas de modif des autres `STUBS`** de `ChildDetailActions` (« Ajouter une langue » reste un stub).
- **Aucune modif BDD**.
- **Aucun `git add/commit/push`** comme convenu.

## Points d'attention pour la suite
- Si le test révèle qu'aucun chapitre ne s'affiche : c'est très probablement que `chapitres.langue_id` est en réalité TEXT (et donc la résolution `code → uuid` doit être adaptée). Le cas échéant, vérifier le type exact de la colonne dans le dashboard Supabase et m'indiquer la correction à faire.
- Si certaines leçons devraient être marquées « terminée » mais apparaissent « en cours », c'est un mismatch entre `completee_le` et `partie_completee`. Me l'indiquer pour ajuster le helper `getStatutLecon`.
