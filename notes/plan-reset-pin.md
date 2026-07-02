# 🔑 Plan — Masquer le code PIN + bouton « Réinitialiser le PIN »

> À lire avant toute modification. Rédigé en langage simple.
> Analyse réalisée le 2 juillet 2026. **Aucune modification appliquée à ce stade.**
> Fait suite à : `notes/rapport-audit-complet.md` (S2) et `notes/plan-rls-securite.md` (Action 2).
> Décision de Wells : un parent **ne revoit jamais** un PIN oublié → il en **crée un nouveau**.

---

## 1. Comment fonctionne la connexion enfant aujourd'hui (le point clé)

Dans [src/utils/childAuth.js](../src/utils/childAuth.js) :
- **Faux email** de connexion = `login@neurolingo.internal` → construit **uniquement à partir du login** (ex. `matheo_08`).
- **Mot de passe** Supabase = `pin_login_PIN` (ex. `pin_matheo_08_1234`) → **contient le PIN**.

👉 **Conséquence importante :** changer le PIN = changer **le mot de passe** du compte Supabase de l'enfant. **Le faux email ne change pas** (il ne dépend que du login). C'est une bonne nouvelle : pas besoin de toucher à l'email, donc la connexion reste stable.

### ⚠️ Le vrai obstacle technique
Pour changer le mot de passe d'un compte Supabase, il y a normalement 2 façons :
1. `supabase.auth.updateUser({ password })` — mais ça ne change que le mot de passe de **l'utilisateur connecté**. Or ici c'est le **parent** qui est connecté, pas l'enfant. ❌
2. L'API « admin » — mais elle exige la **clé secrète service_role**, qu'on ne doit **jamais** mettre côté navigateur. ❌

Et comme le parent a **oublié** le PIN, on ne peut pas non plus « se connecter en tant qu'enfant » pour changer le mot de passe (on n'a pas l'ancien PIN). ❌

**Il faut donc une solution côté base de données.** J'en ai vérifié une, propre et sûre (voir ci-dessous).

---

## 2. Où le champ `code_pin` est lu / écrit dans le code

- **Écrit : 1 seul endroit** → [ParentCreateChild.jsx:240](../src/pages/ParentCreateChild.jsx#L240) (à la création de l'enfant).
- **Lu : nulle part.** Le champ `code_pin` n'est jamais relu par l'application (le vrai mot de passe est géré, haché, par Supabase Auth).

👉 **La colonne `code_pin` ne sert donc à rien d'utile.** Elle ne fait que créer un risque. On peut la **supprimer**.

### Les `select('*')` sur `profils` à corriger (7 fichiers)
Ces requêtes ramènent **toutes** les colonnes, donc aussi `code_pin` :
[Profile.jsx:26](../src/pages/Profile.jsx#L26), [Stats.jsx:103](../src/pages/Stats.jsx#L103), [ParentDashboard.jsx:114](../src/pages/ParentDashboard.jsx#L114), [Dashboard.jsx:184](../src/pages/Dashboard.jsx#L184), [ParentSettings.jsx:15](../src/pages/ParentSettings.jsx#L15), [Settings.jsx:294](../src/pages/Settings.jsx#L294), [Shop.jsx:176](../src/pages/Shop.jsx#L176).

---

## 3. Le plan proposé (3 parties)

### 🟩 Partie 1 — Remplacer les `select('*')` par des colonnes explicites (sans `code_pin`)
Pour chacun des 7 fichiers, je remplace `select('*')` par la liste des colonnes **réellement utilisées** par cette page, en **excluant `code_pin`**.
- ✅ Sûr : chaque page reçoit exactement les données dont elle a besoin.
- ✅ Bonus performance (moins de données transférées).
- 🔎 Je **teste chaque écran** après (Profil, Stats, Dashboard, Réglages, Boutique, Dashboard parent, Réglages parent) pour être sûr que rien ne manque.
- 💡 En cas de doute sur une page, je prends une liste large (toutes les colonnes **sauf `code_pin`**) plutôt que de risquer un oubli.

**Cette partie doit être faite AVANT la Partie 3** (sinon supprimer/verrouiller `code_pin` casserait les `select('*')`).

### 🟩 Partie 2 — Le bouton « Réinitialiser le PIN » (page détail enfant)

**Côté base (le cœur du système) :** une fonction sécurisée `reset_child_pin`, que l'application appelle simplement. Elle :
1. vérifie que la personne connectée est bien **un parent lié à cet enfant** (sinon refus) ;
2. vérifie que le nouveau PIN fait bien **4 chiffres** ;
3. reconstruit le mot de passe `pin_LOGIN_NOUVEAUPIN` à partir du login **déjà stocké** de l'enfant ;
4. met à jour le mot de passe du compte enfant (haché en bcrypt, exactement comme Supabase).

```sql
create or replace function public.reset_child_pin(p_child uuid, p_new_pin text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare v_login text;
begin
  -- 1. La personne connectée est-elle un parent lié à cet enfant ?
  if not exists (
    select 1 from public.parent_child_links l
    join public.profils pp on pp.user_id = auth.uid() and pp.role = 'parent'
    where l.parent_id = auth.uid() and l.child_id = p_child
  ) then
    raise exception 'Non autorisé';
  end if;

  -- 2. PIN valide (4 chiffres)
  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN invalide';
  end if;

  -- 3. Reconstruire le mot de passe à partir du login stocké
  select identifiant_login into v_login from public.profils where user_id = p_child;
  if v_login is null then raise exception 'Enfant introuvable'; end if;

  -- 4. Mettre à jour le mot de passe Supabase de l'enfant
  update auth.users
     set encrypted_password = extensions.crypt('pin_' || v_login || '_' || p_new_pin,
                                                extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_child;
end;
$$;

revoke all on function public.reset_child_pin(uuid, text) from public, anon;
grant execute on function public.reset_child_pin(uuid, text) to authenticated;
```

**Côté application :** un simple appel
```javascript
await supabase.rpc('reset_child_pin', { p_child: userId, p_new_pin: nouveauPin })
```

**Côté interface :** une nouvelle petite fenêtre `ResetPinModal.jsx` dans `src/pages/ChildDetail/`, ouverte par un bouton **« Réinitialiser le PIN »** ajouté dans [ChildDetailActions.jsx](../src/pages/ChildDetail/ChildDetailActions.jsx) (à côté de « Modifier le profil » / « Délier »). Le parent saisit le nouveau PIN (4 chiffres) + confirmation, on appelle la fonction, et un message « PIN réinitialisé ✓ » s'affiche. Design conforme à la DA (fond `#090E1A`, violet, cartes arrondies), même style que les modales existantes.

#### ✅ Pourquoi cette approche est la bonne
- **Aucune clé secrète exposée** : tout passe par une fonction contrôlée côté base ; le navigateur n'a que la clé publique habituelle.
- **Pas de nouveau service à déployer** (pas d'Edge Function, pas de configuration côté serveur à faire de ton côté).
- **Le PIN n'a jamais besoin d'être relu** : on l'écrase, on ne le lit pas.

#### ⚠️ Le point à signaler honnêtement (à valider par toi)
Cette fonction écrit directement dans la table interne `auth.users` de Supabase (celle qui gère les mots de passe). J'ai **vérifié** que ça fonctionne : Supabase utilise le hachage bcrypt (`$2a$…`), et la fonction produit exactement ce format. C'est une technique connue et fiable, **mais** elle s'appuie sur un détail interne de Supabase. Si un jour Supabase change sa façon de stocker les mots de passe (rare), il faudrait re-tester cette fonction.

➡️ **Alternative « plus officielle »** si tu préfères ne pas toucher `auth.users` : une **Edge Function** Supabase utilisant la clé service_role. C'est plus « dans les règles », **mais** ça demande de déployer une fonction serveur et de **configurer un secret côté Supabase toi-même** (je ne peux pas manipuler cette clé). Plus lourd. **Ma recommandation : la fonction base ci-dessus** (plus simple, sûre, rien à configurer de ton côté).

### 🟩 Partie 3 — Rendre `code_pin` inaccessible (Action 2 du plan RLS)
Une fois la Partie 1 terminée et testée (plus aucun `select('*')` sur `profils`), deux options :

- **Option recommandée — Supprimer la colonne** (elle ne sert à rien) :
  ```sql
  alter table public.profils drop column code_pin;
  ```
  + retirer la ligne `code_pin: codePin` dans [ParentCreateChild.jsx:240](../src/pages/ParentCreateChild.jsx#L240).
  → Le problème S2 disparaît **définitivement** (on ne peut pas fuiter ce qui n'existe plus).

- **Option prudente — Garder la colonne mais interdire sa lecture** :
  ```sql
  revoke select (code_pin) on public.profils from anon, authenticated;
  ```
  → Le champ reste en base mais devient illisible depuis l'app.

---

## 4. Risques et garde-fous

| Risque | Comment je l'évite |
|---|---|
| Casser la connexion des enfants existants | Le faux email ne change pas ; on ne touche au mot de passe **que** lors d'une réinitialisation explicite. Les comptes existants ne sont pas modifiés. |
| Un `select('*')` oublié plante après suppression de `code_pin` | Je fais la Partie 1 **avant** la Partie 3, et je teste chaque écran. |
| Un parent réinitialise le PIN de l'enfant d'un **autre** parent | La fonction vérifie le lien parent-enfant **et** le rôle `parent` (comme l'Action 1a déjà en place). |
| Nouveau PIN qui ne respecte pas le format | Validation « 4 chiffres » côté interface **et** côté fonction base. |
| Manipulation directe de `auth.users` | Vérifié compatible (bcrypt `$2a$`). Signalé ci-dessus ; alternative Edge Function possible si tu préfères. |

---

## 5. Ordre d'exécution proposé (étape 2, après ton OK)
1. **Partie 1** : remplacer les 7 `select('*')` + tester chaque écran.
2. **Partie 2** : créer la fonction `reset_child_pin` + la modale + le bouton, puis tester (voir plus bas).
3. **Partie 3** : supprimer la colonne `code_pin` (ou la verrouiller) + retirer l'écriture dans ParentCreateChild.

### Tests prévus
- Connexion enfant avec l'**ancien** PIN (avant reset) → OK.
- Le parent réinitialise le PIN depuis la page détail enfant → succès.
- Connexion enfant avec l'**ancien** PIN → **refusée** ; avec le **nouveau** PIN → **OK**.
- Vérifier que `code_pin` est **illisible** (ou supprimé) depuis l'app.
- Vérifier qu'un parent ne peut pas réinitialiser le PIN d'un enfant non lié (refus).

---

## ✋ STOP — En attente de ta validation

**Deux décisions à me confirmer :**
1. **Méthode de réinitialisation** : fonction base `reset_child_pin` (recommandée, rien à configurer) **ou** Edge Function service_role (plus « officielle », mais tu dois configurer un secret) ?
2. **`code_pin`** : **supprimer** la colonne (recommandé) **ou** juste la **verrouiller** en lecture ?

Dès ton OK, j'applique le plan dans l'ordre ci-dessus, je teste tout, et j'écris `notes/rapport-reset-pin.md`.
