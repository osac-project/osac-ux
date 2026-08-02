/**
 * flow: provider-admin
 * route: /provider/host-types
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { HostType } from '@osac/types';

import {
  RESIDENCY_COLOR,
  RESIDENCY_TAGS,
  type ResidencyTag,
  resourceResidency,
} from '../../api/v1/compliance';
import {
  hostTypePricePerHour,
  isGpuHostType,
  useDeleteHostType,
  useHostTypes,
  usePatchHostType,
} from '../../api/v1/host-types';
import { EditPriceModal } from '../../components/catalog/EditPriceModal';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { useTranslation } from '../../hooks/useTranslation';

export const ProviderHostTypesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: hostTypes = [], isLoading, error } = useHostTypes();
  const deleteHT = useDeleteHostType();
  const patchHT = usePatchHostType();

  const [pendingDelete, setPendingDelete] = React.useState<HostType | null>(null);
  const [editPriceTarget, setEditPriceTarget] = React.useState<HostType | null>(null);

  const [search, setSearch] = useState('');
  const [gpuFilter, setGpuFilter] = useState<string[]>([]);
  const [gpuOpen, setGpuOpen] = useState(false);
  const [residencyFilter, setResidencyFilter] = useState<ResidencyTag[]>([]);
  const [residencyOpen, setResidencyOpen] = useState(false);

  const toggleGpu = (v: string) =>
    setGpuFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleResidency = (v: ResidencyTag) =>
    setResidencyFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setGpuFilter([]);
    setResidencyFilter([]);
  };
  const hasFilters = search !== '' || gpuFilter.length > 0 || residencyFilter.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hostTypes.filter((ht) => {
      if (q) {
        const name = (ht.metadata?.name ?? ht.id).toLowerCase();
        const title = (ht.title ?? '').toLowerCase();
        if (!name.includes(q) && !title.includes(q)) {
          return false;
        }
      }
      if (gpuFilter.length > 0) {
        const isGpu = isGpuHostType(ht);
        if (gpuFilter.includes('GPU') && !isGpu) {
          return false;
        }
        if (gpuFilter.includes('CPU only') && isGpu) {
          return false;
        }
      }
      if (residencyFilter.length > 0 && !residencyFilter.includes(resourceResidency(ht))) {
        return false;
      }
      return true;
    });
  }, [hostTypes, search, gpuFilter, residencyFilter]);

  return (
    <>
      <ListPage
        title={t('Host Types')}
        description={t(
          'Host types define hardware profiles used by cluster node sets and bare metal instances. Attach a price_per_hour label to enable metering-based cost estimates.',
        )}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll}>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label={t('Search host types')}
                  placeholder={t('Search by name or title')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>
              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={gpuFilter}
                  deleteLabel={(_g, v) =>
                    toggleGpu(typeof v === 'string' ? v : (v as { key: string }).key)
                  }
                  deleteLabelGroup={() => setGpuFilter([])}
                  categoryName={t('Type')}
                >
                  <Select
                    isOpen={gpuOpen}
                    onOpenChange={setGpuOpen}
                    onSelect={(_e, v) => toggleGpu(v as string)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setGpuOpen(!gpuOpen)}
                        isExpanded={gpuOpen}
                        badge={gpuFilter.length || undefined}
                      >
                        {t('Type')}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {(['GPU', 'CPU only'] as const).map((v) => (
                        <SelectOption
                          key={v}
                          value={v}
                          hasCheckbox
                          isSelected={gpuFilter.includes(v)}
                        >
                          {v}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
                <ToolbarFilter
                  labels={residencyFilter}
                  deleteLabel={(_g, v) =>
                    toggleResidency(
                      typeof v === 'string'
                        ? (v as ResidencyTag)
                        : (v as { key: ResidencyTag }).key,
                    )
                  }
                  deleteLabelGroup={() => setResidencyFilter([])}
                  categoryName={t('Residency')}
                >
                  <Select
                    isOpen={residencyOpen}
                    onOpenChange={setResidencyOpen}
                    onSelect={(_e, v) => toggleResidency(v as ResidencyTag)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setResidencyOpen(!residencyOpen)}
                        isExpanded={residencyOpen}
                        badge={residencyFilter.length || undefined}
                      >
                        {t('Residency')}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {RESIDENCY_TAGS.map((v) => (
                        <SelectOption
                          key={v}
                          value={v}
                          hasCheckbox
                          isSelected={residencyFilter.includes(v)}
                        >
                          {v}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>
              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button variant="primary" onClick={() => navigate('/provider/host-types/new')}>
                  {t('Create host type')}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>{t('No host types match the current filters.')}</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  {t('Clear filters')}
                </Button>
              </FlexItem>
            </Flex>
          ) : hostTypes.length === 0 ? (
            <Alert variant="info" isInline title={t('No host types defined')} />
          ) : (
            <Table aria-label={t('Host types')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Title')}</Th>
                  <Th>{t('Tags')}</Th>
                  <Th>{t('Residency')}</Th>
                  <Th>{t('Price / hr')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((ht) => (
                  <Tr key={ht.id}>
                    <Td dataLabel={t('Name')}>
                      <strong>{ht.metadata?.name ?? ht.id}</strong>
                    </Td>
                    <Td dataLabel={t('Title')}>{ht.title || '—'}</Td>
                    <Td dataLabel={t('Tags')}>
                      <LabelGroup>
                        {isGpuHostType(ht) && (
                          <Label isCompact color="orange">
                            {t('GPU')}
                          </Label>
                        )}
                        {ht.metadata?.labels?.['gpu_model'] && (
                          <Label isCompact color="yellow">
                            {ht.metadata.labels['gpu_model']}
                          </Label>
                        )}
                      </LabelGroup>
                    </Td>
                    <Td dataLabel={t('Residency')}>
                      <Label isCompact color={RESIDENCY_COLOR[resourceResidency(ht)]}>
                        {resourceResidency(ht)}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Price / hr')}>
                      {hostTypePricePerHour(ht) !== null
                        ? `$${hostTypePricePerHour(ht)?.toFixed(2)}/hr`
                        : '—'}
                    </Td>
                    <Td dataLabel={t('Actions')} isActionCell>
                      <ActionsColumn
                        items={[
                          { title: t('Edit price'), onClick: () => setEditPriceTarget(ht) },
                          {
                            title: t('Delete'),
                            onClick: () => setPendingDelete(ht),
                            isDanger: true,
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
      </ListPage>

      {editPriceTarget && (
        <EditPriceModal
          resourceName={
            editPriceTarget.title || editPriceTarget.metadata?.name || editPriceTarget.id
          }
          currentPrice={hostTypePricePerHour(editPriceTarget)?.toString() ?? ''}
          onClose={() => setEditPriceTarget(null)}
          error={patchHT.error}
          onSave={async (price) => {
            await patchHT.mutateAsync({
              id: editPriceTarget.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<HostType>,
            });
            setEditPriceTarget(null);
          }}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind={t('host type')}
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteHT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteHT.error}
        />
      )}
    </>
  );
};
