/**
 * flow: provider-admin
 * route: /provider/catalog-studio
 */
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
  LabelGroup,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabTitleText,
  Tabs,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import ArrowRightIcon from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type {
  BareMetalInstanceCatalogItem,
  BareMetalInstanceTemplate,
  ClusterCatalogItem,
  ClusterTemplate,
  ComputeInstanceCatalogItem,
  ComputeInstanceTemplate,
  HostType,
  InstanceType,
} from '@osac/types';

import { useAiEnvironments } from '../../api/v1/ai-environment';
import { usePatchAiEnvironment } from '../../api/v1/ai-environment';
import {
  useAllBareMetalInstanceCatalogItems,
  usePatchBareMetalInstanceCatalogItem,
} from '../../api/v1/baremetal-instance-catalog-item';
import { useBareMetalInstanceTemplates } from '../../api/v1/baremetal-instance-templates';
import { useClusters } from '../../api/v1/cluster';
import {
  useAllClusterCatalogItems,
  usePatchClusterCatalogItem,
} from '../../api/v1/cluster-catalog-item';
import {
  clusterTemplateNodeSetsSummary,
  isAiGridTemplate,
  useClusterTemplates,
} from '../../api/v1/cluster-templates';
import {
  useAllComputeInstanceCatalogItems,
  usePatchComputeInstanceCatalogItem,
} from '../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplates } from '../../api/v1/compute-instance-templates';
import {
  hostTypePricePerHour,
  isGpuHostType,
  useHostTypes,
  usePatchHostType,
} from '../../api/v1/host-types';
import {
  formatInstanceTypeSizing,
  instanceTypeName,
  instanceTypePricePerHour,
  useInstanceTypes,
  usePatchInstanceType,
} from '../../api/v1/instance-types';
import {
  useAllMaaSCatalogItems,
  useDeleteMaaSCatalogItem,
  usePatchMaaSCatalogItem,
} from '../../api/v1/maas-catalog-item';
import type { AiEnvironment, AiEnvironmentState, ModelCatalogItem } from '../../api/v1/maas-types';
import type {
  CatalogItemForDisplay,
  CatalogItemKind,
} from '../../components/catalog/catalogItemDisplay';
import { EditPriceModal } from '../../components/catalog/EditPriceModal';
import { ManageCatalogItemTenantsModal } from '../../components/catalog/ManageCatalogItemTenantsModal';
import { ResourceKpiHeader } from '../../components/Resource/Header';

// ── Helpers ──────────────────────────────────────────────────────────────────

function labelPrice(labels?: Record<string, string> | null): string | null {
  const v = labels?.['price_per_hour'];
  return v ? `$${parseFloat(v).toFixed(2)}/hr` : null;
}

// ── Pipeline Tab ──────────────────────────────────────────────────────────────

type PipelineRow = {
  hardware: { id: string; name: string; price: string | null; isGpu: boolean };
  template: { id: string; name: string; kind: 'vm' | 'cluster' | 'bm'; isAi: boolean } | null;
  catalogItem: { id: string; title: string; published: boolean } | null;
};

function PipelineTab({
  hostTypes,
  instanceTypes,
  vmTemplates,
  clTemplates,
  bmTemplates,
  vmCatalogItems,
  clCatalogItems,
  bmCatalogItems,
}: {
  hostTypes: HostType[];
  instanceTypes: InstanceType[];
  vmTemplates: ComputeInstanceTemplate[];
  clTemplates: ClusterTemplate[];
  bmTemplates: BareMetalInstanceTemplate[];
  vmCatalogItems: ComputeInstanceCatalogItem[];
  clCatalogItems: ClusterCatalogItem[];
  bmCatalogItems: BareMetalInstanceCatalogItem[];
}) {
  // Build rows: cluster templates → host types (via nodeSets)
  const rows: PipelineRow[] = [];

  // Cluster templates keyed by host type
  for (const clTpl of clTemplates) {
    const hostTypeIds = Object.values(clTpl.nodeSets ?? {})
      .map((ns) => (ns as { hostType?: string }).hostType ?? '')
      .filter(Boolean);
    const uniqueHt = [...new Set(hostTypeIds)];
    const tplCatalogItem = clCatalogItems.find(
      (ci) => ci.template === (clTpl.metadata?.name ?? clTpl.id),
    );
    if (uniqueHt.length === 0) {
      rows.push({
        hardware: { id: '', name: '—', price: null, isGpu: false },
        template: {
          id: clTpl.id,
          name: clTpl.metadata?.name ?? clTpl.id,
          kind: 'cluster',
          isAi: isAiGridTemplate(clTpl),
        },
        catalogItem: tplCatalogItem
          ? {
              id: tplCatalogItem.id,
              title: tplCatalogItem.title,
              published: Boolean(tplCatalogItem.published),
            }
          : null,
      });
    } else {
      for (const htId of uniqueHt) {
        const ht = hostTypes.find((h) => (h.metadata?.name ?? h.id) === htId) ?? null;
        rows.push({
          hardware: ht
            ? {
                id: ht.id,
                name: ht.metadata?.name ?? ht.id,
                price:
                  hostTypePricePerHour(ht) !== null
                    ? `$${hostTypePricePerHour(ht)!.toFixed(2)}/hr`
                    : null,
                isGpu: isGpuHostType(ht),
              }
            : { id: htId, name: htId, price: null, isGpu: false },
          template: {
            id: clTpl.id,
            name: clTpl.metadata?.name ?? clTpl.id,
            kind: 'cluster',
            isAi: isAiGridTemplate(clTpl),
          },
          catalogItem: tplCatalogItem
            ? {
                id: tplCatalogItem.id,
                title: tplCatalogItem.title,
                published: Boolean(tplCatalogItem.published),
              }
            : null,
        });
      }
    }
  }

  // VM templates → instance types
  for (const vmTpl of vmTemplates) {
    const itName = (vmTpl.specDefaults as Record<string, unknown> | undefined)?.['instanceType'] as
      | string
      | undefined;
    const it = instanceTypes.find((i) => (i.metadata?.name ?? i.id) === itName) ?? null;
    const tplCatalogItem = vmCatalogItems.find(
      (ci) => ci.template === (vmTpl.metadata?.name ?? vmTpl.id),
    );
    rows.push({
      hardware: it
        ? {
            id: it.id,
            name: instanceTypeName(it),
            price:
              instanceTypePricePerHour(it) !== null
                ? `$${instanceTypePricePerHour(it)!.toFixed(2)}/hr`
                : null,
            isGpu: false,
          }
        : {
            id: itName ?? '',
            name: itName ? `${itName} (InstanceType)` : '—',
            price: null,
            isGpu: false,
          },
      template: { id: vmTpl.id, name: vmTpl.metadata?.name ?? vmTpl.id, kind: 'vm', isAi: false },
      catalogItem: tplCatalogItem
        ? {
            id: tplCatalogItem.id,
            title: tplCatalogItem.title,
            published: Boolean(tplCatalogItem.published),
          }
        : null,
    });
  }

  // BM templates → host types
  for (const bmTpl of bmTemplates) {
    const htName = (bmTpl.specDefaults as Record<string, unknown> | undefined)?.['hostType'] as
      | string
      | undefined;
    const ht = hostTypes.find((h) => (h.metadata?.name ?? h.id) === htName) ?? null;
    const tplCatalogItem = bmCatalogItems.find(
      (ci) => ci.template === (bmTpl.metadata?.name ?? bmTpl.id),
    );
    rows.push({
      hardware: ht
        ? {
            id: ht.id,
            name: ht.metadata?.name ?? ht.id,
            price:
              hostTypePricePerHour(ht) !== null
                ? `$${hostTypePricePerHour(ht)!.toFixed(2)}/hr`
                : null,
            isGpu: isGpuHostType(ht),
          }
        : {
            id: htName ?? '',
            name: htName ? `${htName} (HostType)` : '—',
            price: null,
            isGpu: false,
          },
      template: { id: bmTpl.id, name: bmTpl.metadata?.name ?? bmTpl.id, kind: 'bm', isAi: false },
      catalogItem: tplCatalogItem
        ? {
            id: tplCatalogItem.id,
            title: tplCatalogItem.title,
            published: Boolean(tplCatalogItem.published),
          }
        : null,
    });
  }

  const kindBadge = (kind: 'vm' | 'cluster' | 'bm') => {
    if (kind === 'vm') {
      return (
        <Label isCompact color="blue">
          VM
        </Label>
      );
    }
    if (kind === 'cluster') {
      return (
        <Label isCompact color="purple">
          Cluster
        </Label>
      );
    }
    return (
      <Label isCompact color="orange">
        BM
      </Label>
    );
  };

  return (
    <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
      <Grid hasGutter style={{ minWidth: '800px' }}>
        {/* Column headers */}
        <GridItem span={3}>
          <Content component="h3">Hardware</Content>
          <Content
            component="small"
            style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
          >
            HostType / InstanceType
          </Content>
        </GridItem>
        <GridItem
          span={1}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowRightIcon />
        </GridItem>
        <GridItem span={4}>
          <Content component="h3">Template</Content>
          <Content
            component="small"
            style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
          >
            VM / Cluster / BM template
          </Content>
        </GridItem>
        <GridItem
          span={1}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowRightIcon />
        </GridItem>
        <GridItem span={3}>
          <Content component="h3">Catalog Item</Content>
          <Content
            component="small"
            style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
          >
            Published to tenants
          </Content>
        </GridItem>

        {/* Rows */}
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            <GridItem span={3}>
              <Card
                isCompact
                style={{
                  borderLeft: row.hardware.isGpu
                    ? '3px solid var(--pf-t--global--color--status--warning--default)'
                    : undefined,
                }}
              >
                <CardBody>
                  <strong>{row.hardware.name}</strong>
                  <div>
                    <LabelGroup>
                      {row.hardware.isGpu && (
                        <Label isCompact color="yellow">
                          GPU
                        </Label>
                      )}
                      {row.hardware.price && (
                        <Label isCompact color="green">
                          {row.hardware.price}
                        </Label>
                      )}
                      {!row.hardware.price && (
                        <Label isCompact color="grey">
                          No price
                        </Label>
                      )}
                    </LabelGroup>
                  </div>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem
              span={1}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowRightIcon color="var(--pf-t--global--color--nonstatus--gray--default)" />
            </GridItem>
            <GridItem span={4}>
              {row.template ? (
                <Card
                  isCompact
                  style={{
                    borderLeft: row.template.isAi
                      ? '3px solid var(--pf-t--global--color--status--warning--default)'
                      : undefined,
                  }}
                >
                  <CardBody>
                    <Flex
                      spaceItems={{ default: 'spaceItemsSm' }}
                      alignItems={{ default: 'alignItemsCenter' }}
                    >
                      {kindBadge(row.template.kind)}
                      {row.template.isAi && (
                        <Label isCompact color="yellow">
                          AI Grid
                        </Label>
                      )}
                    </Flex>
                    <strong>{row.template.name}</strong>
                  </CardBody>
                </Card>
              ) : (
                <Card isCompact>
                  <CardBody
                    style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
                  >
                    —
                  </CardBody>
                </Card>
              )}
            </GridItem>
            <GridItem
              span={1}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowRightIcon color="var(--pf-t--global--color--nonstatus--gray--default)" />
            </GridItem>
            <GridItem span={3}>
              {row.catalogItem ? (
                <Card isCompact>
                  <CardBody>
                    <Flex
                      spaceItems={{ default: 'spaceItemsSm' }}
                      alignItems={{ default: 'alignItemsCenter' }}
                    >
                      {row.catalogItem.published ? (
                        <>
                          <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" />
                          <Label isCompact color="green">
                            Published
                          </Label>
                        </>
                      ) : (
                        <>
                          <ExclamationCircleIcon color="var(--pf-t--global--color--nonstatus--gray--default)" />
                          <Label isCompact color="grey">
                            Draft
                          </Label>
                        </>
                      )}
                    </Flex>
                    <strong>{row.catalogItem.title}</strong>
                  </CardBody>
                </Card>
              ) : (
                <Card isCompact>
                  <CardBody
                    style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
                  >
                    No catalog item
                  </CardBody>
                </Card>
              )}
            </GridItem>
          </React.Fragment>
        ))}

        {rows.length === 0 && (
          <GridItem span={12}>
            <Content>
              No templates defined yet. Create host types and templates to build your pipeline.
            </Content>
          </GridItem>
        )}
      </Grid>
    </div>
  );
}

// ── Hardware Tab ───────────────────────────────────────────────────────────────

const AI_STATE_COLORS: Record<AiEnvironmentState, 'green' | 'blue' | 'red' | 'grey'> = {
  READY: 'green',
  PROVISIONING: 'blue',
  FAILED: 'red',
  PENDING: 'grey',
};

function HardwareTab({
  hostTypes,
  instanceTypes,
  aiEnvironments,
  clusterNameById,
  patchHostType,
  patchInstanceType,
  patchAiEnvironment,
  onManageAi,
}: {
  hostTypes: HostType[];
  instanceTypes: InstanceType[];
  aiEnvironments: AiEnvironment[];
  clusterNameById: Map<string, string>;
  patchHostType: ReturnType<typeof usePatchHostType>;
  patchInstanceType: ReturnType<typeof usePatchInstanceType>;
  patchAiEnvironment: ReturnType<typeof usePatchAiEnvironment>;
  onManageAi: () => void;
}) {
  const [editPriceHT, setEditPriceHT] = useState<HostType | null>(null);
  const [editPriceIT, setEditPriceIT] = useState<InstanceType | null>(null);
  const [editPriceAI, setEditPriceAI] = useState<AiEnvironment | null>(null);

  return (
    <>
      {editPriceHT && (
        <EditPriceModal
          resourceName={editPriceHT.title || editPriceHT.metadata?.name || editPriceHT.id}
          currentPrice={hostTypePricePerHour(editPriceHT)?.toString() ?? ''}
          onClose={() => setEditPriceHT(null)}
          error={patchHostType.error}
          onSave={async (price) => {
            await patchHostType.mutateAsync({
              id: editPriceHT.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<HostType>,
            });
            setEditPriceHT(null);
          }}
        />
      )}
      {editPriceIT && (
        <EditPriceModal
          resourceName={instanceTypeName(editPriceIT)}
          currentPrice={instanceTypePricePerHour(editPriceIT)?.toString() ?? ''}
          onClose={() => setEditPriceIT(null)}
          error={patchInstanceType.error}
          onSave={async (price) => {
            await patchInstanceType.mutateAsync({
              id: editPriceIT.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<InstanceType>,
            });
            setEditPriceIT(null);
          }}
        />
      )}
      {editPriceAI && (
        <EditPriceModal
          resourceName={editPriceAI.metadata?.name ?? editPriceAI.id}
          currentPrice={editPriceAI.metadata?.labels?.['price_per_hour'] ?? ''}
          onClose={() => setEditPriceAI(null)}
          error={patchAiEnvironment.error}
          onSave={async (price) => {
            await patchAiEnvironment.mutateAsync({
              id: editPriceAI.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<AiEnvironment>,
            });
            setEditPriceAI(null);
          }}
        />
      )}

      <Stack hasGutter>
        <StackItem>
          <Card>
            <CardHeader>
              <CardTitle>Host Types</CardTitle>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table aria-label="Host types" variant="compact">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Title</Th>
                    <Th>Tags</Th>
                    <Th>Price / hr</Th>
                    <Th aria-label="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {hostTypes.length === 0 ? (
                    <Tr>
                      <Td colSpan={5}>No host types defined.</Td>
                    </Tr>
                  ) : (
                    hostTypes.map((ht) => (
                      <Tr key={ht.id}>
                        <Td dataLabel="Name">
                          <strong>{ht.metadata?.name ?? ht.id}</strong>
                        </Td>
                        <Td dataLabel="Title">{ht.title || '—'}</Td>
                        <Td dataLabel="Tags">
                          <LabelGroup>
                            {isGpuHostType(ht) && (
                              <Label isCompact color="orange">
                                GPU
                              </Label>
                            )}
                            {ht.metadata?.labels?.['gpu_model'] && (
                              <Label isCompact color="yellow">
                                {ht.metadata.labels['gpu_model']}
                              </Label>
                            )}
                          </LabelGroup>
                        </Td>
                        <Td dataLabel="Price / hr">
                          {hostTypePricePerHour(ht) !== null
                            ? `$${hostTypePricePerHour(ht)!.toFixed(2)}/hr`
                            : '—'}
                        </Td>
                        <Td isActionCell>
                          <Button variant="secondary" size="sm" onClick={() => setEditPriceHT(ht)}>
                            Edit price
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </StackItem>

        <StackItem>
          <Card>
            <CardHeader>
              <CardTitle>Instance Types</CardTitle>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table aria-label="Instance types" variant="compact">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Sizing</Th>
                    <Th>Price / hr</Th>
                    <Th aria-label="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {instanceTypes.length === 0 ? (
                    <Tr>
                      <Td colSpan={4}>No instance types defined.</Td>
                    </Tr>
                  ) : (
                    instanceTypes.map((it) => (
                      <Tr key={it.id}>
                        <Td dataLabel="Name">
                          <strong>{instanceTypeName(it)}</strong>
                        </Td>
                        <Td dataLabel="Sizing">{formatInstanceTypeSizing(it)}</Td>
                        <Td dataLabel="Price / hr">
                          {instanceTypePricePerHour(it) !== null
                            ? `$${instanceTypePricePerHour(it)!.toFixed(2)}/hr`
                            : '—'}
                        </Td>
                        <Td isActionCell>
                          <Button variant="secondary" size="sm" onClick={() => setEditPriceIT(it)}>
                            Edit price
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </StackItem>

        <StackItem>
          <Card>
            <CardHeader>
              <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ width: '100%' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <CardTitle>AI Environments</CardTitle>
                </FlexItem>
                <FlexItem>
                  <Button variant="link" isInline onClick={onManageAi}>
                    Manage AI setup →
                  </Button>
                </FlexItem>
              </Flex>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table aria-label="AI environments" variant="compact">
                <Thead>
                  <Tr>
                    <Th>Cluster</Th>
                    <Th>RHOAI version</Th>
                    <Th>Registered models</Th>
                    <Th>Gateway endpoint</Th>
                    <Th>Price / hr</Th>
                    <Th>Status</Th>
                    <Th aria-label="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {aiEnvironments.length === 0 ? (
                    <Tr>
                      <Td colSpan={7}>
                        No AI environments configured.{' '}
                        <Button variant="link" isInline onClick={onManageAi}>
                          Enable AI on a cluster →
                        </Button>
                      </Td>
                    </Tr>
                  ) : (
                    aiEnvironments.map((env) => {
                      const clusterId = env.spec?.clusterId ?? '';
                      const clusterName = clusterNameById.get(clusterId) ?? clusterId;
                      const state = env.status?.state;
                      const priceRaw = env.metadata?.labels?.['price_per_hour'];
                      const price = priceRaw ? `$${parseFloat(priceRaw).toFixed(2)}/hr` : null;
                      return (
                        <Tr key={env.id}>
                          <Td dataLabel="Cluster">
                            <strong>{clusterName}</strong>
                          </Td>
                          <Td dataLabel="RHOAI version">{env.spec?.rhoaiVersion ?? '—'}</Td>
                          <Td dataLabel="Registered models">
                            <LabelGroup>
                              {(env.spec?.registeredModels ?? []).map((m) => (
                                <Label key={m} isCompact color="yellow">
                                  {m}
                                </Label>
                              ))}
                            </LabelGroup>
                          </Td>
                          <Td dataLabel="Gateway endpoint">
                            {env.spec?.gatewayEndpoint ? (
                              <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                                {env.spec.gatewayEndpoint}
                              </code>
                            ) : (
                              '—'
                            )}
                          </Td>
                          <Td dataLabel="Price / hr">
                            {price ? (
                              <Label isCompact color="green">
                                {price}
                              </Label>
                            ) : (
                              '—'
                            )}
                          </Td>
                          <Td dataLabel="Status">
                            {state ? (
                              <Label isCompact color={AI_STATE_COLORS[state] ?? 'grey'}>
                                {state}
                              </Label>
                            ) : (
                              <Label isCompact color="grey">
                                Unknown
                              </Label>
                            )}
                          </Td>
                          <Td isActionCell>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditPriceAI(env)}
                            >
                              Edit price
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </>
  );
}

// ── Templates Tab ──────────────────────────────────────────────────────────────

type TemplateSubKind = 'vm' | 'cluster' | 'bm';

function TemplatesTab({
  vmTemplates,
  clTemplates,
  bmTemplates,
  onCreateCatalogItem,
}: {
  vmTemplates: ComputeInstanceTemplate[];
  clTemplates: ClusterTemplate[];
  bmTemplates: BareMetalInstanceTemplate[];
  onCreateCatalogItem: (templateId: string) => void;
}) {
  const [subKind, setSubKind] = useState<TemplateSubKind>('vm');

  return (
    <>
      <ToggleGroup aria-label="Template kind" style={{ marginBottom: '1rem' }}>
        <ToggleGroupItem
          text="VM"
          buttonId="tpl-vm"
          isSelected={subKind === 'vm'}
          onChange={() => setSubKind('vm')}
        />
        <ToggleGroupItem
          text="Cluster"
          buttonId="tpl-cluster"
          isSelected={subKind === 'cluster'}
          onChange={() => setSubKind('cluster')}
        />
        <ToggleGroupItem
          text="Bare Metal"
          buttonId="tpl-bm"
          isSelected={subKind === 'bm'}
          onChange={() => setSubKind('bm')}
        />
      </ToggleGroup>

      {subKind === 'vm' && (
        <Table aria-label="VM templates" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Title</Th>
              <Th>Default instance type</Th>
              <Th>Default image</Th>
              <Th aria-label="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {vmTemplates.length === 0 ? (
              <Tr>
                <Td colSpan={5}>No VM templates.</Td>
              </Tr>
            ) : (
              vmTemplates.map((t) => {
                const sd = t.specDefaults as Record<string, unknown> | undefined;
                return (
                  <Tr key={t.id}>
                    <Td>
                      <strong>{t.metadata?.name ?? t.id}</strong>
                    </Td>
                    <Td>{t.title || '—'}</Td>
                    <Td>{(sd?.['instanceType'] as string) || '—'}</Td>
                    <Td>
                      {(() => {
                        const img = sd?.['image'];
                        if (!img) {
                          return '—';
                        }
                        if (typeof img === 'string') {
                          return img;
                        }
                        const r = img as Record<string, unknown>;
                        return (r['sourceRef'] as string) || (r['source_ref'] as string) || '—';
                      })()}
                    </Td>
                    <Td isActionCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onCreateCatalogItem(t.metadata?.name ?? t.id)}
                      >
                        Create catalog item
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      )}

      {subKind === 'cluster' && (
        <Table aria-label="Cluster templates" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Title</Th>
              <Th>Node sets</Th>
              <Th>Tags</Th>
              <Th aria-label="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {clTemplates.length === 0 ? (
              <Tr>
                <Td colSpan={5}>No cluster templates.</Td>
              </Tr>
            ) : (
              clTemplates.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <strong>{t.metadata?.name ?? t.id}</strong>
                  </Td>
                  <Td>{t.title || '—'}</Td>
                  <Td>{clusterTemplateNodeSetsSummary(t)}</Td>
                  <Td>
                    <LabelGroup>
                      {isAiGridTemplate(t) && (
                        <Label isCompact color="yellow">
                          AI Grid
                        </Label>
                      )}
                    </LabelGroup>
                  </Td>
                  <Td isActionCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCreateCatalogItem(t.metadata?.name ?? t.id)}
                    >
                      Create catalog item
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}

      {subKind === 'bm' && (
        <Table aria-label="BM templates" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Title</Th>
              <Th>Default host type</Th>
              <Th aria-label="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {bmTemplates.length === 0 ? (
              <Tr>
                <Td colSpan={4}>No bare metal templates.</Td>
              </Tr>
            ) : (
              bmTemplates.map((t) => {
                const sd = t.specDefaults as Record<string, unknown> | undefined;
                return (
                  <Tr key={t.id}>
                    <Td>
                      <strong>{t.metadata?.name ?? t.id}</strong>
                    </Td>
                    <Td>{t.title || '—'}</Td>
                    <Td>{(sd?.['hostType'] as string) || '—'}</Td>
                    <Td isActionCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onCreateCatalogItem(t.metadata?.name ?? t.id)}
                      >
                        Create catalog item
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      )}
    </>
  );
}

// ── Catalog Items Tab ──────────────────────────────────────────────────────────

/** Format MaaS token pricing into a human-readable string */
function maasPrice(labels?: Record<string, string> | null): string | null {
  const input = labels?.['price_per_input_token'];
  const output = labels?.['price_per_output_token'];
  if (!input && !output) {
    return null;
  }
  const fmt = (v: string) => `$${parseFloat(v).toFixed(4)}`;
  if (input && output) {
    return `${fmt(input)} in / ${fmt(output)} out /tok`;
  }
  return `${fmt((input ?? output)!)}/tok`;
}

type UnifiedCatalogItem = {
  id: string;
  kind: 'VM' | 'Cluster' | 'BM' | 'MaaS';
  title: string;
  template: string;
  price: string | null;
  published: boolean;
  allowedTenants: string[];
  raw:
    | ComputeInstanceCatalogItem
    | ClusterCatalogItem
    | BareMetalInstanceCatalogItem
    | ModelCatalogItem;
};

function CatalogItemsTab({
  vmCatalogItems,
  clCatalogItems,
  bmCatalogItems,
  maasCatalogItems,
  patchVm,
  patchCl,
  patchBm,
  patchMaaS,
  deleteMaaS,
  onCreateItem,
}: {
  vmCatalogItems: ComputeInstanceCatalogItem[];
  clCatalogItems: ClusterCatalogItem[];
  bmCatalogItems: BareMetalInstanceCatalogItem[];
  maasCatalogItems: ModelCatalogItem[];
  patchVm: ReturnType<typeof usePatchComputeInstanceCatalogItem>;
  patchCl: ReturnType<typeof usePatchClusterCatalogItem>;
  patchBm: ReturnType<typeof usePatchBareMetalInstanceCatalogItem>;
  patchMaaS: ReturnType<typeof usePatchMaaSCatalogItem>;
  deleteMaaS: ReturnType<typeof useDeleteMaaSCatalogItem>;
  onCreateItem: () => void;
}) {
  const [manageTenantsTarget, setManageTenantsTarget] = useState<{
    item: CatalogItemForDisplay;
    kind: CatalogItemKind;
  } | null>(null);

  const items: UnifiedCatalogItem[] = useMemo(
    () => [
      ...vmCatalogItems.map((ci) => ({
        id: ci.id,
        kind: 'VM' as const,
        title: ci.title,
        template: ci.template ?? '—',
        price: labelPrice(ci.metadata?.labels),
        published: Boolean(ci.published),
        allowedTenants: (ci as unknown as { allowed_tenants?: string[] }).allowed_tenants ?? [],
        raw: ci,
      })),
      ...clCatalogItems.map((ci) => ({
        id: ci.id,
        kind: 'Cluster' as const,
        title: ci.title,
        template: ci.template ?? '—',
        price: labelPrice(ci.metadata?.labels),
        published: Boolean(ci.published),
        allowedTenants: (ci as unknown as { allowed_tenants?: string[] }).allowed_tenants ?? [],
        raw: ci,
      })),
      ...bmCatalogItems.map((ci) => ({
        id: ci.id,
        kind: 'BM' as const,
        title: ci.title,
        template: ci.template ?? '—',
        price: labelPrice(ci.metadata?.labels),
        published: Boolean(ci.published),
        allowedTenants: (ci as unknown as { allowed_tenants?: string[] }).allowed_tenants ?? [],
        raw: ci,
      })),
      ...maasCatalogItems.map((ci) => ({
        id: ci.id,
        kind: 'MaaS' as const,
        title: ci.title,
        template: '—',
        price: maasPrice(ci.metadata?.labels),
        published: Boolean(ci.published),
        allowedTenants: ci.allowed_tenants ?? [],
        raw: ci,
      })),
    ],
    [vmCatalogItems, clCatalogItems, bmCatalogItems, maasCatalogItems],
  );

  const togglePublished = async (item: UnifiedCatalogItem) => {
    const patch = { published: !item.published } as Partial<ComputeInstanceCatalogItem>;
    if (item.kind === 'VM') {
      await patchVm.mutateAsync({ id: item.id, patch });
    } else if (item.kind === 'Cluster') {
      await patchCl.mutateAsync({ id: item.id, patch: patch as Partial<ClusterCatalogItem> });
    } else if (item.kind === 'BM') {
      await patchBm.mutateAsync({
        id: item.id,
        patch: patch as Partial<BareMetalInstanceCatalogItem>,
      });
    } else {
      await patchMaaS.mutateAsync({ id: item.id, patch: { published: !item.published } });
    }
  };

  const kindColor: Record<UnifiedCatalogItem['kind'], 'blue' | 'purple' | 'orange' | 'teal'> = {
    VM: 'blue',
    Cluster: 'purple',
    BM: 'orange',
    MaaS: 'teal',
  };

  const kindToItemKind = (k: UnifiedCatalogItem['kind']): CatalogItemKind =>
    k === 'VM' ? 'vm' : k === 'Cluster' ? 'cluster' : k === 'BM' ? 'baremetal' : 'maas';

  const isPending =
    patchVm.isPending ||
    patchCl.isPending ||
    patchBm.isPending ||
    patchMaaS.isPending ||
    deleteMaaS.isPending;

  return (
    <>
      {manageTenantsTarget && (
        <ManageCatalogItemTenantsModal
          item={manageTenantsTarget.item}
          kind={manageTenantsTarget.kind}
          onClose={() => setManageTenantsTarget(null)}
          onSuccess={() => setManageTenantsTarget(null)}
        />
      )}
      <Flex style={{ marginBottom: '1rem' }} justifyContent={{ default: 'justifyContentFlexEnd' }}>
        <FlexItem>
          <Button variant="primary" onClick={onCreateItem}>
            Create catalog item
          </Button>
        </FlexItem>
      </Flex>
      <Table aria-label="Catalog items" variant="compact">
        <Thead>
          <Tr>
            <Th>Kind</Th>
            <Th>Title</Th>
            <Th>Template</Th>
            <Th>Price</Th>
            <Th>Published</Th>
            <Th>Access</Th>
            <Th aria-label="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={7}>No catalog items yet.</Td>
            </Tr>
          ) : (
            items.map((item) => (
              <Tr key={`${item.kind}-${item.id}`}>
                <Td dataLabel="Kind">
                  <Label isCompact color={kindColor[item.kind]}>
                    {item.kind}
                  </Label>
                </Td>
                <Td dataLabel="Title">
                  <strong>{item.title}</strong>
                </Td>
                <Td dataLabel="Template">{item.template}</Td>
                <Td dataLabel="Price">{item.price ?? '—'}</Td>
                <Td dataLabel="Published">
                  {item.published ? (
                    <Label isCompact color="green">
                      <CheckCircleIcon /> Published
                    </Label>
                  ) : (
                    <Label isCompact color="grey">
                      Draft
                    </Label>
                  )}
                </Td>
                <Td dataLabel="Access">
                  {item.allowedTenants.length === 0 ? (
                    <Label isCompact color="green">
                      All tenants
                    </Label>
                  ) : (
                    <Label isCompact color="orange">
                      {item.allowedTenants.length} tenant{item.allowedTenants.length > 1 ? 's' : ''}
                    </Label>
                  )}
                </Td>
                <Td isActionCell>
                  <ActionsColumn
                    items={[
                      {
                        title: item.published ? 'Unpublish' : 'Publish',
                        onClick: () => togglePublished(item),
                        isDisabled: isPending,
                      },
                      {
                        title: 'Manage access',
                        onClick: () =>
                          setManageTenantsTarget({
                            item: item.raw as unknown as CatalogItemForDisplay,
                            kind: kindToItemKind(item.kind),
                          }),
                      },
                      ...(item.kind === 'MaaS'
                        ? [
                            {
                              title: 'Delete',
                              onClick: () => deleteMaaS.mutate(item.id),
                              isDanger: true,
                            },
                          ]
                        : []),
                    ]}
                  />
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </>
  );
}

// ── Pricing Tab ────────────────────────────────────────────────────────────────

type PricingRow = {
  kind: string;
  name: string;
  price: string | null;
  rawPrice: number | null;
  onEdit: () => void;
};

function PricingTab({
  hostTypes,
  instanceTypes,
  aiEnvironments,
  clusterNameById,
  vmCatalogItems,
  clCatalogItems,
  bmCatalogItems,
  patchHostType,
  patchInstanceType,
  patchAiEnvironment,
  patchVm,
  patchCl,
  patchBm,
}: {
  hostTypes: HostType[];
  instanceTypes: InstanceType[];
  aiEnvironments: AiEnvironment[];
  clusterNameById: Map<string, string>;
  vmCatalogItems: ComputeInstanceCatalogItem[];
  clCatalogItems: ClusterCatalogItem[];
  bmCatalogItems: BareMetalInstanceCatalogItem[];
  patchHostType: ReturnType<typeof usePatchHostType>;
  patchInstanceType: ReturnType<typeof usePatchInstanceType>;
  patchAiEnvironment: ReturnType<typeof usePatchAiEnvironment>;
  patchVm: ReturnType<typeof usePatchComputeInstanceCatalogItem>;
  patchCl: ReturnType<typeof usePatchClusterCatalogItem>;
  patchBm: ReturnType<typeof usePatchBareMetalInstanceCatalogItem>;
}) {
  const [editTarget, setEditTarget] = useState<{
    name: string;
    current: string;
    onSave: (p: string) => Promise<void>;
    error?: unknown;
  } | null>(null);

  const rows: PricingRow[] = useMemo(() => {
    const list: PricingRow[] = [];
    for (const ht of hostTypes) {
      const p = hostTypePricePerHour(ht);
      list.push({
        kind: 'HostType',
        name: ht.metadata?.name ?? ht.id,
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: ht.metadata?.name ?? ht.id,
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchHostType.mutateAsync({
                id: ht.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<HostType>,
              });
            },
            error: patchHostType.error,
          }),
      });
    }
    for (const it of instanceTypes) {
      const p = instanceTypePricePerHour(it);
      list.push({
        kind: 'InstanceType',
        name: instanceTypeName(it),
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: instanceTypeName(it),
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchInstanceType.mutateAsync({
                id: it.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<InstanceType>,
              });
            },
            error: patchInstanceType.error,
          }),
      });
    }
    for (const ci of vmCatalogItems) {
      const p = ci.metadata?.labels?.['price_per_hour']
        ? parseFloat(ci.metadata.labels['price_per_hour'])
        : null;
      list.push({
        kind: 'VM Catalog Item',
        name: ci.title,
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: ci.title,
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchVm.mutateAsync({
                id: ci.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<ComputeInstanceCatalogItem>,
              });
            },
            error: patchVm.error,
          }),
      });
    }
    for (const ci of clCatalogItems) {
      const p = ci.metadata?.labels?.['price_per_hour']
        ? parseFloat(ci.metadata.labels['price_per_hour'])
        : null;
      list.push({
        kind: 'Cluster Catalog Item',
        name: ci.title,
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: ci.title,
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchCl.mutateAsync({
                id: ci.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<ClusterCatalogItem>,
              });
            },
            error: patchCl.error,
          }),
      });
    }
    for (const ci of bmCatalogItems) {
      const p = ci.metadata?.labels?.['price_per_hour']
        ? parseFloat(ci.metadata.labels['price_per_hour'])
        : null;
      list.push({
        kind: 'BM Catalog Item',
        name: ci.title,
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: ci.title,
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchBm.mutateAsync({
                id: ci.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<BareMetalInstanceCatalogItem>,
              });
            },
            error: patchBm.error,
          }),
      });
    }
    for (const env of aiEnvironments) {
      const priceRaw = env.metadata?.labels?.['price_per_hour'];
      const p = priceRaw ? parseFloat(priceRaw) : null;
      const clusterName =
        clusterNameById.get(env.spec?.clusterId ?? '') ?? env.metadata?.name ?? env.id;
      list.push({
        kind: 'AI Environment',
        name: clusterName,
        price: p !== null ? `$${p.toFixed(2)}/hr` : null,
        rawPrice: p,
        onEdit: () =>
          setEditTarget({
            name: clusterName,
            current: p?.toString() ?? '',
            onSave: async (price) => {
              await patchAiEnvironment.mutateAsync({
                id: env.id,
                patch: {
                  metadata: { labels: { price_per_hour: price } },
                } as unknown as Partial<AiEnvironment>,
              });
            },
            error: patchAiEnvironment.error,
          }),
      });
    }
    return list.sort((a, b) => (b.rawPrice ?? -1) - (a.rawPrice ?? -1));
  }, [
    hostTypes,
    instanceTypes,
    aiEnvironments,
    vmCatalogItems,
    clCatalogItems,
    bmCatalogItems,
    patchHostType,
    patchInstanceType,
    patchAiEnvironment,
    patchVm,
    patchCl,
    patchBm,
  ]);

  return (
    <>
      {editTarget && (
        <EditPriceModal
          resourceName={editTarget.name}
          currentPrice={editTarget.current}
          onClose={() => setEditTarget(null)}
          error={editTarget.error}
          onSave={editTarget.onSave}
        />
      )}
      <Table aria-label="Pricing" variant="compact">
        <Thead>
          <Tr>
            <Th>Resource kind</Th>
            <Th>Name</Th>
            <Th>Price / hr</Th>
            <Th aria-label="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={4}>No resources with pricing yet.</Td>
            </Tr>
          ) : (
            rows.map((row, i) => (
              <Tr key={i}>
                <Td dataLabel="Kind">
                  <Label isCompact color="grey">
                    {row.kind}
                  </Label>
                </Td>
                <Td dataLabel="Name">
                  <strong>{row.name}</strong>
                </Td>
                <Td dataLabel="Price / hr">
                  {row.price ? (
                    <Label isCompact color="green">
                      {row.price}
                    </Label>
                  ) : (
                    <Label isCompact color="grey">
                      Not set
                    </Label>
                  )}
                </Td>
                <Td isActionCell>
                  <Button variant="secondary" size="sm" onClick={row.onEdit}>
                    Edit
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS = ['pipeline', 'hardware', 'templates', 'catalog-items', 'pricing'] as const;
type StudioTab = (typeof TABS)[number];

export const ProviderCatalogStudioPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as StudioTab | null;
  const [activeTab, setActiveTab] = useState<StudioTab>(tabParam ?? 'pipeline');

  const { data: hostTypes = [] } = useHostTypes();
  const { data: instanceTypes = [] } = useInstanceTypes({}, { enabled: true });
  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();
  const { data: vmCatalogItems = [] } = useAllComputeInstanceCatalogItems();
  const { data: clCatalogItems = [] } = useAllClusterCatalogItems();
  const { data: bmCatalogItems = [] } = useAllBareMetalInstanceCatalogItems();
  const { data: maasCatalogItems = [] } = useAllMaaSCatalogItems();
  const { data: aiEnvironments = [] } = useAiEnvironments();
  const { data: clusters = [] } = useClusters();

  const clusterNameById = useMemo(
    () => new Map(clusters.map((c) => [c.id, c.metadata?.name ?? c.id])),
    [clusters],
  );

  const patchHostType = usePatchHostType();
  const patchInstanceType = usePatchInstanceType();
  const patchAiEnvironment = usePatchAiEnvironment();
  const patchVm = usePatchComputeInstanceCatalogItem();
  const patchCl = usePatchClusterCatalogItem();
  const patchBm = usePatchBareMetalInstanceCatalogItem();
  const patchMaaS = usePatchMaaSCatalogItem();
  const deleteMaaS = useDeleteMaaSCatalogItem();

  const totalTemplates = vmTemplates.length + clTemplates.length + bmTemplates.length;
  const totalItems =
    vmCatalogItems.length + clCatalogItems.length + bmCatalogItems.length + maasCatalogItems.length;
  const totalPublished = [
    ...vmCatalogItems,
    ...clCatalogItems,
    ...bmCatalogItems,
    ...maasCatalogItems,
  ].filter((ci) => ci.published).length;
  const totalHardware = hostTypes.length + instanceTypes.length + aiEnvironments.length;

  const openCreateItem = (templateId?: string) => {
    if (templateId) {
      navigate(`/provider/catalog-studio/new?template=${encodeURIComponent(templateId)}`);
    } else {
      navigate('/provider/catalog-studio/new');
    }
  };

  return (
    <>
      <PageSection>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Catalog Studio
            </Title>
            <Content>
              Manage the full authoring chain: Hardware → Templates → Catalog Items → Published
              offerings.
            </Content>
          </FlexItem>
        </Flex>

        {/* Summary strip */}
        <ResourceKpiHeader
          ariaLabel="Catalog Studio summary"
          items={[
            { title: 'Hardware', icon: ServerIcon, value: totalHardware },
            { title: 'Templates', icon: CopyIcon, value: totalTemplates },
            { title: 'Catalog items', icon: CubeIcon, value: totalItems },
            { title: 'Published', icon: CheckCircleIcon, value: totalPublished },
          ]}
        />
      </PageSection>

      <PageSection padding={{ default: 'noPadding' }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key as StudioTab)}
          aria-label="Catalog Studio tabs"
        >
          <Tab
            eventKey="pipeline"
            title={<TabTitleText>Pipeline</TabTitleText>}
            aria-label="Pipeline tab"
          >
            <TabContent id="tab-pipeline" style={{ padding: '1rem 1.5rem' }}>
              {activeTab === 'pipeline' && (
                <PipelineTab
                  hostTypes={hostTypes}
                  instanceTypes={instanceTypes}
                  vmTemplates={vmTemplates}
                  clTemplates={clTemplates}
                  bmTemplates={bmTemplates}
                  vmCatalogItems={vmCatalogItems}
                  clCatalogItems={clCatalogItems}
                  bmCatalogItems={bmCatalogItems}
                />
              )}
            </TabContent>
          </Tab>

          <Tab
            eventKey="hardware"
            title={<TabTitleText>Hardware</TabTitleText>}
            aria-label="Hardware tab"
          >
            <TabContent id="tab-hardware" style={{ padding: '1rem 1.5rem' }}>
              {activeTab === 'hardware' && (
                <HardwareTab
                  hostTypes={hostTypes}
                  instanceTypes={instanceTypes}
                  aiEnvironments={aiEnvironments}
                  clusterNameById={clusterNameById}
                  patchHostType={patchHostType}
                  patchInstanceType={patchInstanceType}
                  patchAiEnvironment={patchAiEnvironment}
                  onManageAi={() => navigate('/provider/ai-setup')}
                />
              )}
            </TabContent>
          </Tab>

          <Tab
            eventKey="templates"
            title={<TabTitleText>Templates</TabTitleText>}
            aria-label="Templates tab"
          >
            <TabContent id="tab-templates" style={{ padding: '1rem 1.5rem' }}>
              {activeTab === 'templates' && (
                <TemplatesTab
                  vmTemplates={vmTemplates}
                  clTemplates={clTemplates}
                  bmTemplates={bmTemplates}
                  onCreateCatalogItem={(tplId) => openCreateItem(tplId)}
                />
              )}
            </TabContent>
          </Tab>

          <Tab
            eventKey="catalog-items"
            title={<TabTitleText>Catalog Items</TabTitleText>}
            aria-label="Catalog items tab"
          >
            <TabContent id="tab-catalog-items" style={{ padding: '1rem 1.5rem' }}>
              {activeTab === 'catalog-items' && (
                <CatalogItemsTab
                  vmCatalogItems={vmCatalogItems}
                  clCatalogItems={clCatalogItems}
                  bmCatalogItems={bmCatalogItems}
                  maasCatalogItems={maasCatalogItems}
                  patchVm={patchVm}
                  patchCl={patchCl}
                  patchBm={patchBm}
                  patchMaaS={patchMaaS}
                  deleteMaaS={deleteMaaS}
                  onCreateItem={() => openCreateItem()}
                />
              )}
            </TabContent>
          </Tab>

          <Tab
            eventKey="pricing"
            title={<TabTitleText>Pricing</TabTitleText>}
            aria-label="Pricing tab"
          >
            <TabContent id="tab-pricing" style={{ padding: '1rem 1.5rem' }}>
              {activeTab === 'pricing' && (
                <PricingTab
                  hostTypes={hostTypes}
                  instanceTypes={instanceTypes}
                  aiEnvironments={aiEnvironments}
                  clusterNameById={clusterNameById}
                  vmCatalogItems={vmCatalogItems}
                  clCatalogItems={clCatalogItems}
                  bmCatalogItems={bmCatalogItems}
                  patchHostType={patchHostType}
                  patchInstanceType={patchInstanceType}
                  patchAiEnvironment={patchAiEnvironment}
                  patchVm={patchVm}
                  patchCl={patchCl}
                  patchBm={patchBm}
                />
              )}
            </TabContent>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
