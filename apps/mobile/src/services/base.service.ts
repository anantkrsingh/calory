import { http, type HttpClient } from '@/api/http';

/**
 * Shared plumbing for the endpoint classes. Each service owns one resource path
 * and exposes one method per API route — no state, so a module-level singleton
 * per service is enough.
 */
export abstract class BaseService {
  protected constructor(
    protected readonly path: string,
    protected readonly client: HttpClient = http,
  ) {}

  /** Joins the resource path with a sub-path: `('/123', 'sets') → /workouts/123/sets`. */
  protected url(...segments: (string | number)[]): string {
    return [this.path, ...segments.map(String)].join('/');
  }
}
