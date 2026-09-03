/**
 * A client-generated id for things the server accepts before they have a
 * database id yet — a workout's exercise/set entries, primarily (see
 * `clientIdSchema` in `@fitness/validation`, which accepts this alongside a
 * real ObjectId). Not cryptographically strong — RFC4122 v4 shape is all the
 * server validates, and `expo-crypto` isn't a dependency here.
 */
export function generateClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
