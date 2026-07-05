/**
 * Mock ApiFetch implementation for demo mode.
 * Serves data from mockStore with a simulated network delay.
 * Supports List (GET), Get (GET /:id), Create (POST), Patch (PATCH), Delete (DELETE).
 */
import type { ApiFetch, ApiFetchOptions, ApiRoute } from '@osac/ui-components/api/types';

import { mockCapabilities, mockStore } from './mock-store';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

let nextIdCounter = 1000;
const generateId = () => `demo-${++nextIdCounter}`;

const wrapList = (items: unknown[]) => ({ items, total: items.length });

export const demoFetch: ApiFetch = async <T = unknown>(
  route: ApiRoute,
  options: ApiFetchOptions = {},
): Promise<T> => {
  await delay();

  const { pathParams, method = 'GET', body } = options;
  const id = Array.isArray(pathParams) && pathParams.length > 0 ? String(pathParams[0]) : null;

  // capabilities is a singleton object, not a list
  if (route === 'v1/capabilities') {
    return mockCapabilities as T;
  }

  // Console sessions: return a mock ticket
  if (route === 'v1/console_sessions' && method === 'POST') {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 min
    return {
      resourceType: (body as { resourceType?: number })?.resourceType ?? 1,
      resourceId: (body as { resourceId?: string })?.resourceId ?? '',
      type: (body as { type?: number })?.type ?? 1,
      clientId: '',
      ticket: `demo-ticket-${Date.now()}`,
      expiresAt: { seconds: BigInt(Math.floor(expiresAt.getTime() / 1000)), nanos: 0 },
    } as T;
  }

  const collection = mockStore[route] as Record<string, unknown>[] | undefined;

  if (!collection) {
    // Route exists in ApiRoute but has no mock data yet — return empty list
    if (method === 'GET' && !id) {
      return wrapList([]) as T;
    }
    if (method === 'GET' && id) {
      throw new Error(`[demo] Not found: ${route}/${id}`);
    }
    return undefined as T;
  }

  // GET list
  if (method === 'GET' && !id) {
    return wrapList(collection) as T;
  }

  // GET single
  if (method === 'GET' && id) {
    const item = collection.find((r) => (r as { id: string }).id === id);
    if (!item) {
      throw new Error(`[demo] Not found: ${route}/${id}`);
    }
    return item as T;
  }

  // POST (create)
  if (method === 'POST') {
    const newItem = { id: generateId(), ...(body as object) };
    collection.push(newItem);
    return { object: newItem } as T;
  }

  // PATCH (update)
  if (method === 'PATCH' && id) {
    const idx = collection.findIndex((r) => (r as { id: string }).id === id);
    if (idx === -1) {
      throw new Error(`[demo] Not found: ${route}/${id}`);
    }
    collection[idx] = { ...collection[idx], ...(body as object) };
    return { object: collection[idx] } as T;
  }

  // DELETE
  if (method === 'DELETE' && id) {
    const idx = collection.findIndex((r) => (r as { id: string }).id === id);
    if (idx !== -1) {
      collection.splice(idx, 1);
    }
    return undefined as T;
  }

  return undefined as T;
};
