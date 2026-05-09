# Audit — Usages de `langue_id` dans le code source

**Date** : 2026-05-09
**Périmètre** : `src/` uniquement
**Mission** : repérer toutes les références à la colonne `profils.langue_id` (et patterns associés) avant un éventuel renommage en `langue_code`.

---

## ⚠️ Distinction importante en amont

Le nom **`langue_id`** existe dans **DEUX tables différentes** dans la BDD Supabase :

| Table | Colonne | Rôle |
|---|---|---|
| `profils` | `langue_id` | langue choisie par l'utilisateur (FK → `langues.id`) |
| `chapitres` | `langue_id` | langue à laquelle appartient un chapitre (FK → `langues.id`) |

➡️ **Si tu renommes `profils.langue_id` en `profils.langue_code`, il faut bien NE PAS toucher aux usages de `chapitres.langue_id`**, qui sont nombreux dans les requêtes filtrant les chapitres par langue.

Toutes les occurrences ci-dessous sont classées en conséquence.

---

## 📋 Détail par occurrence (13 lignes au total)

### 🟢 Références à `profils.langue_id` (à modifier en cas de renommage)

#### 1. `src/pages/Stats.jsx:111`
```js
if (p?.langue_id) {
```
**Contexte** : `p` est l'objet profil chargé via `from('profils').select('*')` ligne 103.
**Type** : lecture JS de la colonne profils.langue_id.

#### 2. `src/pages/Stats.jsx:112`
```js
const res = await supabase.from('chapitres').select('id, numero').eq('langue_id', p.langue_id)
```
**Contexte** : ligne ambiguë :
- Le 1er paramètre `'langue_id'` cible la colonne **`chapitres.langue_id`** (filter target). À NE PAS renommer.
- Le 2e paramètre `p.langue_id` lit la colonne **`profils.langue_id`** (valeur). À renommer.

#### 3. `src/pages/ParentDashboard.jsx:60`
```js
if (!enfant?.langue_id) {
```
**Contexte** : `enfant` est un profil enfant (ligne 51, fonction `chargerStatsEnfant`).
**Type** : lecture JS de profils.langue_id.

#### 4. `src/pages/ParentDashboard.jsx:66`
```js
.from('chapitres').select('id, numero').eq('langue_id', enfant.langue_id)
```
**Contexte** : même structure que Stats.jsx:112.
- Param 1 `'langue_id'` → chapitres.langue_id (NE PAS renommer)
- Param 2 `enfant.langue_id` → profils.langue_id (à renommer)

#### 5. `src/pages/ParentDashboard.jsx:264`
```jsx
{enfantActif?.langue_id && (
```
**Contexte** : condition JSX qui n'affiche le bloc "langue en apprentissage" que si l'enfant a une langue définie.
**Type** : lecture JS de profils.langue_id.

#### 6. `src/pages/Onboarding.jsx:492`
```js
await supabase.from('profils').update({
  ...
  langue_id: langue,
  ...
}).eq('user_id', user.id)
```
**Contexte** : sauvegarde du profil à la fin de l'onboarding.
**Type** : **WRITE** sur profils.langue_id.

⚠️ **Attention bug latent existant** : la valeur écrite (`langue`) est définie ligne 478 comme `useState(null)` puis assignée via `setLangue(l.code)` ligne 343 — donc on stocke un **code** (`'en'`, `'es'`...) dans une colonne nommée `langue_id` qui est censée contenir un **uuid** (FK vers `langues.id`). Soit la colonne accepte le code (auquel cas le nom `langue_id` est trompeur depuis le début), soit cette ligne ne fonctionne pas en prod et personne ne s'en est aperçu. À vérifier côté BDD.

#### 7. `src/pages/Learn.jsx:343`
```js
if (langue) await supabase.from('profils').update({ langue_id: langue.id }).eq('user_id', user.id)
```
**Contexte** : sauvegarde de la langue choisie via le modal de sélection.
**Type** : **WRITE** sur profils.langue_id (avec un vrai uuid `langue.id` cette fois).

#### 8. `src/pages/Dashboard.jsx:188`
```js
if (p?.langue_id) {
```
**Contexte** : `p` est l'objet profil chargé ligne 184.
**Type** : lecture JS de profils.langue_id.

#### 9. `src/pages/Dashboard.jsx:189`
```js
const { data: langueUser } = await supabase.from('langues').select('code').eq('id', p.langue_id).single()
```
**Contexte** : le filtre `.eq('id', ...)` cible **`langues.id`** (pas une colonne `langue_id`). Mais la valeur passée `p.langue_id` est lue depuis profils.
**Type** : lecture de profils.langue_id (en value uniquement, le `'id'` ici n'est PAS un usage de langue_id).

---

### 🔴 Références à `chapitres.langue_id` (NE PAS toucher si renommage côté profils)

#### 10. `src/pages/Stats.jsx:112` (param 1) — voir #2 ci-dessus

#### 11. `src/pages/ParentDashboard.jsx:66` (param 1) — voir #4 ci-dessus

#### 12. `src/pages/Learn.jsx:317`
```js
const { data: chaps } = await supabase.from('chapitres').select('*').eq('langue_id', langue.id).order('numero')
```
**Contexte** : filtre les chapitres d'une langue précise. La valeur `langue.id` vient de la table `langues` (chargée ligne 314), pas de profils.
**Type** : usage exclusif de chapitres.langue_id.

#### 13. `src/pages/Dashboard.jsx:203`
```js
const { data: chapitres } = await supabase.from('chapitres').select('id').eq('langue_id', langue.id)
```
**Type** : usage exclusif de chapitres.langue_id.

#### 14. `src/pages/Dashboard.jsx:237`
```js
const { data: chapitres } = await supabase.from('chapitres').select('id').eq('langue_id', langue.id)
```
**Type** : usage exclusif de chapitres.langue_id (dans `handleContinuer`).

---

### 📝 Mention textuelle (commentaire)

#### 15. `src/utils/languages.js:4`
```js
// Pour ajouter une langue : ajouter une entrée ici, créer les chapitres
// dans Supabase avec le bon langue_id, puis passer disponible: true.
```
**Type** : commentaire — concerne `chapitres.langue_id` (pas profils).

---

## 🔗 Joins et alias Supabase liés

### `langues(...)` — joins via FK
Recherche `langues(` :

- **`src/pages/ParentDashboard.jsx:124`**
  ```js
  .select('*, langues(code, nom, emoji)')
  ```
- **`src/pages/ChildrenPage.jsx:58`**
  ```js
  .select('*, langues(code, nom, emoji)')
  ```

Ces deux joins sont sur la table `profils` (pour récupérer la langue de l'enfant lié au profil). Ils dépendent **implicitement de la FK `profils.langue_id → langues.id`**.

➡️ Si tu renommes `profils.langue_id` en `profils.langue_code` côté BDD :
- La FK doit être recréée (drop + add) avec le nouveau nom de colonne.
- Tant que la FK existe et est active, Supabase continue de résoudre `langues(...)` → **pas de modif de code nécessaire sur ces deux lignes**.
- ⚠️ MAIS si tu changes aussi le type de la colonne (uuid → text), il faut migrer les données et la FK référencera `langues.code` au lieu de `langues.id`. Là aussi, le join Supabase continuera à marcher tant que la FK est valide.

### Alias `langues:` dans des selects
Recherche `langues:` : **0 occurrence**. Aucun alias explicite, c'est uniquement le join automatique par nom de table.

---

## 📊 Résumé compact

### Fichiers concernés : **6 fichiers** dans `src/pages/` + **1 fichier** dans `src/utils/` = **7 fichiers**

| Fichier | Lignes profils.langue_id | Lignes chapitres.langue_id | Joins langues(...) |
|---|---|---|---|
| `src/pages/Stats.jsx` | 111, 112 (param 2) | 112 (param 1) | — |
| `src/pages/ParentDashboard.jsx` | 60, 66 (param 2), 264 | 66 (param 1) | 124 |
| `src/pages/Onboarding.jsx` | 492 (write) | — | — |
| `src/pages/Learn.jsx` | 343 (write) | 317 | — |
| `src/pages/Dashboard.jsx` | 188, 189 (param 2) | 203, 237 | — |
| `src/pages/ChildrenPage.jsx` | — | — | 58 |
| `src/utils/languages.js` | — | 4 (commentaire) | — |

### Liste compacte fichier:ligne — **profils.langue_id uniquement**
```
src/pages/Stats.jsx:111
src/pages/Stats.jsx:112
src/pages/ParentDashboard.jsx:60
src/pages/ParentDashboard.jsx:66
src/pages/ParentDashboard.jsx:264
src/pages/Onboarding.jsx:492 (WRITE)
src/pages/Learn.jsx:343 (WRITE)
src/pages/Dashboard.jsx:188
src/pages/Dashboard.jsx:189
```

→ **9 lignes** dans **5 fichiers** à modifier en cas de renommage `profils.langue_id` → `profils.langue_code`.

### Liste compacte fichier:ligne — **chapitres.langue_id (à NE PAS renommer)**
```
src/pages/Stats.jsx:112 (param 1)
src/pages/ParentDashboard.jsx:66 (param 1)
src/pages/Learn.jsx:317
src/pages/Dashboard.jsx:203
src/pages/Dashboard.jsx:237
src/utils/languages.js:4 (commentaire)
```

---

## 🚨 Risques d'oubli si on renomme `profils.langue_id` en `profils.langue_code`

### 1. Confusion entre les deux tables (HAUT)
Les lignes Stats.jsx:112 et ParentDashboard.jsx:66 contiennent **les deux usages dans la même expression** :
```js
.from('chapitres').eq('langue_id', enfant.langue_id)
//                    ^^^^^^^^^      ^^^^^^^^^^^^^^^^
//                    chapitres      profils → renommer en langue_code
```
Un grep/replace global `langue_id` → `langue_code` casserait ces lignes en renommant aussi les références à `chapitres.langue_id`. **Il faut toucher uniquement le 2e paramètre.**

### 2. Writes silencieux (HAUT)
Deux writes existent :
- `Onboarding.jsx:492` — assigne `langue` (un code, pas un uuid !) ⚠️ comportement déjà suspect, à investiguer.
- `Learn.jsx:343` — assigne `langue.id` (un uuid).

Si le renommage s'accompagne d'un changement de type (uuid → text/code), les deux writes doivent être harmonisés pour passer le **code** (et non l'id). À ce moment-là, Onboarding.jsx:492 deviendrait correct par accident et Learn.jsx:343 devra être modifié pour passer `langue.code` au lieu de `langue.id`.

### 3. JOIN Supabase (MOYEN)
Les joins `langues(code, nom, emoji)` dans ParentDashboard.jsx:124 et ChildrenPage.jsx:58 fonctionnent grâce à la FK active. **Penser à recréer la FK** lors du renommage de colonne, sinon les joins échouent silencieusement (l'objet `langues` deviendra `null`) et le fix de langues qu'on vient juste de faire serait cassé.

### 4. Commentaire (FAIBLE)
`src/utils/languages.js:4` mentionne `langue_id` textuellement (concerne les chapitres). Pas critique mais à mettre à jour pour cohérence générale du vocabulaire.

### 5. JSX conditionnel (MOYEN)
`ParentDashboard.jsx:264` :
```jsx
{enfantActif?.langue_id && (
  <p>{drapeau} {nomLangue} en apprentissage</p>
)}
```
Si on oublie cette ligne lors du renommage, le bloc ne s'affichera plus jamais (`langue_id` deviendra `undefined` sur l'objet enfant). Test visuel critique : la ligne "🇬🇧 Anglais en apprentissage" doit toujours apparaître.

### 6. Variables locales `codeLangue` (FAIBLE — pas un risque)
Plusieurs fichiers utilisent une variable locale `codeLangue` (Dashboard.jsx, Learn.jsx, ParentDashboard.jsx, ChildrenPage.jsx). Ce sont des variables JS, **pas la colonne BDD**. Aucune modif nécessaire, juste à ne pas confondre.

---

## ✅ Recommandations

1. **Ne PAS faire un `sed -i 's/langue_id/langue_code/g'` aveugle** — ça casserait les usages de `chapitres.langue_id`.
2. **Préférer un renommage manuel ligne par ligne**, en utilisant la liste compacte ci-dessus comme checklist.
3. **Coordonner avec la migration SQL** : drop FK → rename column → recreate FK. Sinon les joins `langues(...)` du Dashboard Parent et de ChildrenPage tombent.
4. **Profiter du renommage pour fixer le bug latent** d'`Onboarding.jsx:492` (incohérence de type entre la valeur écrite et le type attendu de la colonne).
5. **Tests manuels post-renommage** :
   - Onboarding complet (write profil)
   - Choix de langue via le modal Learn (write profil)
   - Dashboard enfant (read profil)
   - Stats enfant (read profil)
   - Dashboard Parent — bandeau de langue (join + read)
   - ChildrenPage — affichage langue dans les cartes (join)
