# Rapport — Fix TTS Alphabet : un mot lu avant la lettre

## ✅ Résultat

Le bug est corrigé : au tap sur une carte, l'enfant entend désormais **uniquement la lettre**, plus aucun mot n'est annoncé avant.

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/pages/Alphabet.jsx` | 5 modifs locales d'accessibilité (1 dans `CarteSimple`, 4 dans `CarteRiche`) |

Aucun autre fichier touché. Aucun impact visuel. Aucun changement de comportement TTS (fonction `playLetter` non touchée).

---

## 🔧 Détail des changements

### Cause du bug (rappel)

Le `<button>` de `CarteRiche` n'avait pas d'`aria-label`. Son name accessible était donc concaténé à partir du contenu : `"A Apple Apple"` (span lettre + `alt` image + span mot). Lorsqu'un lecteur d'écran est actif (VoiceOver, TalkBack, NVDA — fréquent sur les appareils d'enfants neuroatypiques), il annonce ce name **avant** que notre `speak("A")` ne se déclenche.

### Modifications appliquées dans `CarteRiche`

```diff
 <button
+  aria-label={item.lettre}
   onClick={() => playLetter(item.lettre, codeLangue)}
   ...
 >
-  <span style={{ ...lettre violette ... }}>
+  <span aria-hidden="true" style={{ ...lettre violette ... }}>
     {item.lettre}
   </span>

   <LeconThumbnail
     imageUrl={imageUrl}
-    alt={item.mot}
+    alt=""
     fill objectFit="contain" borderRadius={0}
   />

-  <span style={{ ...mot ... }}>
+  <span aria-hidden="true" style={{ ...mot ... }}>
     {item.mot}
   </span>
 </button>
```

**Effet combiné** :
- `aria-label={item.lettre}` sur le button → le name accessible **devient exactement "A"** (ou "B", "C"…) et **override** tout le contenu.
- `alt=""` sur l'image → image considérée **décorative**, ignorée par les lecteurs d'écran.
- `aria-hidden="true"` sur les deux spans → garantie supplémentaire qu'ils ne polluent jamais le calcul du name accessible (défense en profondeur).

### Modification appliquée dans `CarteSimple` (défense en profondeur)

```diff
 <button
+  aria-label={lettre}
   onClick={() => playLetter(lettre, codeLangue)}
   ...
 >
   {lettre}
 </button>
```

Le bug ne se manifeste pas aujourd'hui sur `CarteSimple` (le bouton ne contient qu'un seul nœud texte, donc son name accessible vaut déjà "A"). Mais l'`aria-label` est ajouté pour **prévenir une régression future** : si plus tard on ajoute du contenu dans la carte simple (icône, badge…), le bug ne pourra pas réapparaître.

---

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur les fichiers touchés (les 15 problèmes préexistants sur d'autres pages sont inchangés).
- [x] **Fonction `playLetter()`** non modifiée → comportement TTS identique pour les utilisateurs sans lecteur d'écran.
- [x] **Aucun changement visuel** → la carte reste strictement identique à l'œil (lettre violette, image au centre, mot en bas).
- [x] **Cohérence des deux composants** : `CarteRiche` et `CarteSimple` ont maintenant tous deux un `aria-label` explicite.

---

## 🧪 À tester (Wells)

1. **Test principal — appareil avec lecteur d'écran activé** :
   - iOS : activer VoiceOver (Réglages → Accessibilité → VoiceOver, ou triple-clic latéral)
   - Android : activer TalkBack (Réglages → Accessibilité → TalkBack)
   - Macbook : activer VoiceOver (⌘ + F5)
   - → Naviguer vers la page Alphabet en anglais, taper sur la carte "A"
   - ✔ Doit entendre uniquement **"A"** annoncé par le lecteur d'écran, puis **"A"** prononcé par le TTS (plus de "Apple" parasite)

2. **Test régression — appareil sans lecteur d'écran** :
   - ✔ Taper sur la carte "A" → entendre uniquement "A" (comportement identique à avant)
   - ✔ Visuellement la carte est identique (lettre violette + image détourée + mot)

3. **Mode simple (ES/DE/PT)** :
   - ✔ Taper sur une lettre → entendre uniquement la lettre (inchangé)

---

## 💡 Bonus accessibilité

Au-delà du fix du bug TTS, ces changements **améliorent réellement l'expérience d'un enfant non-voyant** qui parcourt la page :

| Parcours avec lecteur d'écran | Avant | Après |
|---|---|---|
| Page Alphabet (26 cartes EN) | "A Apple Apple, B Bee Bee, C Cat Cat…" (bruyant, confus) | **"A, B, C, D…"** (cohérent avec la mission pédagogique : apprendre l'alphabet) |
