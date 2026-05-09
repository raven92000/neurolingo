# Plan — Fix affichage langue enfant + gestion d'erreur Supabase

## 🎯 Contexte

Dans le Dashboard Parent et la page "Mes enfants", la langue de l'enfant ne s'affiche jamais correctement : on voit toujours le fallback `🌍 Langue à définir`.

**Cause** : les requêtes Supabase qui chargent les enfants liés font `select('*')` sans join avec la table `langues`. Donc `enfant.langues` est toujours `undefined`, et les expressions `enfantActif?.langues?.nom` / `enfantActif?.langues?.emoji` retombent toujours sur le fallback.

**Effet de bord détecté** : dans le commit précédent, on a nettoyé certaines destructurations Supabase (suppression du `error:` inutilisé). Du coup, les erreurs réseau ou RLS échouent silencieusement → état figé sans message pour l'utilisateur. Il faut remettre une vraie gestion d'erreur, sur le même pattern que `chargerStatsEnfant` (try/catch + état d'erreur affiché).

**Fichiers concernés** :
- `src/pages/ParentDashboard.jsx`
- `src/pages/ChildrenPage.jsx`

---

## 📋 Modifications prévues

### Fichier 1 — `src/pages/ParentDashboard.jsx`

#### A. Fix du join langues (ligne ~117-120)

Remplacer :
```js
const { data: profilsEnfants } = await supabase
  .from('profils')
  .select('*')
  .in('user_id', childIds)
```

par :
```js
const { data: profilsEnfants, error: erreurEnfants } = await supabase
  .from('profils')
  .select('*, langues(code, nom, emoji)')
  .in('user_id', childIds)
if (erreurEnfants) throw erreurEnfants
```

→ Les lignes 189-190 (`enfantActif?.langues?.nom` + `enfantActif?.langues?.emoji`) sont déjà en place et fonctionneront correctement après ce fix, donc pas besoin d'y toucher.

#### B. Gestion d'erreur Supabase

- Ajouter un nouvel état `erreurChargement` (en plus de `erreurStats` qui reste réservé aux stats)
- Encapsuler tout le contenu de `charger()` dans un `try/catch`
- Récupérer `error` sur les **3 requêtes** :
  - profil parent (ligne ~96-97)
  - `parent_child_links` (ligne ~106-110)
  - profils enfants (ligne ~117-120)
- Throw l'erreur si présente, set `erreurChargement` dans le `catch`, et toujours appeler `setChargement(false)` dans un `finally`
- Afficher le message d'erreur dans un petit bandeau au-dessus de la carte enfant (même style que `erreurStats` : couleur `#FCA5A5`, fontFamily DM Sans, fontSize 13px)

**Pattern (inspiré de `chargerStatsEnfant`)** :
```js
try {
  setErreurChargement(null)
  // ... toutes les requêtes avec leurs vérifs d'erreur
} catch (error) {
  console.error('Erreur chargement Dashboard Parent', error)
  setErreurChargement('Impossible de charger tes données, réessaye plus tard')
} finally {
  setChargement(false)
}
```

#### C. Ce que je NE touche PAS

- La logique de `chargerStatsEnfant` (déjà bien gérée)
- Le rendu / la DA (fond `#090E1A`, glow violet, cartes arrondies)
- Toute autre partie du fichier

---

### Fichier 2 — `src/pages/ChildrenPage.jsx`

#### A. Fix du join langues (ligne ~45-46)

Remplacer :
```js
const { data: profilsEnfants } = await supabase
  .from('profils').select('*').in('user_id', childIds)
```

par :
```js
const { data: profilsEnfants, error: erreurEnfants } = await supabase
  .from('profils').select('*, langues(code, nom, emoji)').in('user_id', childIds)
if (erreurEnfants) throw erreurEnfants
```

#### B. Affichage de la langue dans la carte enfant

Ajouter une petite ligne discrète sous le nom (ou juste à côté de l'âge), au format `🇬🇧 Anglais`, sobre, dans la même DA que le reste de la carte (gris `rgba(255,255,255,0.5)`, font-size 12px, DM Sans). Affichage **conditionnel** : seulement si `enfant.langues?.code` est rempli.

Position envisagée : juste sous "X ans", avant la mini barre XP.

#### C. Gestion d'erreur

- Ajouter un état `erreurChargement`
- Encapsuler le contenu du `useEffect` dans un try/catch
- Récupérer `error` sur les 3 requêtes (profil, liens, enfants)
- Afficher l'erreur dans un bandeau au-dessus de la liste, même style que dans le Dashboard Parent

---

## ✅ Validations finales prévues

1. `npm run lint` — vérifier 0 nouveau warning
2. `npm run dev` — vérifier démarrage sans crash
3. Imports propres, pas de `console.log` oubliés (sauf `console.error` dans les catch, justifiés)

### Test visuel pour Wells

- Se connecter en parent
- Aller sur le **Dashboard Parent** → la carte enfant doit afficher le vrai drapeau + nom de langue (ex : `🇬🇧 Anglais en apprentissage`) au lieu de `🌍 Langue à définir`
- Aller sur **Mes enfants** → chaque carte enfant doit afficher la langue (drapeau + nom) si elle est définie
- **Pré-requis BDD** : l'enfant testé doit avoir un `langue_id` renseigné dans la table `profils`. Si tu vois encore le fallback malgré le fix, c'est que `langue_id` est NULL pour cet enfant côté BDD — pas un bug du code.
- **Test négatif** : si tu coupes ta connexion réseau ou simules une erreur, un bandeau rouge "Impossible de charger tes données…" doit s'afficher au lieu d'un état figé

---

## ❓ Question ouverte avant exécution

**Constantes mortes dans `ParentDashboard.jsx` (lignes 8-9)** :

```js
const DRAPEAUX = { en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹' }
const NOMS_LANGUES = { en: 'Anglais', es: 'Espagnol', de: 'Allemand', pt: 'Portugais' }
```

Ces deux constantes ne sont **jamais référencées** ailleurs dans le fichier. Probablement un reliquat d'un ancien fallback hardcodé qui aurait été remplacé par le join `langues`.

Trois options :

1. **Les laisser intactes** — strictement aucun refacto hors sujet (option par défaut, conforme à ta consigne "pas de refacto autre")
2. **Les supprimer** — code mort directement lié au sujet (les langues), 2 lignes en moins, plus propre
3. **Les garder comme fallback** — utiliser `DRAPEAUX[enfant.langues?.code]` si `enfant.langues?.emoji` est NULL côté BDD (utile car aujourd'hui l'emoji est souvent NULL dans la table `langues` d'après le CLAUDE.md)

**Mon avis** : option **3** serait la plus utile fonctionnellement (couvre le cas où la BDD n'a pas encore d'emoji). Mais elle dépasse légèrement le scope. Option **2** par défaut sinon. Dis-moi ce que tu préfères.

---

## 🚫 Hors scope (rappel)

- Pas de refacto autre
- Pas de modif sur les autres fichiers
- Pas de changement de DA
- Pas de commit Git

---

## 📝 Livrable final

À la fin de l'exécution, écriture d'un résumé partageable dans `notes/fix-langues-parent.md` avec :
- Modifs faites par fichier
- Effets de bord éventuels
- Comment tester visuellement
- Warnings ou points d'attention
