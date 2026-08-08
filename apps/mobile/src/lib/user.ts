import type { User } from '@fitness/types';

/**
 * The name to show a user in the UI. `displayName` is set during onboarding, but
 * sessions restored from an older build can carry an empty one — the email local
 * part is a readable stand-in ("ada.lovelace@x.com" → "Ada Lovelace").
 */
export function displayNameOf(user: User | null | undefined): string {
  const displayName = user?.profile.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const local = user?.email?.split('@')[0] ?? '';

  return local
    .split(/[._+\-\d]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** First word of the display name — what greetings address the user by. */
export function firstNameOf(user: User | null | undefined): string {
  return displayNameOf(user).split(/\s+/)[0] ?? '';
}

/**
 * Avatar initials: first and last word ("Ada Byron Lovelace" → "AL"), or a single
 * letter for a one-word name. Empty when there is nothing to derive them from.
 */
export function initialsOf(user: User | null | undefined): string {
  const words = displayNameOf(user).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';

  return (first + last).toUpperCase();
}
