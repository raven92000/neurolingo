export function normalizeLogin(login) {
  return login
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
}

export function buildChildPassword(normalizedLogin, pin) {
  return `pin_${normalizedLogin}_${pin}`
}

export function buildChildFakeEmail(normalizedLogin) {
  return `${normalizedLogin}@neurolingo.internal`
}
