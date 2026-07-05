/**
 * flow: manage-organizations
 * route: /provider/organizations (providerAdmin)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  PageSection,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useIdentityProviders } from '../../api/v1/identity-provider';
import { useDeleteTenant, useTenants } from '../../api/v1/tenant';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const ORGS_TAB = 0;
const IDP_TAB = 1;

// ---------------------------------------------------------------------------
// Identity Providers info tab
// ---------------------------------------------------------------------------

const IdpInfoTab = ({ onNavigate }: { onNavigate: () => void }) => {
  const { data: idps = [], isLoading } = useIdentityProviders();
  const { data: tenants = [] } = useTenants();

  const tenantNameById = new Map(tenants.map((t) => [t.id, t.metadata?.name ?? t.id]));

  return (
    <PageSection>
      <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
        Configured Identity Providers
      </Title>
      <Content component="p" style={{ marginBottom: '1rem' }}>
        Identity providers (IdPs) are used for tenant user authentication. Each tenant can be linked
        to an IdP for SSO login routing.
      </Content>
      {isLoading ? null : idps.length === 0 ? (
        <Alert variant="info" isInline title="No identity providers configured">
          Configure IdPs in the{' '}
          <Button variant="link" isInline onClick={onNavigate}>
            Identity Providers
          </Button>{' '}
          management page.
        </Alert>
      ) : (
        <>
          <Table aria-label="Identity providers" variant="compact" style={{ marginBottom: '1rem' }}>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Tenant</Th>
                <Th>Enabled</Th>
              </Tr>
            </Thead>
            <Tbody>
              {idps.map((idp) => {
                const tenantId = idp.metadata?.tenant;
                const tenantName = tenantId ? tenantNameById.get(tenantId) : undefined;
                return (
                  <Tr key={idp.id}>
                    <Td dataLabel="Name">{idp.spec?.title ?? idp.metadata?.name ?? idp.id}</Td>
                    <Td dataLabel="Type">
                      <Label color="blue" isCompact>
                        {idp.spec?.config?.case?.toUpperCase() ?? '—'}
                      </Label>
                    </Td>
                    <Td dataLabel="Tenant">
                      {tenantName ? (
                        <Label color="cyan" isCompact>
                          {tenantName}
                        </Label>
                      ) : (
                        <Label color="grey" isCompact variant="outline">
                          Unassigned
                        </Label>
                      )}
                    </Td>
                    <Td dataLabel="Enabled">
                      <Label color={idp.spec?.enabled ? 'green' : 'grey'} isCompact>
                        {idp.spec?.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Button variant="link" onClick={onNavigate}>
            Manage identity providers →
          </Button>
        </>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Title headingLevel="h4" size="sm" style={{ marginBottom: '0.5rem' }}>
          Authentication architecture
        </Title>
        <DescriptionList isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>Token issuance</DescriptionListTerm>
            <DescriptionListDescription>
              Keycloak — one realm per tenant organization
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Authorization</DescriptionListTerm>
            <DescriptionListDescription>
              OPA Rego policies enforced via gRPC interceptors in the fulfillment service
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Supported IdP kinds</DescriptionListTerm>
            <DescriptionListDescription>
              <LabelGroup>
                {['OIDC', 'LDAP', 'SAML', 'AD'].map((k) => (
                  <Label key={k} isCompact color="cyan">
                    {k}
                  </Label>
                ))}
              </LabelGroup>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
    </PageSection>
  );
};

// ---------------------------------------------------------------------------
// Organizations tab
// ---------------------------------------------------------------------------

const OrgsTab = () => {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading, error } = useTenants();
  const { mutate: deleteTenant } = useDeleteTenant();
  const [toDelete, setToDelete] = useState<string | null>(null);

  return (
    <>
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={`Delete tenant "${toDelete}"?`}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  deleteTenant(toDelete);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <Button variant="primary" size="sm" onClick={() => navigate('/provider/organizations/new')}>
          Create tenant
        </Button>
      </div>
      <ListPageBody isLoading={isLoading} error={error}>
        {tenants.length === 0 ? (
          <Alert variant="info" isInline title="No tenants found">
            No tenants are registered on this platform yet.
          </Alert>
        ) : (
          <Table aria-label="Tenant organizations" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Domains</Th>
                <Th>IP pools</Th>
                <Th>Created</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {tenants.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td dataLabel="Name">
                    <strong>{tenant.metadata?.name ?? tenant.id}</strong>
                  </Td>
                  <Td dataLabel="Domains">
                    {tenant.spec?.domains?.length ? (
                      <LabelGroup>
                        {tenant.spec.domains.map((d) => (
                          <Label key={d} isCompact color="cyan">
                            {d}
                          </Label>
                        ))}
                      </LabelGroup>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel="IP pools">
                    <Label color="blue" isCompact variant="outline">
                      Scoped via metadata.tenant
                    </Label>
                  </Td>
                  <Td dataLabel="Created">
                    {tenant.metadata?.creationTimestamp
                      ? new Date(tenant.metadata.creationTimestamp).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: 'Edit',
                          onClick: (e) => {
                            e.stopPropagation();
                            navigate(`/provider/organizations/${tenant.id}/edit`);
                          },
                        },
                        {
                          title: 'Delete',
                          onClick: (e) => {
                            e.stopPropagation();
                            setToDelete(tenant.id);
                          },
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ProviderTenantOrgsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(ORGS_TAB);

  return (
    <ListPage title="Tenant organizations" description="All tenants registered on this platform.">
      <Tabs
        activeKey={activeTab}
        onSelect={(_e, k) => setActiveTab(k as number)}
        aria-label="Organizations tabs"
        style={{ marginBottom: '1rem' }}
      >
        <Tab eventKey={ORGS_TAB} title={<TabTitleText>Organizations</TabTitleText>} />
        <Tab eventKey={IDP_TAB} title={<TabTitleText>Identity Providers</TabTitleText>} />
      </Tabs>

      <TabContent
        eventKey={ORGS_TAB}
        activeKey={activeTab}
        hidden={activeTab !== ORGS_TAB}
        id="orgs-tab"
      >
        <TabContentBody>
          <OrgsTab />
        </TabContentBody>
      </TabContent>

      <TabContent
        eventKey={IDP_TAB}
        activeKey={activeTab}
        hidden={activeTab !== IDP_TAB}
        id="idp-tab"
      >
        <TabContentBody>
          <IdpInfoTab onNavigate={() => navigate('/admin/identity-providers')} />
        </TabContentBody>
      </TabContent>
    </ListPage>
  );
};
