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

import { useBareMetalInstanceTemplates } from '../../api/v1/baremetal-instance-templates';
import {
  clusterTemplateNodeSetsSummary,
  isAiGridTemplate,
  useClusterTemplates,
} from '../../api/v1/cluster-templates';
import { useComputeInstanceTemplates } from '../../api/v1/compute-instance-templates';
import { isTemplatePublished, readAllowedTenants } from '../../api/v1/template-billing';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

const sharedWithLabel = (t: TFunc, allowedCount: number): string =>
  allowedCount === 0 ? t('All tenants') : t('Shared: {{count}}', { count: allowedCount });

// ── VM Tab ────────────────────────────────────────────────────────────────────

const VmTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useComputeInstanceTemplates();

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return templates;
    }
    return templates.filter((tpl) =>
      [
        tpl.metadata?.name,
        tpl.title,
        tpl.specDefaults?.instanceType,
        tpl.specDefaults?.image?.sourceRef,
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
                placeholder={t('Search by name, title, instance type or image…')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label={t('Search VM templates')}
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
              templates.length === 0
                ? t('No VM templates defined')
                : t('No templates match the search')
            }
          />
        ) : (
          <Table aria-label={t('VM templates')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Title')}</Th>
                <Th>{t('Default instance type')}</Th>
                <Th>{t('Default image')}</Th>
                <Th>{t('Published')}</Th>
                <Th>{t('Shared with')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((tpl) => (
                <Tr key={tpl.id}>
                  <Td dataLabel={t('Name')}>
                    <strong>{tpl.metadata?.name ?? tpl.id}</strong>
                  </Td>
                  <Td dataLabel={t('Title')}>{tpl.title || '—'}</Td>
                  <Td dataLabel={t('Default instance type')}>
                    {tpl.specDefaults?.instanceType ? (
                      <Label isCompact color="blue">
                        {tpl.specDefaults.instanceType}
                      </Label>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel={t('Default image')}>
                    {tpl.specDefaults?.image?.sourceRef ? (
                      <code style={{ fontSize: '0.8em' }}>{tpl.specDefaults.image.sourceRef}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel={t('Published')}>
                    <Label isCompact color={isTemplatePublished(tpl) ? 'green' : 'grey'}>
                      {isTemplatePublished(tpl) ? t('Published') : t('Draft')}
                    </Label>
                  </Td>
                  <Td dataLabel={t('Shared with')}>
                    <Label isCompact>{sharedWithLabel(t, readAllowedTenants(tpl).length)}</Label>
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: t('Publish & price'),
                          onClick: () => navigate(`/provider/templates/vm/${tpl.id}/edit`),
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

// ── Cluster Tab ───────────────────────────────────────────────────────────────

const ClusterTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useClusterTemplates();

  const [search, setSearch] = useState('');
  const [filterAiGrid, setFilterAiGrid] = useState(false);

  const filtered = useMemo(() => {
    let result = templates;
    if (filterAiGrid) {
      result = result.filter((tpl) => isAiGridTemplate(tpl));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((tpl) =>
        [tpl.metadata?.name, tpl.title, tpl.description].some((v) => v?.toLowerCase().includes(q)),
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
                placeholder={t('Search by name or title…')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label={t('Search cluster templates')}
                style={{ minWidth: 280 }}
              />
            </ToolbarItem>
            <ToolbarFilter
              labels={filterAiGrid ? [t('AI Grid')] : []}
              deleteLabel={() => setFilterAiGrid(false)}
              deleteLabelGroup={() => setFilterAiGrid(false)}
              categoryName={t('Workload')}
            >
              <MenuToggle
                onClick={() => setFilterAiGrid((prev) => !prev)}
                variant={filterAiGrid ? 'primary' : 'default'}
              >
                {filterAiGrid ? t('AI Grid only') : t('All workloads')}
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
                ? t('No cluster templates defined')
                : t('No templates match the filter')
            }
          />
        ) : (
          <Table aria-label={t('Cluster templates')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Title')}</Th>
                <Th>{t('Node sets')}</Th>
                <Th>{t('Tags')}</Th>
                <Th>{t('Published')}</Th>
                <Th>{t('Shared with')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((tpl) => (
                <Tr key={tpl.id}>
                  <Td dataLabel={t('Name')}>
                    <strong>{tpl.metadata?.name ?? tpl.id}</strong>
                  </Td>
                  <Td dataLabel={t('Title')}>{tpl.title || '—'}</Td>
                  <Td dataLabel={t('Node sets')}>{clusterTemplateNodeSetsSummary(tpl)}</Td>
                  <Td dataLabel={t('Tags')}>
                    <LabelGroup>
                      {isAiGridTemplate(tpl) && (
                        <Label isCompact color="orange">
                          {t('AI Grid')}
                        </Label>
                      )}
                      {tpl.metadata?.labels?.['gpu'] === 'true' && (
                        <Label isCompact color="yellow">
                          {t('GPU')}
                        </Label>
                      )}
                    </LabelGroup>
                  </Td>
                  <Td dataLabel={t('Published')}>
                    <Label isCompact color={isTemplatePublished(tpl) ? 'green' : 'grey'}>
                      {isTemplatePublished(tpl) ? t('Published') : t('Draft')}
                    </Label>
                  </Td>
                  <Td dataLabel={t('Shared with')}>
                    <Label isCompact>{sharedWithLabel(t, readAllowedTenants(tpl).length)}</Label>
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: t('Publish & price'),
                          onClick: () => navigate(`/provider/templates/cluster/${tpl.id}/edit`),
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

// ── BM Tab ────────────────────────────────────────────────────────────────────

const BmTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useBareMetalInstanceTemplates();

  const [search, setSearch] = useState('');
  const [hostTypeFilter, setHostTypeFilter] = useState<string[]>([]);
  const [hostTypeSelectOpen, setHostTypeSelectOpen] = useState(false);

  const hostTypeOptions = useMemo(() => {
    const values = templates
      .map((tpl) => (tpl as { specDefaults?: { hostType?: string } }).specDefaults?.hostType)
      .filter((v): v is string => Boolean(v));
    return [...new Set(values)];
  }, [templates]);

  const filtered = useMemo(() => {
    let result = templates;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((tpl) =>
        [
          tpl.metadata?.name,
          tpl.title,
          (tpl as { specDefaults?: { hostType?: string } }).specDefaults?.hostType,
        ].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    if (hostTypeFilter.length > 0) {
      result = result.filter((tpl) => {
        const ht = (tpl as { specDefaults?: { hostType?: string } }).specDefaults?.hostType ?? '';
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
                placeholder={t('Search by name, title or host type…')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
                aria-label={t('Search BM templates')}
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
                categoryName={t('Host type')}
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
                      {hostTypeFilter.length > 0
                        ? t('Host type ({{count}})', { count: hostTypeFilter.length })
                        : t('Host type')}
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
                ? t('No bare metal templates defined')
                : t('No templates match the filter')
            }
          />
        ) : (
          <Table aria-label={t('BM templates')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Title')}</Th>
                <Th>{t('Default host type')}</Th>
                <Th>{t('Published')}</Th>
                <Th>{t('Shared with')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((tpl) => (
                <Tr key={tpl.id}>
                  <Td dataLabel={t('Name')}>
                    <strong>{tpl.metadata?.name ?? tpl.id}</strong>
                  </Td>
                  <Td dataLabel={t('Title')}>{tpl.title || '—'}</Td>
                  <Td dataLabel={t('Default host type')}>
                    {(tpl as { specDefaults?: { hostType?: string } }).specDefaults?.hostType ? (
                      <Label isCompact color="blue">
                        {(tpl as { specDefaults?: { hostType?: string } }).specDefaults?.hostType}
                      </Label>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel={t('Published')}>
                    <Label isCompact color={isTemplatePublished(tpl) ? 'green' : 'grey'}>
                      {isTemplatePublished(tpl) ? t('Published') : t('Draft')}
                    </Label>
                  </Td>
                  <Td dataLabel={t('Shared with')}>
                    <Label isCompact>{sharedWithLabel(t, readAllowedTenants(tpl).length)}</Label>
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: t('Publish & price'),
                          onClick: () => navigate(`/provider/templates/bm/${tpl.id}/edit`),
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

// ── Overview Tab ──────────────────────────────────────────────────────────────

const OverviewTab = ({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) => {
  const { t } = useTranslation();
  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();

  const sections = [
    {
      key: 'vm',
      label: t('VM Templates'),
      count: vmTemplates.length,
      description: t('Defined in AAP/osac-app — publish and price them here for tenants.'),
      color: 'blue' as const,
    },
    {
      key: 'cluster',
      label: t('Cluster Templates'),
      count: clTemplates.length,
      description: t('Defined in AAP/osac-app — publish and price them here for tenants.'),
      color: 'purple' as const,
    },
    {
      key: 'bm',
      label: t('BM Templates'),
      count: bmTemplates.length,
      description: t('Defined in AAP/osac-app — publish and price them here for tenants.'),
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
                  {s.count} {s.count === 1 ? t('template') : t('templates')}
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TemplateTab | null;
  const [activeTab, setActiveTab] = useState<TemplateTab>(tabParam ?? 'overview');

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h1">{t('Templates')}</Title>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingTop: 0 }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, k) => setActiveTab(k as TemplateTab)}
          aria-label={t('Template tabs')}
        >
          <Tab
            eventKey="overview"
            title={<TabTitleText>{t('Overview')}</TabTitleText>}
            aria-label={t('Overview tab')}
          >
            <TabContent id="tab-overview" style={{ padding: '1.5rem' }}>
              {activeTab === 'overview' && (
                <OverviewTab onSwitchTab={(tab) => setActiveTab(tab as TemplateTab)} />
              )}
            </TabContent>
          </Tab>

          <Tab
            eventKey="vm"
            title={<TabTitleText>{t('VM')}</TabTitleText>}
            aria-label={t('VM templates tab')}
          >
            <TabContent id="tab-vm" style={{ padding: '1.5rem' }}>
              {activeTab === 'vm' && <VmTab />}
            </TabContent>
          </Tab>

          <Tab
            eventKey="cluster"
            title={<TabTitleText>{t('Cluster')}</TabTitleText>}
            aria-label={t('Cluster templates tab')}
          >
            <TabContent id="tab-cluster" style={{ padding: '1.5rem' }}>
              {activeTab === 'cluster' && <ClusterTab />}
            </TabContent>
          </Tab>

          <Tab
            eventKey="bm"
            title={<TabTitleText>{t('BM')}</TabTitleText>}
            aria-label={t('BM templates tab')}
          >
            <TabContent id="tab-bm" style={{ padding: '1.5rem' }}>
              {activeTab === 'bm' && <BmTab />}
            </TabContent>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};
