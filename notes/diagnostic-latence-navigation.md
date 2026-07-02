# 🔬 Diagnostic — Latence de navigation (squelettes de plusieurs secondes)

> Diagnostic chiffré réalisé le 2 juillet 2026. **Lecture + mesures uniquement, aucune correction appliquée.**
> Constat de Wells : sur téléphone (Paris) en production, chaque changement d'onglet montre les blocs gris pendant quelques secondes.

---

## 📏 Mesures effectuées

### 1. Région du serveur Supabase ⚠️
- **Projet NeuroLingo (`mpdobvqulzbtvtdfeahf`) : région `eu-west-1` = Irlande.**
- Ton autre projet (Raven CRM) est en `eu-west-3` = **Paris**. Donc une région proche est disponible.
- Utilisatrice : **Paris**. → Chaque requête fait un aller-retour **Paris ↔ Irlande** au lieu de rester à Paris.

### 2. Latence réseau réelle par requête (mesurée en direct sur l'API REST)
| Requête | 1er appel (à froid) | Appels suivants (à chaud) |
|---|---|---|
| `langues` | **1,03 s** | ~0,24–0,29 s |
| `progression` | — | ~0,24–0,30 s |
| `chapitres` / `lecons` | — | ~0,24–0,29 s |

→ **Chaque aller-retour ≈ 250 ms à chaud, et ~1 s pour le tout premier** (poignée de main TLS). Sur **mobile** (radio 4G/5G qui se réveille, signal variable), le premier appel après une pause peut monter à **1–3 s**.

### 3. Temps d'exécution côté base de données
- Requête progression (avec RLS active, sur un vrai enfant) : **1,4 ms** (planification + exécution).
- **Conclusion : la base est instantanée. Les ~250 ms sont à 100 % du réseau** (trajet client ↔ Irlande), pas du calcul.

### 4. Instrumentation `console.time` ajoutée (temporaire)
J'ai ajouté des mesures par étape dans Dashboard, Learn et Stats (marquées `// DIAGNOSTIC TEMPORAIRE — À RETIRER`) : `[DIAG] … contenu`, `[DIAG] … progression`, `[DIAG] … total`.
👉 **À faire par toi sur ton téléphone** (Chrome → outils dev → Console, ou en te connectant sur le mobile) : navigue Accueil → Apprendre → Progression et lis les nombres. Attendu :
- `contenu` : **~0 ms** dès la 2ᵉ visite (cache OK).
- `progression` : **le temps réseau réel de ton mobile** (c'est LUI qui bloque le squelette).
- Ces mesures **seront retirées avant tout commit** (étape 2).

---

## 🎯 Causes réelles identifiées

### Cause n°1 (principale) — Le squelette **bloque** sur la requête progression, à **chaque** navigation
Le cache contenu fonctionne (chapitres/leçons ne sont plus rechargés). **Mais** chaque page attend la requête **progression fraîche** avant d'afficher quoi que ce soit :
- **Learn** ([Learn.jsx](../src/pages/Learn.jsx)) : `chargement` démarre à `true` à chaque montage → **squelette plein écran** jusqu'au retour de la progression.
- **Stats** ([Stats.jsx](../src/pages/Stats.jsx)) : idem, `chargementDonnees` à `true` → squelette plein écran jusqu'au retour des requêtes.
- **Dashboard** ([Dashboard.jsx](../src/pages/Dashboard.jsx)) : l'en-tête s'affiche vite (profil en mémoire), mais la carte « leçon suivante » reste en squelette jusqu'au retour de la progression.

→ **Chaque changement d'onglet = au moins 1 aller-retour réseau bloquant (~250 ms à chaud, 1–3 s sur mobile à froid).** C'est ce que Wells voit comme « plusieurs secondes de squelettes ».

Le squelette s'affiche donc **systématiquement**, même quand on pourrait montrer la dernière progression connue. Un squelette qui ne dure que le temps d'un aller-retour lent = très visible sur mobile.

### Cause n°2 (aggravante) — Serveur en Irlande, utilisatrice à Paris
Chaque aller-retour traverse Paris ↔ Irlande. Ça n'explique pas « plusieurs secondes » à soi seul, mais **ça alourdit chaque requête** (et surtout le premier appel à froid). Une base à Paris réduirait la latence de **chaque** requête.

### Cause n°3 (mineure) — Une requête de plus par page
Chaque page relance aussi `refreshProfil()` (une requête profil) en plus de la progression. Elle ne bloque pas le squelette (elle tourne en arrière-plan), mais c'est un 2ᵉ aller-retour à chaque navigation.

---

## 🛠️ Corrections proposées (classées par gain)

### 🥇 Correction 1 — « Afficher tout de suite, rafraîchir en arrière-plan » pour la progression (RECOMMANDÉ)
Exactement la piste que tu proposes. On mémorise la **dernière progression connue** (par utilisateur) dans une mémoire partagée, comme le profil. À chaque navigation :
- la page s'affiche **immédiatement** avec la dernière progression connue (mondes déverrouillés + leçon suivante d'après la dernière visite),
- en même temps, on **revérifie** la progression en arrière-plan (sans squelette) ; si elle a changé, l'affichage se met à jour tout seul.
- Le squelette n'apparaît **que** la toute première fois (quand on n'a encore rien).

**Gain : supprime le squelette bloquant sur TOUTES les navigations suivantes.** La navigation devient instantanée, quelle que soit la latence réseau.
**Risque : faible.** Le déverrouillage peut être « en retard » de quelques centaines de ms (dernière valeur connue) puis se corrige tout seul, silencieusement. XP/déverrouillage restent justes (on revérifie systématiquement). À valider : c'est un léger changement de principe (« la progression peut être affichée périmée 250 ms »), mais c'est ce que tu proposes.

### 🥈 Correction 2 — Ne montrer le squelette que s'il n'y a **rien** à afficher
En complément de la 1 : ne pas remettre `chargement = true` quand on a déjà des données à l'écran. Évite le clignotement « contenu → squelette → contenu » lors d'un simple rafraîchissement.
**Gain : moyen (confort visuel).** **Risque : très faible.** (Largement couvert par la correction 1.)

### 🥉 Correction 3 — Rapprocher la base de données (Irlande → Paris)
Migrer le projet Supabase en région Paris (`eu-west-3`) réduit la latence de **chaque** requête (~15–40 ms + meilleur routage mobile), et surtout le premier appel à froid.
**Gain : réel mais modéré**, et **la correction 1 rend déjà la plupart des requêtes invisibles**.
**⚠️ Risque / coût élevé :** on **ne peut pas changer la région** d'un projet existant. Il faut **créer un nouveau projet à Paris + migrer toutes les données** (profils, progression, contenu) + changer l'URL/clé dans le code. Opération lourde, à planifier à part (avec sauvegarde et fenêtre de bascule). **À ne PAS faire dans le même sprint.**

### Correction 4 (mineure) — Éviter la requête `refreshProfil()` redondante
Combiner le rafraîchissement du profil avec le reste, ou l'espacer. **Gain faible** (ne bloque pas le squelette). Basse priorité.

---

## ✅ Ma recommandation
Faire **Correction 1** (+ 2 qui vient avec) : c'est le vrai levier, faible risque, et ça rend la navigation instantanée même avec le serveur en Irlande. Garder **Correction 3** (migration Paris) comme chantier séparé à décider plus tard. Ignorer 4 pour l'instant.

---

## ✋ STOP — En attente de ton feu vert
Dis-moi si tu valides la **Correction 1** (progression « affiche tout de suite, rafraîchis en arrière-plan »). Dès ton OK :
1. Je **retire l'instrumentation `console.time`** (les 11 lignes marquées `DIAGNOSTIC TEMPORAIRE`).
2. J'applique la correction (mémoire de la dernière progression + revalidation en arrière-plan), sans toucher au calcul de déverrouillage.
3. Je teste (navigation fluide, fin de leçon → XP/déverrouillage à jour, déconnexion vide tout, build OK), puis commit/push + Vercel + rapport.

Souhaites-tu aussi que je te prépare, à part, le plan de **migration vers Paris** (Correction 3) ?
