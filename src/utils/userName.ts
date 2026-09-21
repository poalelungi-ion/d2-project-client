/**
 * Deriving display forms from the single `name` field an account carries.
 *
 * The backend stores one free-text name rather than separate given/family
 * fields, so both of these are best-effort splits on whitespace. They are for
 * greeting someone and labelling an avatar -- nothing depends on them being
 * a correct parse of a person's name, and neither is ever sent back.
 */

const words = (name: string): string[] => name.trim().split(/\s+/).filter(Boolean);

/**
 * The first word of the name, for "Welcome back, Anna".
 *
 * Returns an empty string for an empty name so the caller can drop the comma
 * rather than greeting nobody.
 */
export const firstName = (name: string | undefined | null): string => words(name ?? '')[0] ?? '';

/**
 * First and last initial: "Anna Musterfrau" reads as AM.
 *
 * A single-word name gives one letter rather than doubling it, and a middle
 * name is skipped -- three letters crowd the avatar.
 */
export const initials = (name: string | undefined | null): string => {
  const parts = words(name ?? '');
  if (parts.length === 0) return '';
  const picked = parts.length === 1 ? [parts[0]] : [parts[0], parts[parts.length - 1]];
  return picked.map((part) => part[0].toUpperCase()).join('');
};
