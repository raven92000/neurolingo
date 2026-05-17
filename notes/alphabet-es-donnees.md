# Rapport — Activation du mode riche pour l'alphabet espagnol

## ✅ Résultat

L'alphabet espagnol est maintenant rempli dans `src/data/alphabetData.js` avec **27 entrées** (A-Z + Ñ entre N et O). La page `/alphabet` bascule automatiquement en **mode riche** (cartes lettre + image + mot) quand la langue active est l'espagnol.

## 📁 Fichier modifié

| Fichier | Action |
|---|---|
| `src/data/alphabetData.js` | Remplacement du tableau `es: []` par 27 entrées |

Aucun autre fichier touché. Aucun code logique modifié.

## 🔧 Détail

Les 27 entrées suivent l'ordre alphabétique espagnol standard :
- A, B, C, D, E, F, G, H, I, J, K, L, M, **N**, **Ñ**, O, P, Q, R, S, T, U, V, W, X, Y, Z

**Préservation des accents dans le champ `mot`** (affichage UI) :
- `Árbol`, `León`, `Niño`, `Ratón`, `Xilófono`, `Yoyó`

**Noms de fichiers sans accents** (évite les soucis d'encodage URL Supabase) :
- `arbol.png`, `leon.png`, `nino.png`, `raton.png`, `xilofono.png`, `yoyo.png`

L'URL Supabase est construite automatiquement par `getAlphabetImageUrl('es', nomImage)` → `…/lecons-images/alphabet/es/{nomImage}`.

## 🎯 Bascule automatique côté code

Aucune modif nécessaire dans `Alphabet.jsx` ni ailleurs : la logique conditionnelle existante détecte que `ALPHABET_DATA.es.length > 0` et passe en mode riche.

- Grille riche : 3 colonnes (calque sur l'anglais)
- 27 lettres → 9 lignes (la grille s'adapte naturellement)
- TTS : `'es-ES'` via le `TTS_MAP` déjà en place
- Voix : la page sélectionne automatiquement la première voix `es-*` du système

## ✔ Vérifications

- [x] **Lint** : `npm run lint` — aucun problème sur `alphabetData.js`
- [x] **27 entrées** dans l'ordre alphabétique espagnol (Ñ entre N et O)
- [x] **Accents préservés** dans les mots affichés
- [x] **Noms de fichiers sans accents** (cohérent avec la consigne et avec ce qui est déjà uploadé sur Supabase)
- [x] **`pt: []` toujours vide** (mode simple pour le portugais, à activer dans un sprint futur)
- [x] **Aucun autre fichier touché**

## 🧪 À tester (Wells)

1. `npm run dev`
2. Basculer la langue active sur **Espagnol** (via Settings ou flow d'onboarding)
3. Naviguer sur `/alphabet`
4. ✔ La grille doit afficher **27 cartes riches** (lettre violette en haut-gauche + image MidJourney détourée + mot espagnol)
5. ✔ La carte **Ñ** doit être présente entre N et O, avec l'image `nino.png` et le mot **Niño** (avec tilde)
6. ✔ Tap sur une carte → TTS en espagnol (`es-ES`) avec voix espagnole sélectionnée
7. ✔ Footer "27 lettres · Espagnol"
8. **Régression** : basculer en anglais → toujours les 26 cartes EN avec la même UX

## 🔮 Suite

- Activer le mode riche pour le portugais (`pt`) et l'allemand (`de`) : même pattern, remplir le tableau correspondant + uploader les images dans `lecons-images/alphabet/{code}/`
- Adapter l'Ex 2 ("Écoute et choisis") pour fonctionner aussi en espagnol — actuellement il pioche dans `ALPHABET_DATA.en` en dur, à généraliser à la langue active
- Adapter l'Ex 3 ("Chantons l'alphabet") avec une chanson en espagnol (couplets ajustés pour inclure Ñ)
