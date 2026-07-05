import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageToggleButton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons/user-icon';

import UserPreferencesModal from '@osac/ui-components/components/UserPreferences/UserPreferencesModal';
import { useSession } from '@osac/ui-components/hooks/use-session';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { operatingModeLabel } from './shellLabels';
import { defaultRouteForRole } from './shellRoutes';

interface ShellMastheadProps {
  onLogout: () => Promise<void>;
}

const DEMO_ROLES: Array<{ role: DemoShellRole; label: string }> = [
  { role: 'tenantUser', label: 'Tenant User' },
  { role: 'tenantAdmin', label: 'Tenant Admin' },
  { role: 'providerAdmin', label: 'Provider Admin' },
];

export const ShellMasthead = ({ onLogout }: ShellMastheadProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isPreferencesOpen, setPreferencesOpen] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string>();
  const navigate = useNavigate();
  const { role, username, isDemoMode, setRole } = useSession();

  const displayName = isDemoMode ? `Demo (${operatingModeLabel(role)})` : username || 'User';

  const handleRoleSwitch = (newRole: DemoShellRole) => {
    setRole?.(newRole);
    setIsUserMenuOpen(false);
    navigate(defaultRouteForRole(newRole));
  };

  return (
    <>
      {logoutError && (
        <Modal variant="small" isOpen onClose={() => setLogoutError(undefined)}>
          <ModalHeader title="Logout failed" titleIconVariant="danger" />
          <ModalBody>
            <Alert variant="danger" isInline title={logoutError ?? ''} />
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={() => setLogoutError(undefined)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
      {isPreferencesOpen && <UserPreferencesModal onClose={() => setPreferencesOpen(false)} />}
      <Masthead display={{ default: 'inline' }}>
        <MastheadMain>
          <MastheadToggle>
            <PageToggleButton variant="plain" aria-label="Global navigation">
              <BarsIcon />
            </PageToggleButton>
          </MastheadToggle>
          <MastheadLogo>
            <MastheadBrand>
              <Title headingLevel="h4" size="lg">
                Red Hat OSAC{isDemoMode && ' — Demo'}
              </Title>
            </MastheadBrand>
          </MastheadLogo>
        </MastheadMain>

        <MastheadContent>
          <Toolbar id="toolbar" isStatic>
            <ToolbarContent>
              <ToolbarGroup
                variant="action-group-plain"
                align={{ default: 'alignEnd' }}
                gap={{ default: 'gapNone', md: 'gapMd' }}
              >
                <ToolbarItem>
                  <Dropdown
                    isOpen={isUserMenuOpen}
                    onSelect={() => setIsUserMenuOpen(false)}
                    onOpenChange={setIsUserMenuOpen}
                    popperProps={{ position: 'right' }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        isExpanded={isUserMenuOpen}
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        icon={<UserIcon />}
                        aria-label="Account menu"
                      >
                        {displayName}{' '}
                        <Label color={isDemoMode ? 'blue' : 'grey'} variant="outline" isCompact>
                          {operatingModeLabel(role)}
                        </Label>
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {isDemoMode && (
                        <>
                          {DEMO_ROLES.map(({ role: r, label }) => (
                            <DropdownItem
                              key={r}
                              onClick={() => handleRoleSwitch(r)}
                              isSelected={role === r}
                              description="Switch role"
                            >
                              {label}
                            </DropdownItem>
                          ))}
                          <Divider component="li" />
                        </>
                      )}
                      <DropdownItem onClick={() => setPreferencesOpen(true)}>
                        Preferences
                      </DropdownItem>
                      {!isDemoMode && (
                        <DropdownItem
                          onClick={async () => {
                            try {
                              await onLogout();
                              navigate('/');
                            } catch (e) {
                              setLogoutError(getErrorMessage(e));
                            }
                          }}
                        >
                          Log out
                        </DropdownItem>
                      )}
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    </>
  );
};
