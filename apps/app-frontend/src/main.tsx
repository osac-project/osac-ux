import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { ApiProvider } from '@osac/ui-components/api/api-context';
import type { ApiQueryKey, ApiQueryMeta } from '@osac/ui-components/api/types';

import { fulfillmentFetch } from './api/fulfillmentFetch';
import App from './App';
import { demoFetch } from './demo/demo-fetch';
import './i18n';

// CSS load order is intentional: base → addons → local overrides
/* eslint-disable import/order */
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/patternfly-addons.css';
import './global.css';
/* eslint-enable import/order */

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const apiFetch = DEMO_MODE ? demoFetch : fulfillmentFetch;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Short stale window deduplicates fetches when multiple components
      // mounting on the same page request the same query simultaneously.
      staleTime: 5_000,
      refetchOnMount: true,
      refetchInterval: DEMO_MODE ? false : 30_000,
      queryFn: (ctx) => {
        const [route, pathParams, queryParams] = ctx.queryKey as ApiQueryKey;
        const { decode } = (ctx.meta ?? {}) as ApiQueryMeta;
        return apiFetch(route, { pathParams, queryParams, decode });
      },
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApiProvider fetch={apiFetch}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ApiProvider>
    </React.StrictMode>,
  );
}
