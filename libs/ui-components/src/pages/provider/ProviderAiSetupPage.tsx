/**
 * flow: provider-ai-setup
 * route: /provider/ai-setup (providerAdmin)
 *
 * Shows all clusters with their AI environment status.
 * Provider admin can enable AI (RHOAI + vLLM gateway) on any cluster
 * that doesn't have an AiEnvironment yet or has one in FAILED state.
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  useAiEnvironments,
  useEnableAiEnvironment,
} from '@osac/ui-components/api/v1/ai-environment';
import { useClusters } from '@osac/ui-components/api/v1/cluster';
import type { AiEnvironment, AiEnvironmentState } from '@osac/ui-components/api/v1/maas-types';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { getErrorMessage } from '@osac/ui-components/utils/error';

const RHOAI_VERSIONS = ['2.17', '2.16', 'latest'] as const;
type RhoaiVersion = (typeof RHOAI_VERSIONS)[number];

const AVAILABLE_MODELS = [
  { id: 'llama-3-2-3b', label: 'Llama 3.2 — 3B (Meta)' },
  { id: 'granite-3-3-8b', label: 'Granite 3.3 — 8B (IBM)' },
  { id: 'mistral-7b', label: 'Mistral 7B' },
];

const AiStateLabel = ({ state }: { state: AiEnvironmentState | undefined }) => {
  if (!state) {
    return (
      <Label isCompact color="grey">
        Not enabled
      </Label>
    );
  }
  switch (state) {
    case 'READY':
      return (
        <Label isCompact color="green">
          Ready
        </Label>
      );
    case 'PROVISIONING':
      return (
        <>
          <Spinner size="sm" aria-label="provisioning" />{' '}
          <Label isCompact color="blue">
            Provisioning
          </Label>
        </>
      );
    case 'FAILED':
      return (
        <Label isCompact color="red">
          Failed
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          Pending
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
  const [rhoaiVersion, setRhoaiVersion] = useState<RhoaiVersion>('2.17');
  const [versionOpen, setVersionOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['llama-3-2-3b']);
  const [gatewayEndpoint, setGatewayEndpoint] = useState('');
  const { mutateAsync, isPending, error } = useEnableAiEnvironment();

  const toggleModel = (id: string) =>
    setSelectedModels((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const isValid = selectedModels.length > 0 && gatewayEndpoint.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }
    await mutateAsync({
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
      <ModalHeader title={`Enable AI on ${clusterName}`} labelId="enable-ai-title" />
      <ModalBody>
        <FormGroup label="Cluster" fieldId="eai-cluster">
          <TextInput id="eai-cluster" value={clusterName} isDisabled />
        </FormGroup>
        <FormGroup
          label="RHOAI version"
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
          label="Register models"
          fieldId="eai-models"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          {AVAILABLE_MODELS.map((m) => (
            <Checkbox
              key={m.id}
              id={`eai-model-${m.id}`}
              label={m.label}
              isChecked={selectedModels.includes(m.id)}
              onChange={() => toggleModel(m.id)}
              style={{ marginBottom: 4 }}
            />
          ))}
          {selectedModels.length === 0 && (
            <Alert variant="warning" isInline isPlain title="Select at least one model" />
          )}
        </FormGroup>
        <FormGroup
          label="Gateway endpoint"
          fieldId="eai-gateway"
          isRequired
          style={{ marginTop: '1rem' }}
        >
          <TextInput
            id="eai-gateway"
            value={gatewayEndpoint}
            onChange={(_e, v) => setGatewayEndpoint(v)}
            placeholder="https://maas.apps.<cluster>.example.com"
            isRequired
          />
        </FormGroup>
        {error && (
          <Alert
            variant="danger"
            isInline
            title="Failed to enable AI"
            style={{ marginTop: '1rem' }}
          >
            {getErrorMessage(error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isPending}
          isDisabled={isPending || !isValid}
        >
          Enable AI
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

export const ProviderAiSetupPage = () => {
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
      <ListPage
        title="AI Setup"
        description="Enable Red Hat OpenShift AI (RHOAI) on clusters and configure the model-serving gateway. Once enabled, model catalog items can be published for tenant consumption."
      >
        <ListPageBody isLoading={isLoading} error={clustersError}>
          <Toolbar clearAllFilters={clearAll}>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search clusters"
                  placeholder="Search by cluster name"
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
                  categoryName="AI status"
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
                        AI status
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
                          {v}
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
              <FlexItem>No clusters match the current filters.</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  Clear filters
                </Button>
              </FlexItem>
            </Flex>
          ) : (
            <Table aria-label="Clusters AI status" variant="compact">
              <Thead>
                <Tr>
                  <Th>Cluster</Th>
                  <Th>AI status</Th>
                  <Th>RHOAI version</Th>
                  <Th>Registered models</Th>
                  <Th>Gateway endpoint</Th>
                  <Th aria-label="Actions" />
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
                      <Td dataLabel="Cluster">
                        <strong>{clusterName}</strong>
                      </Td>
                      <Td dataLabel="AI status">
                        <AiStateLabel state={state} />
                      </Td>
                      <Td dataLabel="RHOAI version">{env?.spec?.rhoaiVersion ?? '—'}</Td>
                      <Td dataLabel="Registered models">
                        {env?.spec?.registeredModels?.length ?? '—'}
                      </Td>
                      <Td dataLabel="Gateway endpoint">
                        {env?.spec?.gatewayEndpoint ? (
                          <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                            {env.spec.gatewayEndpoint}
                          </code>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td isActionCell>
                        {canEnable && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEnableTarget({ clusterId: cluster.id, clusterName })}
                          >
                            Enable AI
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
                {clusters.length === 0 && !isLoading && (
                  <Tr>
                    <Td colSpan={6}>
                      <Alert variant="info" isInline isPlain title="No clusters found" />
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>
    </>
  );
};
