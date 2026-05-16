// Données alphabet par langue.
// Ajouter une langue : remplir son tableau ici puis uploader les images
// dans Supabase Storage (bucket lecons-images, dossier alphabet/<code>/).
//
// Tant qu'un tableau est vide, le composant Alphabet retombe en mode
// "grille simple" (juste les lettres) sur la langue concernée.

export const ALPHABET_DATA = {
  en: [
    { lettre: 'A', mot: 'Apple',     image: 'a.png' },
    { lettre: 'B', mot: 'Bee',       image: 'b.png' },
    { lettre: 'C', mot: 'Cat',       image: 'c.png' },
    { lettre: 'D', mot: 'Dog',       image: 'd.png' },
    { lettre: 'E', mot: 'Elephant',  image: 'e.png' },
    { lettre: 'F', mot: 'Frog',      image: 'f.png' },
    { lettre: 'G', mot: 'Guitar',    image: 'g.png' },
    { lettre: 'H', mot: 'Hat',       image: 'h.png' },
    { lettre: 'I', mot: 'Ice cream', image: 'i.png' },
    { lettre: 'J', mot: 'Jellyfish', image: 'j.png' },
    { lettre: 'K', mot: 'Key',       image: 'k.png' },
    { lettre: 'L', mot: 'Lion',      image: 'l.png' },
    { lettre: 'M', mot: 'Moon',      image: 'm.png' },
    { lettre: 'N', mot: 'Nest',      image: 'n.png' },
    { lettre: 'O', mot: 'Orange',    image: 'o.png' },
    { lettre: 'P', mot: 'Panda',     image: 'p.png' },
    { lettre: 'Q', mot: 'Queen',     image: 'q.png' },
    { lettre: 'R', mot: 'Rainbow',   image: 'r.png' },
    { lettre: 'S', mot: 'Sun',       image: 's.png' },
    { lettre: 'T', mot: 'Tomato',    image: 't.png' },
    { lettre: 'U', mot: 'Umbrella',  image: 'u.png' },
    { lettre: 'V', mot: 'Van',       image: 'v.png' },
    { lettre: 'W', mot: 'Whale',     image: 'w.png' },
    { lettre: 'X', mot: 'Xylophone', image: 'x.png' },
    { lettre: 'Y', mot: 'Yo-yo',     image: 'y.png' },
    { lettre: 'Z', mot: 'Zebra',     image: 'z.png' },
  ],
  de: [],
  es: [],
  pt: [],
}

const STORAGE_BASE_URL =
  'https://mpdobvqulzbtvtdfeahf.supabase.co/storage/v1/object/public/lecons-images/alphabet'

export function getAlphabetImageUrl(codeLangue, nomImage) {
  if (!codeLangue || !nomImage) return null
  return `${STORAGE_BASE_URL}/${codeLangue}/${nomImage}`
}
