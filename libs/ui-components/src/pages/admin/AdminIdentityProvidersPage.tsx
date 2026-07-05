/**
 * flow: identity-providers
 * step: idp_list
 * route: /admin/identity-providers
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Switch,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { IdentityProviderHealthStatus, IdentityProviderPhase } from '@osac/types';

import {
  type IdentityProvider,
  useDeleteIdentityProvider,
  useIdentityProviders,
  usePatchIdentityProvider,
} from '../../api/v1/identity-provider';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

type IdpType = 'OIDC' | 'LDAP';

const PHASE_LABELS: Record<
  IdentityProviderPhase,
  { label: string; color: 'green' | 'red' | 'grey' }
> = {
  [IdentityProviderPhase.READY]: { label: 'Ready', color: 'green' },
  [IdentityProviderPhase.ERROR]: { label: 'Error', color: 'red' },
  [IdentityProviderPhase.UNKNOWN]: { label: 'Unknown', color: 'grey' },
  [IdentityProviderPhase.UNSPECIFIED]: { label: 'Unknown', color: 'grey' },
};

export const AdminIdentityProvidersPage = () => {
  const navigate = useNavigate();
  const { data: providers = [], isLoading, error } = useIdentityProviders();
  const { mutate: deleteProvider } = useDeleteIdentityProvider();
  const { mutate: patchProvider } = usePatchIdentityProvider();
  const [toDelete, setToDelete] = useState<IdentityProvider | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<IdpType[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [phaseFilters, setPhaseFilters] = useState<string[]>([]);
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [enabledFilters, setEnabledFilters] = useState<string[]>([]);
  const [enabledOpen, setEnabledOpen] = useState(false);

  const toggleType = (v: IdpType) =>
    setTypeFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const togglePhase = (v: string) =>
    setPhaseFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleEnabled = (v: string) =>
    setEnabledFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setTypeFilters([]);
    setPhaseFilters([]);
    setEnabledFilters([]);
  };
  const hasFilters =
    search !== '' || typeFilters.length > 0 || phaseFilters.length > 0 || enabledFilters.length > 0;

  const handleToggleEnabled = (provider: IdentityProvider, checked: boolean) => {
    patchProvider({
      id: provider.id,
      patch: { spec: { ...provider.spec, enabled: checked } as IdentityProvider['spec'] },
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      if (q) {
        const name = (p.spec?.title ?? p.metadata?.name ?? p.id).toLowerCase();
        if (!name.includes(q)) {
          return false;
        }
      }
      if (typeFilters.length > 0) {
        const t =
          p.spec?.config?.case === 'oidc'
            ? 'OIDC'
            : p.spec?.config?.case === 'ldap'
              ? 'LDAP'
              : null;
        if (!t || !typeFilters.includes(t)) {
          return false;
        }
      }
      if (phaseFilters.length > 0) {
        const phase = p.status?.phase;
        const label = phase !== undefined ? (PHASE_LABELS[phase]?.label ?? 'Unknown') : 'Unknown';
        if (!phaseFilters.includes(label)) {
          return false;
        }
      }
      if (enabledFilters.length > 0) {
        const label = p.spec?.enabled ? 'Enabled' : 'Disabled';
        if (!enabledFilters.includes(label)) {
          return false;
        }
      }
      return true;
    });
  }, [providers, search, typeFilters, phaseFilters, enabledFilters]);

  return (
    <ListPage
      title="Identity providers"
      description="Configure OIDC and LDAP providers for user authentication."
    >
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={`Delete identity provider "${toDelete.spec?.title ?? toDelete.id}"?`}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  deleteProvider(toDelete.id);
                  setToDelete(null);
                }}
              >
                Delete
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                Cancel
              </Button>
            </>
          }
        />
      )}
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar clearAllFilters={clearAll}>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                aria-label="Search identity providers"
                placeholder="Search by name"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                labels={typeFilters}
                deleteLabel={(_g, v) =>
                  toggleType((typeof v === 'string' ? v : (v as { key: string }).key) as IdpType)
                }
                deleteLabelGroup={() => setTypeFilters([])}
                categoryName="Type"
              >
                <Select
                  isOpen={typeOpen}
                  onOpenChange={setTypeOpen}
                  onSelect={(_e, v) => toggleType(v as IdpType)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setTypeOpen(!typeOpen)}
                      isExpanded={typeOpen}
                      badge={typeFilters.length || undefined}
                    >
                      Type
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['OIDC', 'LDAP'] as IdpType[]).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={typeFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
              <ToolbarFilter
                labels={phaseFilters}
                deleteLabel={(_g, v) =>
                  togglePhase(typeof v === 'string' ? v : (v as { key: string }).key)
                }
                deleteLabelGroup={() => setPhaseFilters([])}
                categoryName="Phase"
              >
                <Select
                  isOpen={phaseOpen}
                  onOpenChange={setPhaseOpen}
                  onSelect={(_e, v) => togglePhase(v as string)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setPhaseOpen(!phaseOpen)}
                      isExpanded={phaseOpen}
                      badge={phaseFilters.length || undefined}
                    >
                      Phase
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['Ready', 'Error', 'Unknown'] as const).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={phaseFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
              <ToolbarFilter
                labels={enabledFilters}
                deleteLabel={(_g, v) =>
                  toggleEnabled(typeof v === 'string' ? v : (v as { key: string }).key)
                }
                deleteLabelGroup={() => setEnabledFilters([])}
                categoryName="Status"
              >
                <Select
                  isOpen={enabledOpen}
                  onOpenChange={setEnabledOpen}
                  onSelect={(_e, v) => toggleEnabled(v as string)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setEnabledOpen(!enabledOpen)}
                      isExpanded={enabledOpen}
                      badge={enabledFilters.length || undefined}
                    >
                      Status
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['Enabled', 'Disabled'] as const).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={enabledFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>
            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/admin/identity-providers/new')}>
                Add provider
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>No identity providers match the current filters.</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                Clear filters
              </Button>
            </FlexItem>
          </Flex>
        ) : providers.length === 0 ? (
          <Alert variant="info" isInline title="No identity providers configured">
            Add an OIDC or LDAP provider to enable SSO for your users.
          </Alert>
        ) : (
          <Table aria-label="Identity providers" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Phase</Th>
                <Th>Health</Th>
                <Th>Enabled</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((provider) => {
                const phase = provider.status?.phase;
                const phaseInfo = phase !== undefined ? PHASE_LABELS[phase] : undefined;
                const health = provider.status?.health?.status;
                return (
                  <Tr key={provider.id}>
                    <Td dataLabel="Name">
                      {provider.spec?.title ?? provider.metadata?.name ?? provider.id}
                    </Td>
                    <Td dataLabel="Type">
                      <Label color="blue" isCompact>
                        {provider.spec?.config?.case === 'oidc'
                          ? 'OIDC'
                          : provider.spec?.config?.case === 'ldap'
                            ? 'LDAP'
                            : '—'}
                      </Label>
                    </Td>
                    <Td dataLabel="Phase">
                      {phaseInfo ? (
                        <Label color={phaseInfo.color} isCompact>
                          {phaseInfo.label}
                        </Label>
                      ) : (
                        <Label color="grey" isCompact>
                          Unknown
                        </Label>
                      )}
                    </Td>
                    <Td dataLabel="Health">
                      {health === IdentityProviderHealthStatus.HEALTHY ? (
                        <Label color="green" isCompact>
                          Healthy
                        </Label>
                      ) : health === IdentityProviderHealthStatus.UNHEALTHY ? (
                        <Label color="red" isCompact>
                          Unhealthy
                        </Label>
                      ) : (
                        <Label color="grey" isCompact>
                          —
                        </Label>
                      )}
                    </Td>
                    <Td dataLabel="Enabled">
                      <Switch
                        id={`idp-enabled-${provider.id}`}
                        isChecked={provider.spec?.enabled ?? false}
                        onChange={(_e, checked) => handleToggleEnabled(provider, checked)}
                        aria-label="Toggle identity provider"
                      />
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'Edit',
                            onClick: () =>
                              navigate(`/admin/identity-providers/${provider.id}/edit`),
                          },
                          { title: 'Delete', onClick: () => setToDelete(provider), isDanger: true },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
