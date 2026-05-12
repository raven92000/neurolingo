# Plan — Mini-fix : afficher le niveau dans ChapitreCard

## Objectif
Sur la page Progression détaillée (Sprint 3), chaque carte chapitre affiche aujourd'hui un label « CHAPITRE N » en haut. Wells veut aussi voir le niveau du chapitre.

Format proposé : **« CHAPITRE 0 · NIVEAU 1 »** (séparateur point milieu), même style violet uppercase que l'existant.

---

## Constat préalable

J'ai lu les deux fichiers concernés. Constat important :

### `ParentChildProgression.jsx:85` — la query SELECT ne ramène PAS `niveau`
```js
.select('id, numero, titre')
```
Et le mapping du résultat (lignes 126-134) ne propage pas non plus `niveau`. Donc **2 fichiers à modifier**, pas 1.

Le brief m'a anticipé : « si la query SELECT ne contient pas 'niveau', il faudra l'ajouter — signale-le-moi dans le plan ». C'est le cas.

---

## Diff proposé

### Fichier 1 : `src/pages/ParentChildProgression.jsx`

**1.a — Ligne 85 : ajouter `niveau` au SELECT**

```diff
-          .select('id, numero, titre')
+          .select('id, numero, titre, niveau')
```

**1.b — Lignes 126-134 : ajouter `niveau` à la structure retournée**

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

### Fichier 2 : `src/pages/ParentChildProgression/ChapitreCard.jsx`

**2.a — Ligne 7 : destructurer `niveau` depuis `chapitre`**

```diff
-  const { numero, titre, lecons, nbTotal, nbTerminees, pourcentage } = chapitre
+  const { numero, niveau, titre, lecons, nbTotal, nbTerminees, pourcentage } = chapitre
```

**2.b — Lignes 36-45 : afficher « CHAPITRE N · NIVEAU X »**

```diff
           <span style={{
             fontFamily: 'Nunito, sans-serif',
             fontSize: '11px',
             fontWeight: 800,
             color: '#A78BFA',
             letterSpacing: '0.08em',
             textTransform: 'uppercase',
           }}>
-            Chapitre {numero}
+            Chapitre {numero}{niveau != null ? ` · Niveau ${niveau}` : ''}
           </span>
```

---

## Raisonnement / choix techniques

### Pourquoi un seul `<span>` au lieu de deux côte-à-côte
Plus simple, et `textTransform: uppercase` + même style violet s'appliquent automatiquement à toute la chaîne. Pas besoin de gérer un `gap` entre deux éléments. Le point milieu (`·`) joue le rôle de séparateur visuel.

### Pourquoi le ternaire `niveau != null`
Défensif : si `chapitres.niveau` est NULL ou `undefined` en BDD pour un chapitre, on n'affiche que « CHAPITRE N » sans `· NIVEAU` orphelin. `!= null` capture à la fois `null` et `undefined` (single equals intentionnel). C'est défensif sans être lourd.

### Pourquoi placer `niveau` juste après `numero` dans la destructuration
Ordre logique de hiérarchie (chapitre → niveau, même famille de métadonnées), facilite la lecture.

### Pourquoi le point milieu `·` (U+00B7) plutôt que `•` ou `|`
- `·` est plus discret que `•` (gros bullet rond) → cohérent avec la typo fine du label
- `|` serait visuellement « technique »
- `·` est un standard typographique pour séparer des micro-infos sur une même ligne

---

## Rendu attendu

**Avant** : `CHAPITRE 0`
**Après** : `CHAPITRE 0 · NIVEAU 1`

Style identique : violet clair `#A78BFA`, uppercase, `font-size: 11px`, `font-weight: 800`, `letter-spacing: 0.08em`. Aucun changement de hauteur de carte ni de layout.

---

## Tests visuels prévus

1. Sur la page Progression détaillée, chaque carte chapitre affiche désormais « CHAPITRE N · NIVEAU X » en haut.
2. Le style (violet, uppercase, taille, weight) reste identique à l'existant.
3. Si un chapitre n'a pas de `niveau` en BDD (cas hypothétique) : affichage limité à « CHAPITRE N » sans séparateur orphelin.
4. `npm run lint` passe sans nouveau warning.
5. Console : pas d'erreur.

---

## Hors-périmètre confirmé

- Aucune autre modif que ces 2 fichiers
- Pas de migration BDD (`chapitres.niveau` existe déjà selon le brief)
- Pas d'install npm
- Pas de git commit / push
- Pas de refacto opportuniste

---

## En attente de validation

Si tu valides ce plan, j'applique dans cet ordre :
1. Modifier `src/pages/ParentChildProgression.jsx` (SELECT + mapping)
2. Modifier `src/pages/ParentChildProgression/ChapitreCard.jsx` (destructuring + JSX)
3. `npm run lint`
4. Écrire le rapport `notes/fix-affichage-niveau-chapitre.md`
