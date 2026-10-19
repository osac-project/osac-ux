import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { createRegistry } from '@bufbuild/protobuf';
import {
  file_google_protobuf_duration,
  file_google_protobuf_struct,
  file_google_protobuf_timestamp,
  file_google_protobuf_wrappers,
} from '@bufbuild/protobuf/wkt';
import { createConnectTransport } from '@connectrpc/connect-web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { ApiProvider, connectErrorInterceptor } from '@osac/ui-components/api/api-context';
import ToastProvider from '@osac/ui-components/components/Toast/ToastProvider';

import { createMockConnectTransport } from '@osac/ui-components/test-utils/createMockConnectTransport';

import App from './App';
import { mockFixtures } from './mock/mock-data';
import './i18n';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// Transport type cast bridges the dual @bufbuild/protobuf resolutions (2.12 vs 2.16)
// in this pnpm workspace. At runtime the structures are identical.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectTransport = (MOCK_MODE
  ? createMockConnectTransport(mockFixtures)
  : createConnectTransport({
      baseUrl: '/api/fulfillment',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interceptors: [connectErrorInterceptor as any],
      jsonOptions: {
        registry: createRegistry(
          file_google_protobuf_wrappers,
          file_google_protobuf_timestamp,
          file_google_protobuf_duration,
          file_google_protobuf_struct,
        ),
      },
    })) as ReturnType<typeof createMockConnectTransport>;

// CSS load order is intentional: base → addons → local overrides
/* eslint-disable import/order */
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/patternfly-addons.css';
import './global.css';
/* eslint-enable import/order */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Short stale window deduplicates fetches when multiple components
      // mounting on the same page request the same query simultaneously.
      staleTime: 5_000,
      refetchOnMount: true,
      refetchInterval: 10_000,
    },
  },
});

const router = createBrowserRouter([{ path: '*', element: <App /> }], {
  basename: import.meta.env.BASE_URL,
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApiProvider transport={connectTransport}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </ApiProvider>
    </React.StrictMode>,
  );
}
