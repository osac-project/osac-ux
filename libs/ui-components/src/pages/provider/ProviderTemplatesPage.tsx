/**
 * flow: provider-admin
 * route: /provider/templates
 *
 * Unified template management page with Overview, VM, Cluster, and BM tabs.
 * Consolidates ProviderVmTemplatesPage, ProviderClusterTemplatesPage, and
 * ProviderBmTemplatesPage into a single tabbed experience.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardTitle,
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

import type {
  BareMetalInstanceTemplate,
  ClusterTemplate,
  ComputeInstanceTemplate,
} from '@osac/types';

import {
  useBareMetalInstanceTemplates,
  useDeleteBareMetalInstanceTemplate,
} from '../../api/v1/baremetal-instance-templates';
import {
  clusterTemplateNodeSetsSummary,
  isAiGridTemplate,
  useClusterTemplates,
  useDeleteClusterTemplate,
} from '../../api/v1/cluster-templates';
import {
  useComputeInstanceTemplates,
  useDeleteComputeInstanceTemplate,
} from '../../api/v1/compute-instance-templates';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

// ── VM Tab ────────────────────────────────────────────────────────────────────

const VmTab = () => {
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useComputeInstanceTemplates();
  const deleteT = useDeleteComputeInstanceTemplate();

  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ComputeInstanceTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return templates;
    }
    return templates.filter((t) =>
      [
        t.metadata?.name,
        t.title,
        t.specDefaults?.instanceType,
        t.specDefaults?.image?.sourceRef,
      ].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  return (
    <>
      <Toolbar clearAllFilters={() => setSearch('')}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>
              <SearchInput
                placeholder="Search by name, title, instance type or image…"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label="Search VM templates"
                style={{ minWidth: 320 }}
              />
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

      <ListPageBody isLoading={isLoading} error={error}>
        {filtered.length === 0 ? (
          <Alert
            variant="info"
            isInline
            title={
              templates.length === 0 ? 'No VM templates defined' : 'No templates match the search'
            }
          />
        ) : (
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
              {filtered.map((t) => (
                <Tr key={t.id}>
                  <Td dataLabel="Name">
                    <strong>{t.metadata?.name ?? t.id}</strong>
                  </Td>
                  <Td dataLabel="Title">{t.title || '—'}</Td>
                  <Td dataLabel="Default instance type">
                    {t.specDefaults?.instanceType ? (
                      <Label isCompact color="blue">
                        {t.specDefaults.instanceType}
                      </Label>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel="Default image">
                    {t.specDefaults?.image?.sourceRef ? (
                      <code style={{ fontSize: '0.8em' }}>{t.specDefaults.image.sourceRef}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: 'Edit',
                          onClick: () => navigate(`/provider/templates/vm/${t.id}/edit`),
                        },
                        { title: 'Delete', onClick: () => setPendingDelete(t), isDanger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="VM template"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteT.error}
        />
      )}
    </>
  );
};

// ── Cluster Tab ───────────────────────────────────────────────────────────────

const ClusterTab = () => {
  const { data: templates = [], isLoading, error } = useClusterTemplates();
  const deleteT = useDeleteClusterTemplate();

  const [search, setSearch] = useState('');
  const [filterAiGrid, setFilterAiGrid] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ClusterTemplate | null>(null);

  const filtered = useMemo(() => {
    let result = templates;
    if (filterAiGrid) {
      result = result.filter((t) => isAiGridTemplate(t));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((t) =>
        [t.metadata?.name, t.title, t.description].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [templates, search, filterAiGrid]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterAiGrid(false);
  };

  return (
    <>
      <Toolbar clearAllFilters={clearAllFilters}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>
              <SearchInput
                placeholder="Search by name or title…"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label="Search cluster templates"
                style={{ minWidth: 280 }}
              />
            </ToolbarItem>
            <ToolbarFilter
              labels={filterAiGrid ? ['AI Grid'] : []}
              deleteLabel={() => setFilterAiGrid(false)}
              deleteLabelGroup={() => setFilterAiGrid(false)}
              categoryName="Workload"
            >
              <MenuToggle
                onClick={() => setFilterAiGrid((prev) => !prev)}
                variant={filterAiGrid ? 'primary' : 'default'}
              >
                {filterAiGrid ? 'AI Grid only' : 'All workloads'}
              </MenuToggle>
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

      <ListPageBody isLoading={isLoading} error={error}>
        {filtered.length === 0 ? (
          <Alert
            variant="info"
            isInline
            title={
              templates.length === 0
                ? 'No cluster templates defined'
                : 'No templates match the filter'
            }
          />
        ) : (
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
              {filtered.map((t) => (
                <Tr key={t.id}>
                  <Td dataLabel="Name">
                    <strong>{t.metadata?.name ?? t.id}</strong>
                  </Td>
                  <Td dataLabel="Title">{t.title || '—'}</Td>
                  <Td dataLabel="Node sets">{clusterTemplateNodeSetsSummary(t)}</Td>
                  <Td dataLabel="Tags">
                    <LabelGroup>
                      {isAiGridTemplate(t) && (
                        <Label isCompact color="orange">
                          AI Grid
                        </Label>
                      )}
                      {t.metadata?.labels?.['gpu'] === 'true' && (
                        <Label isCompact color="yellow">
                          GPU
                        </Label>
                      )}
                    </LabelGroup>
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        { title: 'Delete', onClick: () => setPendingDelete(t), isDanger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="cluster template"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteT.error}
        />
      )}
    </>
  );
};

// ── BM Tab ────────────────────────────────────────────────────────────────────

const BmTab = () => {
  const { data: templates = [], isLoading, error } = useBareMetalInstanceTemplates();
  const deleteT = useDeleteBareMetalInstanceTemplate();

  const [search, setSearch] = useState('');
  const [hostTypeFilter, setHostTypeFilter] = useState<string[]>([]);
  const [hostTypeSelectOpen, setHostTypeSelectOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BareMetalInstanceTemplate | null>(null);

  const hostTypeOptions = useMemo(() => {
    const values = templates
      .map((t) => (t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType)
      .filter((v): v is string => Boolean(v));
    return [...new Set(values)];
  }, [templates]);

  const filtered = useMemo(() => {
    let result = templates;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((t) =>
        [
          t.metadata?.name,
          t.title,
          (t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType,
        ].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    if (hostTypeFilter.length > 0) {
      result = result.filter((t) => {
        const ht = (t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType ?? '';
        return hostTypeFilter.includes(ht);
      });
    }
    return result;
  }, [templates, search, hostTypeFilter]);

  const clearAllFilters = () => {
    setSearch('');
    setHostTypeFilter([]);
  };

  return (
    <>
      <Toolbar clearAllFilters={clearAllFilters}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem>
              <SearchInput
                placeholder="Search by name, title or host type…"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label="Search BM templates"
                style={{ minWidth: 280 }}
              />
            </ToolbarItem>
            {hostTypeOptions.length > 0 && (
              <ToolbarFilter
                labels={hostTypeFilter}
                deleteLabel={(_cat, chip) =>
                  setHostTypeFilter((prev) => prev.filter((v) => v !== chip))
                }
                deleteLabelGroup={() => setHostTypeFilter([])}
                categoryName="Host type"
              >
                <Select
                  isOpen={hostTypeSelectOpen}
                  onOpenChange={setHostTypeSelectOpen}
                  onSelect={(_e, v) => {
                    const val = v as string;
                    setHostTypeFilter((prev) =>
                      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val],
                    );
                  }}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setHostTypeSelectOpen((o) => !o)}
                      isExpanded={hostTypeSelectOpen}
                    >
                      Host type{hostTypeFilter.length > 0 ? ` (${hostTypeFilter.length})` : ''}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {hostTypeOptions.map((ht) => (
                      <SelectOption
                        key={ht}
                        value={ht}
                        hasCheckbox
                        isSelected={hostTypeFilter.includes(ht)}
                      >
                        {ht}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            )}
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

      <ListPageBody isLoading={isLoading} error={error}>
        {filtered.length === 0 ? (
          <Alert
            variant="info"
            isInline
            title={
              templates.length === 0
                ? 'No bare metal templates defined'
                : 'No templates match the filter'
            }
          />
        ) : (
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
              {filtered.map((t) => (
                <Tr key={t.id}>
                  <Td dataLabel="Name">
                    <strong>{t.metadata?.name ?? t.id}</strong>
                  </Td>
                  <Td dataLabel="Title">{t.title || '—'}</Td>
                  <Td dataLabel="Default host type">
                    {(t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType ? (
                      <Label isCompact color="blue">
                        {(t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType}
                      </Label>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        { title: 'Delete', onClick: () => setPendingDelete(t), isDanger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="BM template"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteT.error}
        />
      )}
    </>
  );
};

// ── Overview Tab ──────────────────────────────────────────────────────────────

const OverviewTab = ({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) => {
  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();

  const sections = [
    {
      key: 'vm',
      label: 'VM Templates',
      count: vmTemplates.length,
      description: 'Define default image, instance type, and disk for compute instances.',
      color: 'blue' as const,
    },
    {
      key: 'cluster',
      label: 'Cluster Templates',
      count: clTemplates.length,
      description: 'Define node sets, OCP release image, and defaults for managed clusters.',
      color: 'purple' as const,
    },
    {
      key: 'bm',
      label: 'BM Templates',
      count: bmTemplates.length,
      description: 'Define host type and provisioning config for bare metal instances.',
      color: 'orange' as const,
    },
  ];

  return (
    <Flex gap={{ default: 'gapMd' }} style={{ flexWrap: 'wrap' }}>
      {sections.map((s) => (
        <FlexItem key={s.key} style={{ flex: '1 1 260px', minWidth: 220 }}>
          <button
            onClick={() => onSwitchTab(s.key)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              height: '100%',
              width: '100%',
            }}
          >
            <Card
              isFullHeight
              style={{ border: '1px solid var(--pf-t--global--border--color--default)' }}
            >
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>{s.label}</FlexItem>
                  <FlexItem>
                    <Badge>{s.count}</Badge>
                  </FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--pf-t--global--color--nonstatus--gray--default)',
                    fontSize: 'var(--pf-t--global--font--size--sm)',
                  }}
                >
                  {s.description}
                </p>
                <Label isCompact color={s.color} style={{ marginTop: '0.75rem' }}>
                  {s.count} {s.count === 1 ? 'template' : 'templates'}
                </Label>
              </CardBody>
            </Card>
          </button>
        </FlexItem>
      ))}
    </Flex>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

type TemplateTab = 'overview' | 'vm' | 'cluster' | 'bm';

export const ProviderTemplatesPage = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TemplateTab | null;
  const [activeTab, setActiveTab] = useState<TemplateTab>(tabParam ?? 'overview');

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h1">Templates</Title>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, k) => setActiveTab(k as TemplateTab)}
          aria-label="Template tabs"
        >
          <Tab
            eventKey="overview"
            title={<TabTitleText>Overview</TabTitleText>}
            aria-label="Overview tab"
          >
            <TabContent id="tab-overview" style={{ padding: '1.5rem' }}>
              {activeTab === 'overview' && (
                <OverviewTab onSwitchTab={(t) => setActiveTab(t as TemplateTab)} />
              )}
            </TabContent>
          </Tab>

          <Tab eventKey="vm" title={<TabTitleText>VM</TabTitleText>} aria-label="VM templates tab">
            <TabContent id="tab-vm" style={{ padding: '1.5rem' }}>
              {activeTab === 'vm' && <VmTab />}
            </TabContent>
          </Tab>

          <Tab
            eventKey="cluster"
            title={<TabTitleText>Cluster</TabTitleText>}
            aria-label="Cluster templates tab"
          >
            <TabContent id="tab-cluster" style={{ padding: '1.5rem' }}>
              {activeTab === 'cluster' && <ClusterTab />}
            </TabContent>
          </Tab>

          <Tab eventKey="bm" title={<TabTitleText>BM</TabTitleText>} aria-label="BM templates tab">
            <TabContent id="tab-bm" style={{ padding: '1.5rem' }}>
              {activeTab === 'bm' && <BmTab />}
            </TabContent>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
