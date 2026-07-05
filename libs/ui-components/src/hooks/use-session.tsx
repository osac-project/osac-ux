import { createContext, useContext, useState } from 'react';

import type { DemoShellRole } from '../shellTypes';
import { type ResolvedTheme, type Theme, useTheme } from './use-theme';

interface SessionContextValue {
  role: DemoShellRole;
  username: string;
  /** The tenant this user belongs to. Empty string = global/admin. */
  tenantId: string;
  userTheme: Theme;
  resolvedTheme: ResolvedTheme;
  setUserTheme: (theme: Theme) => void;
  isDemoMode: boolean;
  setRole?: (role: DemoShellRole) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  role: DemoShellRole;
  username: string;
  /** The tenant this user belongs to. Defaults to empty string. */
  tenantId?: string;
  isDemoMode?: boolean;
}

export const SessionProvider = ({
  children,
  role: initialRole,
  username,
  tenantId = '',
  isDemoMode = false,
}: SessionProviderProps) => {
  const themeProps = useTheme();
  const [role, setRole] = useState<DemoShellRole>(initialRole);

  return initialRole ? (
    <SessionContext.Provider
      value={{
        role,
        username,
        tenantId,
        ...themeProps,
        isDemoMode,
        setRole: isDemoMode ? setRole : undefined,
      }}
    >
      {children}
    </SessionContext.Provider>
  ) : undefined;
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
