# ⚡ Plan — Cache du contenu pédagogique + requêtes parallèles

> À lire avant toute modification. Rédigé en langage simple.
> Diagnostic réalisé le 2 juillet 2026. **Aucune modification appliquée à ce stade.**
> Objectif : supprimer les 1-2 s de squelettes restantes entre Accueil, Apprendre et Progression.

---

## 🔎 Le problème, en clair

Le rond de chargement a disparu (sprint précédent), mais Dashboard, Learn et Stats **rechargent leur contenu pédagogique à chaque visite**, avec des requêtes **en file indienne** (chacune attend la précédente) :

| Page | Requêtes actuelles (en série) | Allers-retours serveur |
|---|---|---|
| **Dashboard** | `langues` → `chapitres` → `lecons` → `progression` | **4** |
| **Learn** | `langues` → `chapitres` → `lecons` → `progression` | **4** |
| **Stats** | `progression` → `lecons` → `chapitres` | **3** (pourtant indépendantes !) |

Or `langues`, `chapitres` et `lecons` d'une langue **ne changent pas** pendant une session. Seule la `progression` doit rester fraîche.

---

## 🎯 Ce que je propose

### 1. Une mémoire partagée du contenu pédagogique — **contexte dédié** (recommandé)
**Recommandation : créer un contexte séparé `ContenuContext`**, plutôt que d'entasser dans `ProfilContext`.
- **Pourquoi séparé ?** `ProfilContext` s'occupe de « qui est connecté + son profil ». Le contenu pédagogique (chapitres/leçons/langues) est un autre sujet. Deux petits fichiers clairs valent mieux qu'un gros fourre-tout (et c'est plus facile à faire évoluer).
- Il sera **imbriqué dans `ProfilProvider`** pour pouvoir lire l'utilisateur connecté (afin de se vider à la déconnexion).

**Ce que la mémoire retient**, par **code de langue** (`'en'`, `'es'`…) :
- la liste `langues` (chargée une fois, minuscule),
- les `chapitres` de la langue,
- les `lecons` de la langue.

**Son API (simple)** : une fonction `chargerContenu(code)` qui :
- si la langue est **déjà en mémoire** → la renvoie **instantanément** (0 requête),
- sinon → charge `chapitres` puis `lecons` (elles se suivent car les leçons dépendent des chapitres), **met en cache**, et renvoie.

**Vidage / rechargement :**
- **Déconnexion ou changement de compte** → la mémoire du contenu se **vide** (comme le profil).
- **Changement de langue** → on charge le contenu de la **nouvelle** langue (et on garde l'ancienne en cache, donc revenir en arrière est instantané).

**Branchement** : dans `main.jsx`, on imbrique
`<ProfilProvider> <ContenuProvider> <App/> </ContenuProvider> </ProfilProvider>`.

### 2. Requêtes parallèles sur chaque page
Sur chaque page, on lance **en même temps** (`Promise.all`) ce qui est indépendant :

- **Dashboard & Learn** : le **contenu** (via `chargerContenu`, souvent déjà en cache) **en parallèle** de la **progression** (toujours fraîche). La progression ne dépend pas du contenu → on n'attend plus qu'un seul aller-retour.
- **Stats** : ses **3 requêtes** (`progression`, `lecons`, `chapitres`) sont **indépendantes** → on les lance **toutes en parallèle** (au lieu d'à la queue leu leu).

---

## 📊 Gain estimé (allers-retours serveur par page)

| Page | Avant | Après (1re visite d'une langue) | Après (visites suivantes) |
|---|---|---|---|
| **Dashboard** | 4 en série | ~2 (contenu) **∥** progression | **1** (progression seule, contenu en cache) |
| **Learn** | 4 en série | ~2 (contenu) **∥** progression | **1** (progression seule) |
| **Stats** | 3 en série | **1** (3 en parallèle) | **1** |

*(Le rafraîchissement du profil en arrière-plan continue de tourner en parallèle, il n'ajoute pas d'attente visible.)*

👉 En navigation normale (contenu déjà en cache), chaque page ne fait plus **qu'un seul aller-retour** (la progression). Les squelettes deviennent quasi imperceptibles.

---

## 🔒 Ce qui NE change pas (garanties)

1. **Déverrouillage des mondes** : les fonctions `getEtatChapitre` / `getEtatNiveau` / `niveauEstDebloque` et le calcul de la « leçon suivante » reçoivent **exactement les mêmes données** qu'avant (chapitres + leçons de la langue, progression fraîche). Seule la **façon d'obtenir** ces données change (cache + parallèle), pas leur contenu.
2. **Progression toujours fraîche** : jamais mise en cache — rechargée à chaque visite. XP et déverrouillage restent justes.
3. **Fin de leçon** : met à jour la progression (rechargée) et le profil (`refreshProfil`) → dashboard à jour au retour.

---

## ⚠️ Points délicats (signalés)

1. **Stats garde ses requêtes exactes (même le quirk).**
   Sa requête `chapitres.eq('langue_id', profil.langue_id)` compare un **code** (`'en'`) à une colonne **UUID** → elle renvoie **toujours vide** aujourd'hui, ce qui fige le niveau affiché. C'est le comportement **actuel en production**.
   👉 Pour respecter « ne change rien au calcul de progression », je **garde les requêtes de Stats identiques** (je les parallélise seulement). Je **ne** la branche **pas** sur le contenu corrigé du cache, car ça **changerait le niveau affiché**. Si tu veux corriger ce quirk (afficher le vrai niveau), ce sera une **tâche séparée** à valider exprès.

2. **Contenu figé le temps de la session.**
   Si le contenu pédagogique est modifié côté base pendant qu'un enfant est connecté, il ne le verra qu'à la reconnexion. C'est voulu (« chargé une fois par session »).

3. **Cohérence langue.**
   Le contenu est mémorisé **par code de langue**. Le changement de langue recharge le bon contenu ; la déconnexion vide tout. Je testerai les deux.

---

## 🧭 Ordre d'application (étape 2, après ton OK)
1. Créer `src/context/ContenuContext.jsx` (cache par langue + `chargerContenu` + vidage à la déconnexion).
2. L'imbriquer dans `main.jsx`.
3. **Dashboard** : remplacer la cascade par `chargerContenu(code)` **∥** progression, calcul inchangé.
4. **Learn** : idem (contenu en cache **∥** progression), déverrouillage inchangé.
5. **Stats** : paralléliser ses 3 requêtes (identiques), progression fraîche.

### Tests prévus
- Navigation **Accueil → Apprendre → Progression → Boutique** en aller-retour : fluide, quasi sans squelette après la 1re visite.
- **Changement de langue** : recharge bien le contenu de la nouvelle langue (mondes corrects).
- **Fin de leçon** : XP et déverrouillage à jour.
- **Déconnexion** : le contenu mémorisé est vidé (pas de fuite entre comptes).
- **Déverrouillage des mondes** : identique à avant (vérifié sur données réelles).
- `npm run build` OK.

---

## ✋ STOP — En attente de ta validation

Si tu es d'accord, j'applique le plan dans l'ordre ci-dessus (contexte dédié `ContenuContext` + parallélisation), sans toucher aux pages parent ni au calcul de progression/déverrouillage. Puis je teste, commit/push, vérifie Vercel, et j'écris `notes/rapport-cache-contenu.md`.

**Une question pour toi** : d'accord pour le **contexte dédié** `ContenuContext` (ma reco) plutôt que d'étendre `ProfilContext` ? Et confirmes-tu que je **laisse le quirk de Stats tel quel** (point délicat n°1) ?
