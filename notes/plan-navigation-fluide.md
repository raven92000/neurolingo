# ⚡ Plan — Navigation fluide (contexte profil + squelettes)

> À lire avant toute modification. Rédigé en langage simple.
> Diagnostic réalisé le 2 juillet 2026. **Aucune modification appliquée à ce stade.**
> Objectif : supprimer le rond de chargement plein écran à chaque changement de page.

---

## 🔎 Le problème, en clair

Aujourd'hui, **chaque page enfant repart de zéro** quand on arrive dessus :
1. elle demande « qui est connecté ? » au serveur (`getUser`),
2. elle recharge **le profil** (prénom, XP, langue, réglages…),
3. puis ses données propres (leçons, progression…).

Pendant ce temps, elle affiche un **rond de chargement plein écran** (la barre du bas disparaît).

Or **le profil est le même partout** et ne change pas entre deux pages. Le recharger à chaque fois est inutile et provoque l'attente.

### Ce que chaque page recharge (constaté dans le code)
| Page | Profil | Langue (uuid) | Chapitres | Leçons | Progression | Rond plein écran |
|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ (+ rechargement total de la page ⚠️) | ✅ | ✅ | ✅ | ✅ |
| Learn (Apprendre) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stats (Progression) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile | ✅ | — | — | — | — | ✅ |
| Shop (Boutique) | ✅ | — | — | — | — | ✅ |
| Settings | ✅ | — | — | — | — | ✅ |

👉 **Profile, Shop et Settings ne chargent QUE le profil.** Une fois le profil en mémoire partagée, elles s'afficheront **instantanément** (plus aucun chargement).
👉 **Dashboard, Learn et Stats** ont en plus des données propres (leçons, progression) → pour elles, on remplace le rond plein écran par des **squelettes** (blocs gris) et on garde la barre du bas visible.

---

## 🅰️ VOLET A — Une mémoire partagée du profil

### L'idée en simple
Créer une **mémoire commune** (un « contexte » React) qui charge le profil **une seule fois** et le tient à disposition de toutes les pages. Les pages **lisent** cette mémoire au lieu de refaire la requête → affichage immédiat.

> Un « contexte » React, c'est une boîte de données qu'on remplit une fois tout en haut de l'application, et que n'importe quelle page peut lire sans la recharger.

### Ce que je vais créer
- Un fichier **`src/context/ProfilContext.jsx`** qui fournit à toute l'app :
  - `profil` : le profil de l'utilisateur connecté (ou `null`),
  - `user` : l'utilisateur connecté (pour les redirections),
  - `chargementProfil` : `true` seulement au tout premier chargement,
  - `refreshProfil()` : pour recharger le profil à la demande (après un changement).
- La mémoire écoute l'**état de connexion Supabase** (`onAuthStateChange`) :
  - à la **connexion** → elle charge le profil,
  - à la **déconnexion** → elle **vide** le profil (point important : évite d'afficher les données d'un parent puis d'un enfant sur le même téléphone),
  - au rafraîchissement de session → elle garde tout à jour.
- On enveloppe l'application avec cette mémoire dans **`src/main.jsx`** (`<ProfilProvider><App/></ProfilProvider>`).

### Ce que je change dans les pages enfant
- **Profile, Shop, Settings** : elles lisent `profil` depuis la mémoire → **plus de requête, plus de rond**. (Elles gardent leurs actions : changer le profil TDAH/dyslexie, acheter, régler… qui appelleront `refreshProfil()` après coup.)
- **Dashboard, Learn, Stats** : elles lisent `profil` depuis la mémoire (instantané) et **ne gardent que** le chargement de leurs données propres (leçons/progression), avec un squelette (voir volet B).

### Toujours des données à jour (important)
Pour ne jamais afficher un profil « périmé » (ex. XP après une leçon), la mémoire fonctionne en **« affiche tout de suite, rafraîchis en arrière-plan »** :
- la page montre **immédiatement** le profil mémorisé,
- en même temps, la mémoire **revérifie** le profil en arrière-plan (sans rond), et les chiffres se mettent à jour tout seuls s'ils ont changé.

Et on appelle `refreshProfil()` explicitement après les actions qui modifient le profil : **fin d'une leçon** (XP/leçons), **changement de langue**, **achat boutique**, **changement de réglage/profil**.

---

## 🅱️ VOLET B — Des squelettes au lieu du rond plein écran

### L'idée en simple
Pour les données propres à chaque page (leçons, stats…), au lieu d'un rond plein écran, on affiche **tout de suite la structure de la page** avec des **blocs gris animés** (des « squelettes ») là où le contenu va arriver. La **barre du bas reste visible** en permanence.

### Ce que je vais créer
- Un petit composant **`src/components/Skeleton.jsx`** : des blocs gris arrondis avec une animation de « scintillement » (respecte la DA : fond `#090E1A`, coins arrondis).

### Où je l'utilise
- **Dashboard** : en-tête (prénom, XP) affiché depuis la mémoire ; la carte « leçon suivante » et les tuiles de stats montrent un squelette tant que les leçons/progression chargent.
- **Learn** : la liste des mondes/leçons montre des cartes-squelettes le temps du chargement.
- **Stats** : le graphe et le niveau montrent un squelette.
- La **barre du bas (`BottomNav`) reste toujours affichée** pendant ces chargements.

---

## ⚠️ Points délicats (signalés, pas foncés dessus)

1. **Le rechargement total de page pour la langue** ([Dashboard.jsx:193](../src/pages/Dashboard.jsx#L193)).
   Aujourd'hui, si la langue enregistrée en base diffère de celle du téléphone, Dashboard fait un `window.location.reload()` (rechargement complet, écran blanc). C'est contraire à une navigation fluide.
   **Proposition :** la mémoire partagée **aligne la langue active à partir du profil au moment de la connexion**. Comme la langue est alors cohérente, ce rechargement brutal n'a plus lieu d'être et sera retiré.
   **Prudence :** ça touche la logique qui détermine quels mondes/leçons sont affichés. Je **ne modifie pas** la logique de déverrouillage des mondes ni le filtrage des chapitres/leçons — je change **seulement** la façon de fixer la langue au départ. Je testerai que les mondes se déverrouillent exactement comme avant.

2. **Fraîcheur de la progression / XP.**
   Dashboard, Learn et Stats continueront de **recharger leur progression à chaque visite** (c'est rapide et ça garantit des mondes/XP toujours justes) — je ne mets **pas** la progression en cache. Seul **le profil** est mémorisé (avec rafraîchissement en arrière-plan). Ainsi, le déverrouillage des mondes et le suivi de progression **ne changent pas de comportement**.

3. **Déconnexion / changement de compte.**
   La mémoire se vide automatiquement à la déconnexion (via l'écoute de l'état Supabase). Cas couvert : un parent se déconnecte, un enfant se connecte sur le même appareil → aucune donnée de l'ancien compte ne reste affichée.

4. **Pages parent : non touchées** pour l'instant (comme demandé). Elles gardent leurs propres chargements ; la mémoire partagée ne les gêne pas.

---

## 🧭 Ordre d'application prévu (étape 2, après ton OK)
1. **Volet A** : créer `ProfilContext.jsx`, l'ajouter dans `main.jsx`, brancher les 6 pages enfant dessus (lecture du profil + redirections).
2. **Volet B** : créer `Skeleton.jsx`, remplacer les ronds plein écran par des squelettes dans Dashboard, Learn, Stats (barre du bas toujours visible).
3. Brancher `refreshProfil()` aux endroits qui modifient le profil (fin de leçon, langue, boutique, réglages).

### Tests prévus
- Navigation **Apprendre → Progression → Profil → Boutique** en aller-retour : plus de rond plein écran, affichage immédiat.
- **Changement de langue** bien répercuté partout (Dashboard, Learn).
- **Fin de leçon** : XP et progression à jour au retour sur Dashboard/Stats.
- **Déconnexion puis reconnexion** (y compris parent → enfant sur le même appareil) : aucune donnée de l'ancien compte.
- **Déverrouillage des mondes** inchangé.
- `npm run build` OK.

---

## ✋ STOP — En attente de ta validation

Si tu es d'accord, j'applique **le volet A d'abord**, puis **le volet B**, sans toucher aux pages parent. Je testerai le tout (navigation, langue, fin de leçon, déconnexion, build), puis je commiterai et vérifierai le déploiement Vercel, et j'écrirai `notes/rapport-navigation-fluide.md`.

Un point à me confirmer si tu veux : es-tu d'accord pour que je **retire le rechargement total de page** (`window.location.reload`) de la synchro langue au profit de la mémoire partagée (point délicat n°1) ? Sinon, je le laisse tel quel dans un premier temps.
