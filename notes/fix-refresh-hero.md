# Fix — Refresh du Hero après édition profil

> **Statut** : ✅ Appliqué
> **Date** : 2026-05-12
> **Type** : Bug fix front
> **Plan d'origine** : [plan-fix-refresh-hero.md](plan-fix-refresh-hero.md)

---

## 🐛 Bug corrigé

Sur `/parent/enfant/:userId`, après avoir modifié le profil enfant via la modale (Sprint 2C-2) et reçu le toast vert "Profil mis à jour ✓", le composant `ChildDetailHero` continuait d'afficher l'**ancien** prénom alors que le UPDATE en BDD était correct.

---

## ✏️ Diff réellement appliqué

Fichier : [src/pages/ChildDetailPage.jsx](../src/pages/ChildDetailPage.jsx) — 1 ligne modifiée (ligne 179)

```diff
-        <ChildDetailHero enfant={enfant} messageEmotionnel={messageEmotionnel} />
+        <ChildDetailHero key={refreshKey} enfant={enfant} messageEmotionnel={messageEmotionnel} />
```

**Aucun autre changement.** Pas de modif de `ChildDetailHero.jsx`. Pas de modif de logique. 1 mot ajouté : `key={refreshKey}`.

### Comment ça marche
Quand `refreshKey` change (incrémenté par `handleProfileUpdated` après save réussi), React voit que la `key` du composant change → il **démonte l'ancien `ChildDetailHero` et remonte un nouveau** avec les props courantes. Le sous-arbre repart de zéro, ce qui garantit qu'aucune closure stale ou optimisation de re-render ne peut bloquer l'affichage du nouveau prénom.

---

## ✅ Validations effectuées

- ✅ `npm run lint` : **15 problèmes total** (11 erreurs + 4 warnings) — identique au baseline pré-fix. **0 nouveau warning/erreur sur `ChildDetailPage.jsx`**.
- ✅ Périmètre respecté : un seul fichier touché, comme prévu dans le plan.
- ✅ Aucune autre modif (pas de `ChildDetailHero.jsx`, pas de modif logique, pas de BDD, pas de dépendance).

---

## 🧪 Test visuel final à faire par Wells

### Cas principal — édition prénom
1. Ouvrir un enfant (ex: Léa, `/parent/enfant/:userId`)
2. Cliquer "Modifier le profil" → modifier le prénom en "Léa B"
3. Enregistrer
4. **Attendre ~1 seconde** (laisser le refetch async se terminer)
5. **Vérifier** : le Hero affiche "Léa B". Le toast vert reste 3s. La page n'a pas rechargé.

### Cas combiné — prénom + profil cognitif
1. Même enfant : prénom "Léa C" ET profil `tdah` → `dyslexie`
2. Enregistrer
3. **Vérifier** : Hero affiche "Léa C" + badge bleu "Dyslexie" (couleur dynamique du fix précédent).

### Cas pas de flash visuel
- Pendant le save, le Hero ne doit pas montrer de saut visuel notable. Le remount à `key` est censé être imperceptible sur fond sombre. Si tu observes un clignotement gênant, signale-le-moi et on optimisera.

### Cas refresh complet (F5)
- Après l'édition, faire F5 → le Hero affiche le nouveau prénom (confirmation BDD intacte).

---

## 🚫 Si le bug persiste après le fix

Ça voudrait dire que la cause réelle est l'**hypothèse A du plan** : erreur silencieuse pendant le refetch (le SELECT ne renvoie pas le nouveau profil, ou échoue dans une étape précédente, sans déclencher l'écran d'erreur car `enfant` reste défini avec l'ancien profil).

**Next step si ça se reproduit** : tu reproduis le bug avec la console DevTools ouverte (onglet "Console" du navigateur, F12) et tu m'envoies tout ce qui apparaît au moment du save. Je pourrai alors :
- Soit ajouter 2 logs temporaires dans `charger()` pour identifier précisément quelle étape échoue
- Soit refactorer vers un pattern d'**optimistic update** (la modale renvoie le nouveau profil que le parent applique directement, sans refetch) — mais ce serait hors-périmètre de ce fix

---

## 📝 Notes pour le commit

### Fichiers à inclure
```
src/pages/ChildDetailPage.jsx                       (modifié — 1 ligne)
notes/plan-fix-refresh-hero.md                      (nouveau)
notes/fix-refresh-hero.md                           (nouveau)
```

### Message de commit suggéré
```
fix(parent): refresh du Hero après édition du profil enfant

Le ChildDetailHero continuait d'afficher l'ancien prénom après une
modification réussie via la modale. Ajout d'une key={refreshKey} sur
le composant pour forcer son remount à chaque refresh, garantissant
la propagation des nouvelles données.
```
