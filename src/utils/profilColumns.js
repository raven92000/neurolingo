// ─── COLONNES DE LA TABLE profils ───────────────────────────────────
// Liste explicite de toutes les colonnes de `profils` SAUF `code_pin`.
//
// Pourquoi ? `code_pin` est une donnée sensible (le PIN de connexion de
// l'enfant). Elle ne doit jamais être ramenée vers le navigateur.
// On remplace donc les anciens `select('*')` par `select(PROFIL_COLUMNS)`
// pour être sûr de ne jamais transférer le PIN.
//
// Si tu ajoutes une colonne à la table profils et qu'une page en a besoin,
// pense à l'ajouter ici (sauf si elle est sensible comme code_pin).
export const PROFIL_COLUMNS = [
  'id',
  'nom',
  'xp',
  'streak',
  'lecons_completees',
  'mots_appris',
  'temps_total_minutes',
  'profil_type',
  'created_at',
  'user_id',
  'langue_id',
  'objectif_minutes',
  'niveau_estime',
  'objectif_xp_quotidien',
  'mode_focus',
  'repetition_espacee',
  'taille_texte',
  'police_dyslexie',
  'contraste_eleve',
  'espacement_texte',
  'mode_simplifie',
  'vitesse_lecture',
  'repetition_auto',
  'voix',
  'volume',
  'frequence_neuri',
  'type_feedback',
  'animations_neuri',
  'rappel_quotidien',
  'heure_rappel',
  'streak_reminder',
  'notif_pedagogiques',
  'afficher_streak',
  'age',
  'neuri_version',
  'date_naissance',
  'role',
  'code_enfant',
  'identifiant_parent',
  'identifiant_login',
].join(', ')
