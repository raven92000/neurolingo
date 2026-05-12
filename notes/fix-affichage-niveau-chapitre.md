# Fix — Affichage du niveau dans ChapitreCard

## Objectif
Sur la page Progression détaillée, chaque carte chapitre affichait uniquement « CHAPITRE N » en haut. Wells voulait aussi voir le niveau du chapitre.

**Avant** : `CHAPITRE 0`
**Après** : `CHAPITRE 0 · NIVEAU 1`

## Diff appliqué

### `src/pages/ParentChildProgression.jsx`

**1) Query SELECT étendue avec `niveau`**
```diff
-          .select('id, numero, titre')
+          .select('id, numero, titre, niveau')
```

**2) Mapping enrichi avec `niveau`**
```diff
           return {
             id: chap.id,
             numero: chap.numero,
             titre: chap.titre,
+            niveau: chap.niveau,
             lecons: leconsAvecStatut,
             nbTotal,
             nbTerminees,
             pourcentage,
           }
```

### `src/pages/ParentChildProgression/ChapitreCard.jsx`

**1) Destructuring**
```diff
-  const { numero, titre, lecons, nbTotal, nbTerminees, pourcentage } = chapitre
+  const { numero, niveau, titre, lecons, nbTotal, nbTerminees, pourcentage } = chapitre
```

**2) Affichage du label avec séparateur point milieu**
```diff
-            Chapitre {numero}
+            Chapitre {numero}{niveau != null ? ` · Niveau ${niveau}` : ''}
```

## Choix techniques

- **Un seul `<span>`** pour les deux infos : `textTransform: uppercase` + style violet s'appliquent automatiquement à toute la chaîne, pas besoin de gérer un `gap` entre deux éléments.
- **Séparateur `·` (point milieu, U+00B7)** : discret, typographiquement standard, cohérent avec la finesse du label.
- **Ternaire défensif `niveau != null`** : si un chapitre n'a pas de niveau en BDD (NULL/undefined), on n'affiche que « CHAPITRE N » sans séparateur orphelin. `!= null` capture les deux cas (single equals intentionnel).

## Vérifications

### `npm run lint` ✅
```
$ npm run lint 2>&1 | grep -E "ParentChildProgression|ChapitreCard"
→ aucune ligne (aucun nouveau warning/erreur sur les fichiers modifiés)
```
Les 15 problèmes restants du projet sont préexistants dans d'autres fichiers (Profile, Settings, Shop, Lesson, SentenceExercise) — non liés à ce fix.

### Style préservé
Le label conserve exactement le même style qu'avant (violet `#A78BFA`, uppercase, `font-size: 11px`, `font-weight: 800`, `letter-spacing: 0.08em`). Aucun changement de hauteur de carte ni de layout.

## Tests visuels à faire par Wells

1. Ouvrir `/parent/enfant/<userId>/progression` → chaque carte chapitre affiche maintenant « CHAPITRE N · NIVEAU X » en haut.
2. Vérifier que la mise en page de la carte n'a pas bougé (le label reste sur une seule ligne, style identique).
3. Console : pas d'erreur ni warning.
4. Mobile 430px : le label tient toujours sur sa ligne (devrait être OK, c'est un texte court).

## Hors-périmètre confirmé
- Aucune autre modif que ces 2 fichiers
- Pas de migration BDD
- Pas d'install npm
- Pas de git commit / push
