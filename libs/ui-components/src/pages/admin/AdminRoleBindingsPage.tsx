/**
 * flow: manage-rbac
 * route: /admin/role-bindings (tenantAdmin)
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Content,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  MenuToggle,
  PageSection,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { RoleBindingState } from '@osac/types';

import { useDeleteRoleBinding, useRoleBindings, useRoles } from '../../api/v1/role-binding';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const ROLES_TAB = 0;
const BINDINGS_TAB = 1;
const ENFORCEMENT_TAB = 2;

// OPA Rego policy sample (from fulfillment-service internal/auth/policies/authz.rego)
const SAMPLE_REGO = `package authz

import rego.v1

default allow := false

# Provider admin — full access
allow if is_admin

# Tenant admin — user-management RPCs
allow if {
  is_tenant_admin
  has_tenant_admin_permissions
}

# Tenant user (client) — standard workload RPCs
allow if {
  is_client
  has_client_permissions
}

is_admin if "cloud-provider-admin" in subject_roles
is_tenant_admin if "tenant-admin" in subject_roles

is_client if {
  not is_admin
  not is_tenant_admin
}

subject_roles := input.auth.identity.roles`;

// ---------------------------------------------------------------------------
// Roles tab (read-only)
// ---------------------------------------------------------------------------

const RolesTab = () => {
  const { t } = useTranslation();
  const { data: roles = [], isLoading, error } = useRoles();
  return (
    <ListPageBody isLoading={isLoading} error={error}>
      {roles.length === 0 ? (
        <Alert variant="info" isInline title={t('No roles defined')} />
      ) : (
        <Table aria-label={t('Roles')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('Title')}</Th>
              <Th>{t('ID')}</Th>
              <Th>{t('Description')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {roles.map((r) => (
              <Tr key={r.id}>
                <Td dataLabel={t('Title')}>
                  <strong>{r.spec?.title ?? r.id}</strong>
                </Td>
                <Td dataLabel={t('ID')}>
                  <code style={{ fontSize: '0.85em' }}>{r.id}</code>
                </Td>
                <Td dataLabel={t('Description')}>{r.spec?.description ?? '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </ListPageBody>
  );
};

const STATE_LABELS: Record<
  RoleBindingState,
  { label: string; color: 'green' | 'red' | 'grey' | 'orange' }
> = {
  [RoleBindingState.READY]: { label: 'Ready', color: 'green' },
  [RoleBindingState.PENDING]: { label: 'Pending', color: 'orange' },
  [RoleBindingState.FAILED]: { label: 'Failed', color: 'red' },
  [RoleBindingState.UNSPECIFIED]: { label: 'Unknown', color: 'grey' },
};

// ---------------------------------------------------------------------------
// Bindings tab
// ---------------------------------------------------------------------------

const BindingsTab = () => {
  const { t } = useTranslation();
  const { data: bindings = [], isLoading, error } = useRoleBindings();
  const { data: roles = [] } = useRoles();
  const { mutate: deleteBinding } = useDeleteRoleBinding();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilters, setStateFilters] = useState<string[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [roleOpen, setRoleOpen] = useState(false);

  const toggleState = (v: string) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleRole = (v: string) =>
    setRoleFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const clearAll = () => {
    setSearch('');
    setStateFilters([]);
    setRoleFilters([]);
  };
  const hasFilters = search !== '' || stateFilters.length > 0 || roleFilters.length > 0;

  const roleTitleById = (id: string) => roles.find((r) => r.id === id)?.spec?.title ?? id;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bindings.filter((rb) => {
      if (q) {
        const roleTitle = roleTitleById(rb.spec?.role ?? '').toLowerCase();
        const users = (rb.spec?.users ?? []).join(' ').toLowerCase();
        if (!roleTitle.includes(q) && !users.includes(q)) {
          return false;
        }
      }
      if (roleFilters.length > 0 && !roleFilters.includes(rb.spec?.role ?? '')) {
        return false;
      }
      if (stateFilters.length > 0) {
        const stateLabel =
          rb.status?.state !== undefined
            ? (STATE_LABELS[rb.status.state]?.label ?? 'Unknown')
            : 'Unknown';
        if (!stateFilters.includes(stateLabel)) {
          return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindings, search, stateFilters, roleFilters]);

  return (
    <>
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={t('Delete this role binding?')}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  deleteBinding(toDelete);
                  setToDelete(null);
                }}
              >
                {t('Delete')}
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                {t('Cancel')}
              </Button>
            </>
          }
        />
      )}
      <Toolbar clearAllFilters={clearAll}>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Search bindings')}
              placeholder={t('Search by role or user')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </ToolbarItem>
          <ToolbarGroup variant="filter-group">
            <ToolbarFilter
              labels={roleFilters.map((id) => roleTitleById(id))}
              deleteLabel={(_g, v) => {
                const label = typeof v === 'string' ? v : (v as { key: string }).key;
                const found = roles.find((r) => (r.spec?.title ?? r.id) === label);
                if (found) {
                  toggleRole(found.id);
                }
              }}
              deleteLabelGroup={() => setRoleFilters([])}
              categoryName={t('Role')}
            >
              <Select
                isOpen={roleOpen}
                onOpenChange={setRoleOpen}
                onSelect={(_e, v) => toggleRole(v as string)}
                toggle={(ref) => (
                  <MenuToggle
                    ref={ref}
                    onClick={() => setRoleOpen(!roleOpen)}
                    isExpanded={roleOpen}
                    badge={roleFilters.length || undefined}
                  >
                    {t('Role')}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {roles.map((r) => (
                    <SelectOption
                      key={r.id}
                      value={r.id}
                      hasCheckbox
                      isSelected={roleFilters.includes(r.id)}
                    >
                      {r.spec?.title ?? r.id}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
            <ToolbarFilter
              labels={stateFilters}
              deleteLabel={(_g, v) =>
                toggleState(typeof v === 'string' ? v : (v as { key: string }).key)
              }
              deleteLabelGroup={() => setStateFilters([])}
              categoryName={t('State')}
            >
              <Select
                isOpen={stateOpen}
                onOpenChange={setStateOpen}
                onSelect={(_e, v) => toggleState(v as string)}
                toggle={(ref) => (
                  <MenuToggle
                    ref={ref}
                    onClick={() => setStateOpen(!stateOpen)}
                    isExpanded={stateOpen}
                    badge={stateFilters.length || undefined}
                  >
                    {t('State')}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {(['Ready', 'Pending', 'Failed'] as const).map((v) => (
                    <SelectOption
                      key={v}
                      value={v}
                      hasCheckbox
                      isSelected={stateFilters.includes(v)}
                    >
                      {v}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
          </ToolbarGroup>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/role-bindings/assign')}
            >
              {t('Assign role')}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <ListPageBody isLoading={isLoading} error={error}>
        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>{t('No role bindings match the current filters.')}</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                {t('Clear filters')}
              </Button>
            </FlexItem>
          </Flex>
        ) : bindings.length === 0 ? (
          <Alert variant="info" isInline title={t('No role bindings')}>
            {t('No roles have been assigned yet.')}
          </Alert>
        ) : (
          <Table aria-label={t('Role bindings')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Role')}</Th>
                <Th>{t('Users')}</Th>
                <Th>{t('State')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((rb) => {
                const stateInfo =
                  rb.status?.state !== undefined ? STATE_LABELS[rb.status.state] : undefined;
                return (
                  <Tr key={rb.id}>
                    <Td dataLabel={t('Role')}>{roleTitleById(rb.spec?.role ?? '')}</Td>
                    <Td dataLabel={t('Users')}>
                      {rb.spec?.users?.length ? (
                        <LabelGroup>
                          {rb.spec.users.map((u) => (
                            <Label key={u} isCompact color="blue">
                              {u}
                            </Label>
                          ))}
                        </LabelGroup>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel={t('State')}>
                      <Label color={stateInfo?.color ?? 'grey'} isCompact>
                        {t(stateInfo?.label ?? 'Unknown')}
                      </Label>
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: () => navigate(`/admin/role-bindings/${rb.id}`),
                          },
                          {
                            title: t('Delete'),
                            onClick: () => setToDelete(rb.id),
                            isDanger: true,
                          },
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
    </>
  );
};

// ---------------------------------------------------------------------------
// Enforcement tab (static)
// ---------------------------------------------------------------------------

const EnforcementTab = () => {
  const { t } = useTranslation();
  return (
    <PageSection>
      <Title headingLevel="h3" size="md" style={{ marginBottom: '0.75rem' }}>
        {t('Authorization enforcement')}
      </Title>
      <Content component="p" style={{ marginBottom: '1rem' }}>
        {t('Every API endpoint in the OSAC fulfillment service is protected by an in-process')}{' '}
        <strong>OPA Rego</strong> {t('policy evaluated by gRPC interceptors. The')}{' '}
        <code>GrpcAuthnInterceptor</code>{' '}
        {t('validates Keycloak-issued JWTs via the built-in JWKS cache; the')}{' '}
        <code>GrpcAuthzInterceptor</code>{' '}
        {t(
          'runs the embedded Rego policy. Requests that do not satisfy the policy are rejected with',
        )}{' '}
        <code>PERMISSION_DENIED</code>
        {'. '}
        {t('Authorino / Kuadrant external auth was removed in')} <em>fulfillment-service#685</em>.
      </Content>

      <Title headingLevel="h4" size="sm" style={{ marginBottom: '0.5rem' }}>
        {t('Sample policy — role-based access control')}
      </Title>
      <pre
        style={{
          background: 'var(--pf-t--global--background--color--secondary--default)',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.8em',
          lineHeight: 1.5,
        }}
      >
        {SAMPLE_REGO}
      </pre>
    </PageSection>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const AdminRoleBindingsPage = () => {
  const { t } = useTranslation();
  const { data: roles = [] } = useRoles();
  const { data: bindings = [] } = useRoleBindings();
  const [activeTab, setActiveTab] = useState(BINDINGS_TAB);

  return (
    <ListPage
      title={t('Role management')}
      description={t('View system roles and manage user role assignments.')}
    >
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span>
          <Badge isRead>{roles.length}</Badge> {t('system roles')}
        </span>
        <span>
          <Badge isRead>{bindings.length}</Badge> {t('role bindings')}
        </span>
        <Label color="blue" isCompact>
          {t('Enforced by OPA')}
        </Label>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(_e, k) => setActiveTab(k as number)}
        aria-label={t('Role management tabs')}
        style={{ marginBottom: '1rem' }}
      >
        <Tab eventKey={ROLES_TAB} title={<TabTitleText>{t('Roles')}</TabTitleText>} />
        <Tab
          eventKey={BINDINGS_TAB}
          title={
            <TabTitleText>
              {t('User → Role bindings ({{count}})', { count: bindings.length })}
            </TabTitleText>
          }
        />
        <Tab eventKey={ENFORCEMENT_TAB} title={<TabTitleText>{t('Enforcement')}</TabTitleText>} />
      </Tabs>

      <TabContent
        eventKey={ROLES_TAB}
        activeKey={activeTab}
        hidden={activeTab !== ROLES_TAB}
        id="rbac-roles-tab"
      >
        <TabContentBody>
          <RolesTab />
        </TabContentBody>
      </TabContent>

      <TabContent
        eventKey={BINDINGS_TAB}
        activeKey={activeTab}
        hidden={activeTab !== BINDINGS_TAB}
        id="rbac-bindings-tab"
      >
        <TabContentBody>
          <BindingsTab />
        </TabContentBody>
      </TabContent>

      <TabContent
        eventKey={ENFORCEMENT_TAB}
        activeKey={activeTab}
        hidden={activeTab !== ENFORCEMENT_TAB}
        id="rbac-enforcement-tab"
      >
        <TabContentBody>
          <EnforcementTab />
        </TabContentBody>
      </TabContent>
    </ListPage>
  );
};
