import { Navigate, Route, Routes } from 'react-router-dom';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Spinner,
} from '@patternfly/react-core';

import { SessionProvider, useSession } from '@osac/ui-components/hooks/use-session';

import { useOIDCLogin } from './hooks/oidc-login';
import { AppShell } from './shell/AppShell';
import { defaultRouteForRole } from './shell/shellRoutes';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_TENANT_ID = 'tenant-001';

const LoggedInHomeRedirect = () => {
  const { role } = useSession();
  return <Navigate to={defaultRouteForRole(role)} replace />;
};

const DemoApp = () => (
  <SessionProvider role="tenantUser" username="demo-user" tenantId={DEMO_TENANT_ID} isDemoMode>
    <Routes>
      <Route path="/" element={<LoggedInHomeRedirect />} />
      <Route path="/*" element={<AppShell logout={async () => undefined} />} />
    </Routes>
  </SessionProvider>
);

const LiveApp = () => {
  const [username, role, isLoading, error, logout] = useOIDCLogin();

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Bullseye>
        <EmptyState titleText="Sign-in failed" headingLevel="h4">
          <EmptyStateBody>{error}</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary">Retry</Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <SessionProvider role={role} username={username}>
      <Routes>
        <Route path="/" element={<LoggedInHomeRedirect />} />
        <Route path="/*" element={<AppShell logout={logout} />} />
      </Routes>
    </SessionProvider>
  );
};

const App = () => (DEMO_MODE ? <DemoApp /> : <LiveApp />);

export default App;
