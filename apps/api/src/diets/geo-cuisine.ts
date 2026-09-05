import {
  DietCuisine,
  type DietCuisine as DietCuisineType,
} from '@fitness/types';
import geoip from 'geoip-lite';

/**
 * ISO-3166-1 alpha-2 country → the closest of our fixed `DietCuisine` set.
 * Coarse by design — this only picks a starting point; the user (or the chat
 * agent, on their behalf) can always override it explicitly via
 * `generateDietPlanSchema.cuisine`.
 */
const COUNTRY_CUISINE: Record<string, DietCuisineType> = {
  IN: DietCuisine.Indian,
  IT: DietCuisine.Italian,
  CN: DietCuisine.Chinese,
  HK: DietCuisine.Chinese,
  TW: DietCuisine.Chinese,
  MX: DietCuisine.Mexican,
  US: DietCuisine.American,
  CA: DietCuisine.American,
};

/**
 * Best-effort default cuisine from the caller's IP — geoip-lite is an
 * offline lookup (bundled country database, no outbound network call), so
 * this never blocks or fails the request. Falls back to `continental` for
 * unmapped countries, private/loopback IPs (always true in local dev), and
 * anything geoip-lite can't resolve.
 */
export function resolveDietCuisine(ip: string | undefined): DietCuisineType {
  if (!ip) return DietCuisine.Continental;

  // geoip-lite doesn't resolve private/loopback ranges; guard explicitly so
  // local dev and same-host deploys don't waste a lookup.
  const normalized = ip === '::1' ? '127.0.0.1' : ip.replace(/^::ffff:/, '');

  try {
    const result = geoip.lookup(normalized);
    return (
      (result && COUNTRY_CUISINE[result.country]) || DietCuisine.Continental
    );
  } catch {
    return DietCuisine.Continental;
  }
}
