# ⚡ Rapport — Navigation instantanée (progression « affiche tout de suite, rafraîchis en arrière-plan »)

> Travail réalisé le 2 juillet 2026. Suite au diagnostic `notes/diagnostic-latence-navigation.md`
> (validé par Wells : Corrections 1 + 2 ; migration Paris repoussée). Pages parent non touchées.

---

## 🎯 Le problème (rappel du diagnostic)
Chaque changement d'onglet **bloquait sur la requête progression fraîche** (~250 ms à chaud, plusieurs secondes sur mobile à froid, serveur en Irlande). Le squelette s'affichait donc à **chaque** navigation, même quand le contenu était déjà en cache.

## ✅ Ce qui a été fait

### Correction 1 — Dernière progression connue en mémoire (stale-while-revalidate)
- Nouveau [src/context/ProgressionContext.jsx](../src/context/ProgressionContext.jsx) : garde la **dernière progression connue** de l'utilisateur.
  - `progression` : le dernier tableau connu (colonnes `lecon_id, completee_le, partie_completee`, surensemble des besoins des 3 pages).
  - `refreshProgression()` : revérifie la progression et met à jour la mémoire.
  - Se **vide à la déconnexion / au changement de compte**.
- Les pages **affichent immédiatement** à partir de cette mémoire, puis appellent `refreshProgression()` en **arrière-plan** (sans squelette). Si la progression a changé, l'affichage se met à jour tout seul.
- Imbriqué dans [main.jsx](../src/main.jsx) : `ProfilProvider → ContenuProvider → ProgressionProvider → App`.

### Correction 2 — Squelette seulement s'il n'y a **rien** à montrer
- **Dashboard** : la « leçon suivante » et « tout complété » sont maintenant **dérivés** (`useMemo`) du contenu (cache) + de la dernière progression connue → se recalculent tout seuls quand la progression est revalidée. Squelette de la carte seulement si contenu OU progression manquants.
- **Learn** : mondes/leçons depuis le cache + progression depuis la mémoire. Squelette seulement si le contenu de la langue courante n'est pas encore chargé **ou** aucune progression connue.
- **Stats** : `xpParJour`/`streak`/`niveau` dérivés (`useMemo`) des leçons (mises en cache via un nouveau `chargerLeconsToutes()` dans ContenuContext) + progression. Squelette seulement au tout premier chargement.

**Résultat** : après la **première** visite d'une session, le squelette n'apparaît plus lors des navigations — la page s'affiche instantanément avec la dernière progression connue, et se met à jour silencieusement en arrière-plan.

---

## 🔒 Déverrouillage & calcul de progression : inchangés
- Les fonctions de calcul (`getEtatChapitre`, `getEtatNiveau`, `niveauEstDebloque`, `calculerNiveauActuel`, `calculerXPParJour`, `calculerStreak`) **ne sont pas modifiées** : elles reçoivent les **mêmes données** qu'avant (contenu + progression), simplement via la mémoire au lieu d'une requête à chaque fois.
- La progression est **toujours revalidée** à chaque visite → XP et déverrouillage restent justes (juste affichés instantanément d'abord, puis rafraîchis).
- **Quirk de Stats laissé tel quel** : sa requête `chapitres` renvoyait toujours vide (langue_id est un code, colonne UUID → **vérifié : 12/12 enfants ont `'en'`**). On passe donc `chapitres = []` : exactement la même entrée (niveau figé) que la requête d'origine, sans aller-retour réseau inutile. Comportement identique.

---

## 🧪 Tests réalisés
- **Instrumentation `console.time` retirée** avant tout commit (vérifié : plus aucune ligne `[DIAG]`/`DIAGNOSTIC TEMPORAIRE`).
- `npm run build` : ✅ compile (122 modules, aucune erreur).
- `npm run dev` : ✅ démarre, sert l'app + les 3 contextes, aucune erreur.
- Lint : ✅ aucune **nouvelle catégorie** d'erreur — `ProgressionContext` déclenche exactement les mêmes règles de style (`only-export-components`, `set-state-in-effect`) que les contextes existants `ProfilContext`/`ContenuContext`.
- Données de déverrouillage vérifiées (sprint précédent) : contenu identique (11 chapitres, 61 leçons pour `en`) ; colonnes progression = surensemble couvrant les 3 pages.

### ⚠️ À confirmer sur ton téléphone
- Navigation **Accueil → Apprendre → Progression → Boutique** en aller-retour : **plus de squelette** après la 1re visite.
- **Fin d'une leçon** : au retour, l'XP et le déverrouillage se mettent à jour (affichage instantané puis rafraîchissement).
- **Changement de langue** : recharge le bon contenu (bref squelette la 1re fois pour une langue non encore chargée, instantané ensuite).
- **Déconnexion** : plus aucune progression/contenu mémorisés.

---

## 📌 Résumé
- ✅ La progression s'affiche **instantanément** (dernière valeur connue) puis se rafraîchit en arrière-plan.
- ✅ Le squelette n'apparaît **qu'au tout premier chargement** d'une session.
- ✅ Déverrouillage et calcul de progression **inchangés** (mêmes données, revalidation systématique).
- ✅ Mesures temporaires retirées.
- ↪️ Migration du serveur vers Paris (Correction 3) : à décider plus tard ; quirk de Stats : correction séparée à suivre.
