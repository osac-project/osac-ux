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
  Tooltip,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { tenantJurisdiction } from '../../api/v1/compliance';
import { useIdentityProviders } from '../../api/v1/identity-provider';
import { useDeleteTenant, useTenants } from '../../api/v1/tenant';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const ORGS_TAB = 0;
const IDP_TAB = 1;

const JURISDICTION_COLOR = { EU: 'blue', US: 'purple', Unrestricted: 'grey' } as const;

// ---------------------------------------------------------------------------
// Identity Providers info tab
// ---------------------------------------------------------------------------

const IdpInfoTab = ({ onNavigate }: { onNavigate: () => void }) => {
  const { t } = useTranslation();
  const { data: idps = [], isLoading } = useIdentityProviders();
  const { data: tenants = [] } = useTenants();

  const tenantNameById = new Map(tenants.map((tn) => [tn.id, tn.metadata?.name ?? tn.id]));

  return (
    <PageSection>
      <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
        {t('Configured Identity Providers')}
      </Title>
      <Content component="p" style={{ marginBottom: '1rem' }}>
        {t(
          'Identity providers (IdPs) are used for tenant user authentication. Each tenant can be linked to an IdP for SSO login routing.',
        )}
      </Content>
      {isLoading ? null : idps.length === 0 ? (
        <Alert variant="info" isInline title={t('No identity providers configured')}>
          {t('Configure IdPs in the')}{' '}
          <Button variant="link" isInline onClick={onNavigate}>
            {t('Identity Providers')}
          </Button>{' '}
          {t('management page.')}
        </Alert>
      ) : (
        <>
          <Table
            aria-label={t('Identity providers')}
            variant="compact"
            style={{ marginBottom: '1rem' }}
          >
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Type')}</Th>
                <Th>{t('Tenant')}</Th>
                <Th>{t('Enabled')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {idps.map((idp) => {
                const tenantId = idp.metadata?.tenant;
                const tenantName = tenantId ? tenantNameById.get(tenantId) : undefined;
                return (
                  <Tr key={idp.id}>
                    <Td dataLabel={t('Name')}>{idp.spec?.title ?? idp.metadata?.name ?? idp.id}</Td>
                    <Td dataLabel={t('Type')}>
                      <Label color="blue" isCompact>
                        {idp.spec?.config?.case?.toUpperCase() ?? '—'}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Tenant')}>
                      {tenantName ? (
                        <Label color="cyan" isCompact>
                          {tenantName}
                        </Label>
                      ) : (
                        <Label color="grey" isCompact variant="outline">
                          {t('Unassigned')}
                        </Label>
                      )}
                    </Td>
                    <Td dataLabel={t('Enabled')}>
                      <Label color={idp.spec?.enabled ? 'green' : 'grey'} isCompact>
                        {idp.spec?.enabled ? t('Enabled') : t('Disabled')}
                      </Label>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Button variant="link" onClick={onNavigate}>
            {t('Manage identity providers →')}
          </Button>
        </>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Title headingLevel="h4" size="sm" style={{ marginBottom: '0.5rem' }}>
          {t('Authentication architecture')}
        </Title>
        <DescriptionList isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Token issuance')}</DescriptionListTerm>
            <DescriptionListDescription>
              {t('Keycloak — one realm per tenant organization')}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Authorization')}</DescriptionListTerm>
            <DescriptionListDescription>
              {t('OPA Rego policies enforced via gRPC interceptors in the fulfillment service')}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Supported IdP kinds')}</DescriptionListTerm>
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
  const { t } = useTranslation();
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
          title={t('Delete tenant "{{id}}"?', { id: toDelete })}
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
                {t('Delete')}
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                {t('Cancel')}
              </Button>
            </>
          }
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <Button variant="primary" size="sm" onClick={() => navigate('/provider/organizations/new')}>
          {t('Create tenant')}
        </Button>
      </div>
      <ListPageBody isLoading={isLoading} error={error}>
        {tenants.length === 0 ? (
          <Alert variant="info" isInline title={t('No tenants found')}>
            {t('No tenants are registered on this platform yet.')}
          </Alert>
        ) : (
          <Table aria-label={t('Tenant organizations')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Jurisdiction')}</Th>
                <Th>{t('Domains')}</Th>
                <Th>{t('IP pools')}</Th>
                <Th>{t('Created')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {tenants.map((tenant) => {
                const jurisdiction = tenantJurisdiction(tenant);
                return (
                  <Tr key={tenant.id}>
                    <Td dataLabel={t('Name')}>
                      <strong>{tenant.metadata?.name ?? tenant.id}</strong>
                    </Td>
                    <Td dataLabel={t('Jurisdiction')}>
                      <Tooltip
                        content={t(
                          "Sovereignty/residency attribute on TenantSpec (REQ-CA-1). Determines which regions/domains this tenant's resources may be placed in.",
                        )}
                      >
                        <Label isCompact color={JURISDICTION_COLOR[jurisdiction]}>
                          {jurisdiction}
                        </Label>
                      </Tooltip>
                    </Td>
                    <Td dataLabel={t('Domains')}>
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
                    <Td dataLabel={t('IP pools')}>
                      <Label color="blue" isCompact variant="outline">
                        {t('Scoped via metadata.tenant')}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Created')}>
                      {tenant.metadata?.creationTimestamp
                        ? new Date(tenant.metadata.creationTimestamp).toLocaleDateString()
                        : '—'}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: (e) => {
                              e.stopPropagation();
                              navigate(`/provider/organizations/${tenant.id}/edit`);
                            },
                          },
                          {
                            title: t('Delete'),
                            onClick: (e) => {
                              e.stopPropagation();
                              setToDelete(tenant.id);
                            },
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
// Page
// ---------------------------------------------------------------------------

export const ProviderTenantOrgsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(ORGS_TAB);

  return (
    <ListPage
      title={t('Tenant organizations')}
      description={t('All tenants registered on this platform.')}
    >
      <Tabs
        activeKey={activeTab}
        onSelect={(_e, k) => setActiveTab(k as number)}
        aria-label={t('Organizations tabs')}
        style={{ marginBottom: '1rem' }}
      >
        <Tab eventKey={ORGS_TAB} title={<TabTitleText>{t('Organizations')}</TabTitleText>} />
        <Tab eventKey={IDP_TAB} title={<TabTitleText>{t('Identity Providers')}</TabTitleText>} />
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
