/** Converts a title into a URL-safe, lowercase, hyphenated slug. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

interface UniqueSlugOptions {
  /** Returns true if the candidate slug is already taken (excluding the current record, if any). */
  isTaken: (candidate: string) => Promise<boolean>
}

/** Generates a slug from `title`, appending `-2`, `-3`, ... until it is unique. */
export async function generateUniqueSlug(title: string, { isTaken }: UniqueSlugOptions): Promise<string> {
  const base = slugify(title) || 'item'
  let candidate = base
  let suffix = 2

  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}
