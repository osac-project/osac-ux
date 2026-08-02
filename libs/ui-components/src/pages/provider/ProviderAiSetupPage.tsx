/**
 * flow: provider-ai-setup
 * route: /provider/ai-setup (providerAdmin)
 *
 * Shows all clusters with their AI environment status.
 * Provider admin can enable AI (RHOAI + vLLM gateway) on any cluster
 * that doesn't have an AiEnvironment yet or has one in FAILED state.
 *
 * Also hosts the "AI Metrics" tab (moved from the retired /provider/ai-metrics
 * route): token metering (input, output, cache) captured via a gateway
 * metering plugin and forwarded to CoP (cost on-prem solution). OTel +
 * Prometheus back the underlying metrics.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Content,
  Flex,
  FlexItem,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Stack,
  Tab,
  TabTitleText,
  Tabs,
  TextInput,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  useAiEnvironments,
  useEnableAiEnvironment,
} from '@osac/ui-components/api/v1/ai-environment';
import { useClusters } from '@osac/ui-components/api/v1/cluster';
import { useMaaSTokenUsage } from '@osac/ui-components/api/v1/maas-metrics';
import type { AiEnvironment, AiEnvironmentState } from '@osac/ui-components/api/v1/maas-types';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

const RHOAI_VERSIONS = ['2.17', '2.16', 'latest'] as const;
type RhoaiVersion = (typeof RHOAI_VERSIONS)[number];

const AVAILABLE_MODELS = [
  { id: 'llama-3-2-3b', label: 'Llama 3.2 — 3B (Meta)' },
  { id: 'granite-3-3-8b', label: 'Granite 3.3 — 8B (IBM)' },
  { id: 'mistral-7b', label: 'Mistral 7B' },
];

/**
 * Gateway component readiness — Connectivity Link (ingress), Authorino (auth),
 * Limiter (rate limiting). Derived from the AiEnvironment overall state since
 * fulfillment-service does not yet expose per-component gateway status.
 */
const GATEWAY_COMPONENTS = ['Connectivity Link', 'Authorino', 'Limiter'] as const;

/**
 * Dedicated vs Shared inference cluster mode (REQ-MAAS-5). Mode A (dedicated,
 * one AiEnvironment per cluster) is live in 0.2; Mode B (shared, a pooled
 * inference cluster serving multiple tenant-facing clusters) is Phase 2.
 * Stored as a label until AiEnvironmentSpec gains a first-class field.
 */
const INFERENCE_MODE_LABEL = 'osac.io/inference-mode';
type InferenceMode = 'dedicated' | 'shared';

const inferenceModeOf = (env: AiEnvironment | undefined): InferenceMode =>
  (env?.metadata?.labels?.[INFERENCE_MODE_LABEL] as InferenceMode | undefined) ?? 'dedicated';

const InferenceModeBadge = ({ env }: { env: AiEnvironment | undefined }) => {
  const { t } = useTranslation();
  if (!env) {
    return <>—</>;
  }
  const mode = inferenceModeOf(env);
  return mode === 'shared' ? (
    <Label isCompact color="purple">
      {t('Shared')}
    </Label>
  ) : (
    <Label isCompact color="blue">
      {t('Dedicated')}
    </Label>
  );
};

const GatewayStatusLabels = ({ state }: { state: AiEnvironmentState | undefined }) => {
  const { t } = useTranslation();
  if (!state) {
    return <>—</>;
  }
  const color = state === 'READY' ? 'green' : state === 'FAILED' ? 'red' : 'blue';
  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} flexWrap={{ default: 'wrap' }}>
      {GATEWAY_COMPONENTS.map((name) => (
        <FlexItem key={name}>
          <Label isCompact color={color}>
            {t(name)}
          </Label>
        </FlexItem>
      ))}
    </Flex>
  );
};

const AiStateLabel = ({ state }: { state: AiEnvironmentState | undefined }) => {
  const { t } = useTranslation();
  if (!state) {
    return (
      <Label isCompact color="grey">
        {t('Not enabled')}
      </Label>
    );
  }
  switch (state) {
    case 'READY':
      return (
        <Label isCompact color="green">
          {t('Ready')}
        </Label>
      );
    case 'PROVISIONING':
      return (
        <>
          <Spinner size="sm" aria-label={t('provisioning')} />{' '}
          <Label isCompact color="blue">
            {t('Provisioning')}
          </Label>
        </>
      );
    case 'FAILED':
      return (
        <Label isCompact color="red">
          {t('Failed')}
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          {t('Pending')}
        </Label>
      );
  }
};

interface EnableAiModalProps {
  clusterName: string;
  clusterId: string;
  onClose: () => void;
}

const EnableAiModal = ({ clusterName, clusterId, onClose }: EnableAiModalProps) => {
  const { t } = useTranslation();
  const [rhoaiVersion, setRhoaiVersion] = useState<RhoaiVersion>('2.17');
  const [versionOpen, setVersionOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['llama-3-2-3b']);
  const [gatewayEndpoint, setGatewayEndpoint] = useState('');
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>('dedicated');
  const { mutateAsync, isPending, error } = useEnableAiEnvironment();

  const toggleModel = (id: string) =>
    setSelectedModels((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const isValid = selectedModels.length > 0 && gatewayEndpoint.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }
    await mutateAsync({
      metadata: { labels: { [INFERENCE_MODE_LABEL]: inferenceMode } },
      spec: {
        clusterId,
        rhoaiVersion,
        gatewayEndpoint: gatewayEndpoint.trim(),
        registeredModels: selectedModels,
      },
    });
    onClose();
  };

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="enable-ai-title"
    >
      <ModalHeader
        title={t('Enable AI on {{clusterName}}', { clusterName })}
        labelId="enable-ai-title"
      />
      <ModalBody>
        <FormGroup label={t('Cluster')} fieldId="eai-cluster">
          <TextInput id="eai-cluster" value={clusterName} isDisabled />
        </FormGroup>
        <FormGroup
          label={t('RHOAI version')}
          fieldId="eai-rhoai-version"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          <Select
            isOpen={versionOpen}
            onOpenChange={setVersionOpen}
            selected={rhoaiVersion}
            onSelect={(_e, v) => {
              setRhoaiVersion(v as RhoaiVersion);
              setVersionOpen(false);
            }}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setVersionOpen(!versionOpen)}
                isExpanded={versionOpen}
              >
                {rhoaiVersion}
              </MenuToggle>
            )}
          >
            <SelectList>
              {RHOAI_VERSIONS.map((v) => (
                <SelectOption key={v} value={v}>
                  {v}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>
        <FormGroup
          label={t('Register models')}
          fieldId="eai-models"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          {AVAILABLE_MODELS.map((m) => (
            <Checkbox
              key={m.id}
              id={`eai-model-${m.id}`}
              label={t(m.label)}
              isChecked={selectedModels.includes(m.id)}
              onChange={() => toggleModel(m.id)}
              style={{ marginBottom: 4 }}
            />
          ))}
          {selectedModels.length === 0 && (
            <Alert variant="warning" isInline isPlain title={t('Select at least one model')} />
          )}
        </FormGroup>
        <FormGroup
          label={t('Inference cluster mode')}
          fieldId="eai-mode"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          <ToggleGroup aria-label={t('Inference cluster mode')}>
            <ToggleGroupItem
              text={t('Dedicated')}
              buttonId="eai-mode-dedicated"
              isSelected={inferenceMode === 'dedicated'}
              onChange={() => setInferenceMode('dedicated')}
            />
            <Tooltip
              content={t(
                'Shared inference clusters (pooled across multiple tenant-facing clusters) ship in Phase 2 — REQ-MAAS-5.',
              )}
            >
              <ToggleGroupItem
                text={t('Shared')}
                buttonId="eai-mode-shared"
                isSelected={inferenceMode === 'shared'}
                isDisabled
              />
            </Tooltip>
          </ToggleGroup>
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  'Dedicated: this AI environment serves only {{clusterName}}. Shared (Phase 2) will pool inference capacity across clusters.',
                  { clusterName },
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup
          label={t('Gateway endpoint')}
          fieldId="eai-gateway"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          <TextInput
            id="eai-gateway"
            value={gatewayEndpoint}
            onChange={(_e, v) => setGatewayEndpoint(v)}
            placeholder={t('https://maas.apps.<cluster>.example.com')}
            isRequired
          />
        </FormGroup>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={t('Failed to enable AI')}
            style={{ marginTop: '1rem' }}
          >
            {getErrorMessage(error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isPending}
          isDisabled={isPending || !isValid}
        >
          {t('Enable AI')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

type AiStatusFilter = 'Not enabled' | 'Provisioning' | 'Ready' | 'Failed';

const STATUS_FILTER_MAP: Record<AiStatusFilter, AiEnvironmentState | null> = {
  'Not enabled': null,
  Provisioning: 'PROVISIONING',
  Ready: 'READY',
  Failed: 'FAILED',
};

const AiMetricsTab = () => {
  const { t } = useTranslation();
  const { data: usage = [], isLoading, error } = useMaaSTokenUsage();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return usage;
    }
    return usage.filter(
      (u) => u.tenantName.toLowerCase().includes(q) || u.subscriptionName.toLowerCase().includes(q),
    );
  }, [usage, search]);

  return (
    <ListPageBody isLoading={isLoading} error={error}>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Search token usage')}
              placeholder={t('Search by tenant or subscription')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table aria-label={t('Token usage')} variant="compact">
        <Thead>
          <Tr>
            <Th>{t('Tenant')}</Th>
            <Th>{t('Subscription')}</Th>
            <Th>{t('Input tokens')}</Th>
            <Th>{t('Output tokens')}</Th>
            <Th>{t('Cache tokens')}</Th>
            <Th>{t('Period')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td colSpan={6}>{t('No token usage recorded yet.')}</Td>
            </Tr>
          ) : (
            filtered.map((u) => (
              <Tr key={u.id}>
                <Td dataLabel={t('Tenant')}>{u.tenantName}</Td>
                <Td dataLabel={t('Subscription')}>{u.subscriptionName}</Td>
                <Td dataLabel={t('Input tokens')}>{u.inputTokens.toLocaleString()}</Td>
                <Td dataLabel={t('Output tokens')}>{u.outputTokens.toLocaleString()}</Td>
                <Td dataLabel={t('Cache tokens')}>{u.cacheTokens.toLocaleString()}</Td>
                <Td dataLabel={t('Period')}>{u.period}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </ListPageBody>
  );
};

type AiSetupPageTab = 'setup' | 'metrics';

const TAB_LABELS: Record<AiSetupPageTab, string> = {
  setup: 'AI Setup',
  metrics: 'AI Metrics',
};

export const ProviderAiSetupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AiSetupPageTab | null;
  const [activeTab, setActiveTab] = useState<AiSetupPageTab>(tabParam ?? 'setup');

  const { data: clusters = [], isLoading: clustersLoading, error: clustersError } = useClusters();
  const { data: aiEnvironments = [], isLoading: aiEnvsLoading } = useAiEnvironments();
  const [enableTarget, setEnableTarget] = useState<{
    clusterId: string;
    clusterName: string;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<AiStatusFilter[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);

  const toggleStatus = (v: AiStatusFilter) =>
    setStatusFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const clearAll = () => {
    setSearch('');
    setStatusFilters([]);
  };
  const hasFilters = search !== '' || statusFilters.length > 0;

  const aiEnvByClusterId = new Map<string, AiEnvironment>(
    aiEnvironments.map((env) => [env.spec?.clusterId ?? '', env]),
  );

  const isLoading = clustersLoading || aiEnvsLoading;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clusters.filter((cluster) => {
      const name = (cluster.metadata?.name ?? cluster.id).toLowerCase();
      if (q && !name.includes(q)) {
        return false;
      }
      if (statusFilters.length > 0) {
        const env = aiEnvByClusterId.get(cluster.id);
        const state = env?.status?.state ?? null;
        const matches = statusFilters.some((f) => STATUS_FILTER_MAP[f] === state);
        if (!matches) {
          return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, aiEnvironments, search, statusFilters]);

  return (
    <>
      {enableTarget && (
        <EnableAiModal
          clusterId={enableTarget.clusterId}
          clusterName={enableTarget.clusterName}
          onClose={() => setEnableTarget(null)}
        />
      )}
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => {
                  setActiveTab('setup');
                  navigate('/provider/ai-setup');
                }}
              >
                {t('AI Setup')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t(TAB_LABELS[activeTab])}</BreadcrumbItem>
          </Breadcrumb>
          <Flex>
            <FlexItem>
              <Title headingLevel="h1" size="3xl">
                {t('AI Setup')}
              </Title>
              <Content component="p">
                {t(
                  'Enable Red Hat OpenShift AI (RHOAI) on clusters and configure the model-serving gateway. Once enabled, model catalog items can be published for tenant consumption.',
                )}
              </Content>
            </FlexItem>
          </Flex>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingBottom: 0 }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, k) => setActiveTab(k as AiSetupPageTab)}
          aria-label={t('AI Setup tabs')}
        >
          <Tab eventKey="setup" title={<TabTitleText>{t('AI Setup')}</TabTitleText>} />
          <Tab eventKey="metrics" title={<TabTitleText>{t('AI Metrics')}</TabTitleText>} />
        </Tabs>
      </PageSection>

      {activeTab === 'metrics' ? (
        <AiMetricsTab />
      ) : (
        <ListPageBody isLoading={isLoading} error={clustersError}>
          <Toolbar clearAllFilters={clearAll}>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label={t('Search clusters')}
                  placeholder={t('Search by cluster name')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>
              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={statusFilters}
                  deleteLabel={(_g, v) =>
                    toggleStatus(
                      (typeof v === 'string' ? v : (v as { key: string }).key) as AiStatusFilter,
                    )
                  }
                  deleteLabelGroup={() => setStatusFilters([])}
                  categoryName={t('AI status')}
                >
                  <Select
                    isOpen={statusOpen}
                    onOpenChange={setStatusOpen}
                    onSelect={(_e, v) => toggleStatus(v as AiStatusFilter)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setStatusOpen(!statusOpen)}
                        isExpanded={statusOpen}
                        badge={statusFilters.length || undefined}
                      >
                        {t('AI status')}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {(Object.keys(STATUS_FILTER_MAP) as AiStatusFilter[]).map((v) => (
                        <SelectOption
                          key={v}
                          value={v}
                          hasCheckbox
                          isSelected={statusFilters.includes(v)}
                        >
                          {t(v)}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>{t('No clusters match the current filters.')}</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  {t('Clear filters')}
                </Button>
              </FlexItem>
            </Flex>
          ) : (
            <Table aria-label={t('Clusters AI status')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Cluster')}</Th>
                  <Th>{t('AI status')}</Th>
                  <Th>{t('Mode')}</Th>
                  <Th>{t('RHOAI version')}</Th>
                  <Th>{t('Registered models')}</Th>
                  <Th>{t('Gateway endpoint')}</Th>
                  <Th>{t('Gateway components')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((cluster) => {
                  const clusterName = cluster.metadata?.name ?? cluster.id;
                  const env = aiEnvByClusterId.get(cluster.id);
                  const state = env?.status?.state;
                  const canEnable = !env || state === 'FAILED';
                  return (
                    <Tr key={cluster.id}>
                      <Td dataLabel={t('Cluster')}>
                        <strong>{clusterName}</strong>
                      </Td>
                      <Td dataLabel={t('AI status')}>
                        <AiStateLabel state={state} />
                      </Td>
                      <Td dataLabel={t('Mode')}>
                        <InferenceModeBadge env={env} />
                      </Td>
                      <Td dataLabel={t('RHOAI version')}>{env?.spec?.rhoaiVersion ?? '—'}</Td>
                      <Td dataLabel={t('Registered models')}>
                        {env?.spec?.registeredModels?.length ?? '—'}
                      </Td>
                      <Td dataLabel={t('Gateway endpoint')}>
                        {env?.spec?.gatewayEndpoint ? (
                          <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                            {env.spec.gatewayEndpoint}
                          </code>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td dataLabel={t('Gateway components')}>
                        <GatewayStatusLabels state={state} />
                      </Td>
                      <Td isActionCell>
                        {canEnable && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEnableTarget({ clusterId: cluster.id, clusterName })}
                          >
                            {t('Enable AI')}
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
                {clusters.length === 0 && !isLoading && (
                  <Tr>
                    <Td colSpan={8}>
                      <Alert variant="info" isInline isPlain title={t('No clusters found')} />
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      )}
    </>
  );
};
