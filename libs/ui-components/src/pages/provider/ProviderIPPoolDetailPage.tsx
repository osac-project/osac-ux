/**
 * flow: provider-ip-management
 * route: /provider/ip-pools/:poolType/:id (providerAdmin)
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageBreadcrumb,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  type ExternalIPPool,
  useExternalIPPools,
  useExternalIPs,
  usePatchExternalIPPool,
  usePublicIPPools,
  usePublicIPs,
} from '../../api/v1/ip-management';
import { useOrganizations } from '../../api/v1/organization';
import ListPageBody from '../../components/Page/ListPageBody';
import { getErrorMessage } from '../../utils/error';

const IP_FAMILY_LABELS: Record<number, string> = { 1: 'IPv4', 2: 'IPv6' };

const IPStateLabel = ({ state }: { state?: number }) => {
  if (state === 2) {
    return (
      <Label color="green" isCompact>
        Allocated
      </Label>
    );
  }
  if (state === 1) {
    return (
      <Label color="orange" isCompact>
        Pending
      </Label>
    );
  }
  if (state === 3) {
    return (
      <Label color="red" isCompact>
        Failed
      </Label>
    );
  }
  return (
    <Label color="grey" isCompact>
      Unknown
    </Label>
  );
};

const OVERVIEW_TAB = 0;
const ALLOCATIONS_TAB = 1;
const TENANT_TAB = 2;

// ---------------------------------------------------------------------------
// Assign Tenant Modal
// ---------------------------------------------------------------------------

const AssignTenantModal = ({ pool, onClose }: { pool: ExternalIPPool; onClose: () => void }) => {
  const { data: orgs = [] } = useOrganizations();
  const patch = usePatchExternalIPPool();
  const [selected, setSelected] = useState<string>(pool.metadata?.tenant ?? '');
  const [open, setOpen] = useState(false);

  const currentTenant = pool.metadata?.tenant ?? '';
  const selectedOrg = orgs.find((o) => (o.metadata?.name ?? o.id) === selected);
  const displayName: string = selectedOrg
    ? String(selectedOrg.spec?.title ?? selectedOrg.metadata?.name ?? selectedOrg.id)
    : selected || 'Select tenant';

  const handleSave = async () => {
    await patch.mutateAsync({
      id: pool.id,
      patch: { metadata: { tenant: selected || undefined } },
    });
    onClose();
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={patch.isPending ? undefined : onClose}
      aria-labelledby="assign-tenant-title"
    >
      <ModalHeader
        title={currentTenant ? 'Reassign tenant' : 'Assign tenant'}
        labelId="assign-tenant-title"
      />
      <ModalBody>
        <FormGroup label="Tenant organization" fieldId="assign-tenant-select" isRequired>
          <Select
            isOpen={open}
            onOpenChange={setOpen}
            onSelect={(_e, v) => {
              setSelected(v as string);
              setOpen(false);
            }}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setOpen(!open)}
                isExpanded={open}
                style={{ width: '100%' }}
              >
                {displayName}
              </MenuToggle>
            )}
          >
            <SelectList>
              {orgs.map((o) => {
                const key = o.metadata?.name ?? o.id;
                return (
                  <SelectOption key={key} value={key} description={o.metadata?.name}>
                    {o.spec?.title ?? o.metadata?.name ?? o.id}
                  </SelectOption>
                );
              })}
            </SelectList>
          </Select>
        </FormGroup>
        {patch.error && (
          <Alert
            variant="danger"
            isInline
            title="Failed to assign tenant"
            style={{ marginTop: '1rem' }}
          >
            {getErrorMessage(patch.error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={patch.isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          isDisabled={patch.isPending || !selected}
          isLoading={patch.isPending}
        >
          {currentTenant ? 'Reassign' : 'Assign'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Tenant Assignments Tab
// ---------------------------------------------------------------------------

const TenantAssignmentsTab = ({ pool }: { pool: ExternalIPPool }) => {
  const { data: orgs = [] } = useOrganizations();
  const patch = usePatchExternalIPPool();
  const [assignOpen, setAssignOpen] = useState(false);

  const currentTenant = pool.metadata?.tenant;
  const org = currentTenant
    ? orgs.find((o) => (o.metadata?.name ?? o.id) === currentTenant)
    : undefined;
  const orgTitle: string = org
    ? String(org.spec?.title ?? org.metadata?.name ?? org.id)
    : (currentTenant ?? '');

  const handleRemove = async () => {
    await patch.mutateAsync({ id: pool.id, patch: { metadata: { tenant: undefined } } });
  };

  return (
    <>
      {assignOpen && <AssignTenantModal pool={pool} onClose={() => setAssignOpen(false)} />}
      {patch.error && (
        <Alert variant="danger" isInline title="Operation failed" style={{ marginBottom: '1rem' }}>
          {getErrorMessage(patch.error)}
        </Alert>
      )}

      {!currentTenant ? (
        <EmptyState>
          <Title headingLevel="h4" size="md">
            No tenant assigned
          </Title>
          <EmptyStateBody>
            This pool is shared — any tenant can allocate IPs from it. Assign a tenant to restrict
            it to a single organization.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={() => setAssignOpen(true)}>
                Assign tenant
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
              Reassign tenant
            </Button>
          </div>
          <Table aria-label="Tenant assignments" variant="compact">
            <Thead>
              <Tr>
                <Th>Tenant</Th>
                <Th>Organization ID</Th>
                <Th aria-label="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td dataLabel="Tenant">
                  <strong>{orgTitle ?? currentTenant}</strong>
                </Td>
                <Td dataLabel="Organization ID">
                  <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                    {currentTenant}
                  </code>
                </Td>
                <Td isActionCell>
                  <ActionsColumn
                    items={[
                      {
                        title: 'Reassign',
                        onClick: () => setAssignOpen(true),
                      },
                      {
                        title: 'Remove assignment',
                        onClick: handleRemove,
                        isDanger: true,
                      },
                    ]}
                  />
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ProviderIPPoolDetailPage = () => {
  const { poolType, id } = useParams<{ poolType: string; id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(OVERVIEW_TAB);

  const isPublic = poolType === 'public';
  const backPath = '/provider/ip-pools';

  const {
    data: publicPools = [],
    isLoading: publicLoading,
    error: publicError,
  } = usePublicIPPools();
  const {
    data: externalPools = [],
    isLoading: externalLoading,
    error: externalError,
  } = useExternalIPPools();
  const { data: publicIPs = [] } = usePublicIPs();
  const { data: externalIPs = [] } = useExternalIPs();

  const pools = isPublic ? publicPools : externalPools;
  const isLoading = isPublic ? publicLoading : externalLoading;
  const error = isPublic ? publicError : externalError;

  const pool = pools.find((p) => p.id === id);
  const ips = isPublic
    ? publicIPs.filter((ip) => ip.spec?.pool === id)
    : externalIPs.filter((ip) => ip.spec?.pool === id);

  if (!isLoading && !error && !pool) {
    return (
      <PageSection>
        <Alert variant="warning" isInline title={`Pool not found: ${id}`}>
          <Button variant="link" onClick={() => navigate(backPath)}>
            Back to IP Pools
          </Button>
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate(backPath)} style={{ cursor: 'pointer' }}>
            IP Pools
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{pool?.metadata?.name ?? id}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection>
        <ListPageBody isLoading={isLoading} error={error}>
          {pool && (
            <>
              <div
                style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {pool.metadata?.name ?? pool.id}
                </span>
                <Label color={isPublic ? 'blue' : 'cyan'} isCompact>
                  {isPublic ? 'Public' : 'External'}
                </Label>
                {(pool as ExternalIPPool).metadata?.tenant && (
                  <Label color="purple" isCompact>
                    Tenant: {(pool as ExternalIPPool).metadata?.tenant}
                  </Label>
                )}
              </div>

              <Tabs
                activeKey={activeTab}
                onSelect={(_e, k) => setActiveTab(k as number)}
                aria-label="Pool detail tabs"
              >
                <Tab eventKey={OVERVIEW_TAB} title={<TabTitleText>Overview</TabTitleText>} />
                <Tab
                  eventKey={ALLOCATIONS_TAB}
                  title={<TabTitleText>Allocations ({ips.length})</TabTitleText>}
                />
                {!isPublic && (
                  <Tab
                    eventKey={TENANT_TAB}
                    title={<TabTitleText>Tenant assignments</TabTitleText>}
                  />
                )}
              </Tabs>

              <TabContent
                eventKey={OVERVIEW_TAB}
                activeKey={activeTab}
                hidden={activeTab !== OVERVIEW_TAB}
                id="pool-detail-overview-tab"
              >
                <TabContentBody style={{ paddingTop: '1rem' }}>
                  {(() => {
                    const spec = pool.spec as typeof pool.spec & { cidr?: string; zone?: string };
                    return (
                      <Card>
                        <CardBody>
                          <DescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Pool ID</DescriptionListTerm>
                              <DescriptionListDescription>
                                <code>{pool.id}</code>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>IP family</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Label color="blue" isCompact>
                                  {IP_FAMILY_LABELS[pool.spec?.ipFamily ?? 0] ?? '—'}
                                </Label>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>CIDR block</DescriptionListTerm>
                              <DescriptionListDescription>
                                {spec?.cidr ? (
                                  <code>{spec.cidr}</code>
                                ) : (
                                  <span style={{ color: 'var(--pf-t--global--color--200)' }}>
                                    Not set
                                  </span>
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Zone</DescriptionListTerm>
                              <DescriptionListDescription>
                                {spec?.zone ?? '—'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Available addresses</DescriptionListTerm>
                              <DescriptionListDescription>
                                {String(pool.status?.available ?? '—')}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            {!isPublic && (
                              <DescriptionListGroup>
                                <DescriptionListTerm>Assigned tenant</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {(pool as ExternalIPPool).metadata?.tenant ? (
                                    <Label color="purple" isCompact>
                                      {(pool as ExternalIPPool).metadata?.tenant}
                                    </Label>
                                  ) : (
                                    <span style={{ color: 'var(--pf-t--global--color--200)' }}>
                                      Not scoped (shared)
                                    </span>
                                  )}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            )}
                            <DescriptionListGroup>
                              <DescriptionListTerm>Created</DescriptionListTerm>
                              <DescriptionListDescription>
                                {pool.metadata?.creationTimestamp
                                  ? new Date(pool.metadata.creationTimestamp).toLocaleString()
                                  : '—'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Pool type</DescriptionListTerm>
                              <DescriptionListDescription>
                                {isPublic
                                  ? 'Public (tenant workload IPs)'
                                  : 'External (cluster/infra IPs)'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </CardBody>
                      </Card>
                    );
                  })()}
                </TabContentBody>
              </TabContent>

              <TabContent
                eventKey={ALLOCATIONS_TAB}
                activeKey={activeTab}
                hidden={activeTab !== ALLOCATIONS_TAB}
                id="pool-detail-allocations-tab"
              >
                <TabContentBody style={{ paddingTop: '1rem' }}>
                  {ips.length === 0 ? (
                    <Alert variant="info" isInline title="No IPs allocated from this pool yet." />
                  ) : (
                    <Table aria-label="Pool allocations" variant="compact">
                      <Thead>
                        <Tr>
                          <Th>Address</Th>
                          <Th>State</Th>
                          <Th>Attached</Th>
                          <Th>Pool ref</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {ips.map((ip) => (
                          <Tr key={ip.id}>
                            <Td dataLabel="Address">
                              <strong>{ip.status?.address || '—'}</strong>
                            </Td>
                            <Td dataLabel="State">
                              <IPStateLabel state={ip.status?.state} />
                            </Td>
                            <Td dataLabel="Attached">
                              {ip.status?.attached ? (
                                <Label color="green" isCompact>
                                  Yes
                                </Label>
                              ) : (
                                <Label color="grey" isCompact>
                                  No
                                </Label>
                              )}
                            </Td>
                            <Td dataLabel="Pool ref">{ip.status?.pool || ip.spec?.pool || '—'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </TabContentBody>
              </TabContent>

              {!isPublic && (
                <TabContent
                  eventKey={TENANT_TAB}
                  activeKey={activeTab}
                  hidden={activeTab !== TENANT_TAB}
                  id="pool-detail-tenant-tab"
                >
                  <TabContentBody style={{ paddingTop: '1rem' }}>
                    <TenantAssignmentsTab pool={pool as ExternalIPPool} />
                  </TabContentBody>
                </TabContent>
              )}
            </>
          )}
        </ListPageBody>
      </PageSection>
    </>
  );
};
