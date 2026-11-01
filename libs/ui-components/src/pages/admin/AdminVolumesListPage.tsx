import { useMemo, useState } from 'react';
import {
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import { type Volume, VolumeState } from '@osac/types/private';
import { type CelFilter, cel } from '@osac/ui-components/api/cel';
import { usePrivateVolumes } from '@osac/ui-components/api/v1/private/volumes';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { AdminVolumeTable } from '@osac/ui-components/components/Storage/AdminVolumeTable';
import {
  SEARCH_PARAM,
  useArrayPageFilter,
  usePageFilter,
} from '@osac/ui-components/hooks/use-page-filter';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

const getVolumeStateLabels = (t: TFunction): Record<VolumeState, string> => ({
  [VolumeState.UNSPECIFIED]: t('Unknown'),
  [VolumeState.CREATING]: t('Creating'),
  [VolumeState.AVAILABLE]: t('Available'),
  [VolumeState.FAILED]: t('Failed'),
  [VolumeState.DELETING]: t('Deleting'),
  [VolumeState.DELETED]: t('Deleted'),
});

type VolumeStateFilterValue = 'creating' | 'available' | 'failed' | 'deleting' | 'deleted';

const STATE_FILTER_PARAM = 'state';

const isVolumeStateFilterValue = (value: string): value is VolumeStateFilterValue =>
  value === 'creating' ||
  value === 'available' ||
  value === 'failed' ||
  value === 'deleting' ||
  value === 'deleted';

const VOLUME_STATE_FILTER_TO_ENUM: Record<VolumeStateFilterValue, VolumeState> = {
  creating: VolumeState.CREATING,
  available: VolumeState.AVAILABLE,
  failed: VolumeState.FAILED,
  deleting: VolumeState.DELETING,
  deleted: VolumeState.DELETED,
};

const FILTERABLE_STATE_OPTIONS: readonly {
  value: VolumeStateFilterValue;
  enumValue: VolumeState;
}[] = [
  { value: 'creating', enumValue: VolumeState.CREATING },
  { value: 'available', enumValue: VolumeState.AVAILABLE },
  { value: 'failed', enumValue: VolumeState.FAILED },
  { value: 'deleting', enumValue: VolumeState.DELETING },
  { value: 'deleted', enumValue: VolumeState.DELETED },
];

const buildVolumeCelFilter = (
  stateFilters: VolumeState[],
  nameSearch: string,
): CelFilter<Volume> | undefined =>
  cel<Volume>((b) =>
    b.and(
      stateFilters.length > 0 ? b.field('status.state').isIn(stateFilters) : undefined,
      nameSearch ? b.field('metadata.name').contains(nameSearch) : undefined,
    ),
  );

export const AdminVolumesListPage = () => {
  const { t } = useTranslation();

  const stateLabels = useMemo(() => getVolumeStateLabels(t), [t]);

  const [nameSearch, setNameSearch] = usePageFilter(SEARCH_PARAM);
  const [stateFilters, toggleStateFilter] = useArrayPageFilter(
    STATE_FILTER_PARAM,
    isVolumeStateFilterValue,
  );
  const [isStateSelectOpen, setIsStateSelectOpen] = useState(false);

  const selectedStateEnums = stateFilters.map(
    (filterValue) => VOLUME_STATE_FILTER_TO_ENUM[filterValue],
  );

  const celFilter = buildVolumeCelFilter(selectedStateEnums, nameSearch);
  const { data: volumes = [], isLoading, error } = usePrivateVolumes({ filter: celFilter });

  const selectedStateLabels =
    stateFilters.length > 0
      ? stateFilters.map((value) => stateLabels[VOLUME_STATE_FILTER_TO_ENUM[value]]).join(', ')
      : t('All states');

  return (
    <ListPage
      title={t('Volumes')}
      label={t('Infrastructure')}
      description={t(
        'View all volumes across tenants. Volumes are block or NFS storage resources provisioned through tenant requests.',
      )}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignStart' }}>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search by name')}
                  value={nameSearch}
                  onChange={(_event, value) => setNameSearch(value)}
                  onClear={() => setNameSearch('')}
                  aria-label={t('Search volumes')}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Select
                  isOpen={isStateSelectOpen}
                  onOpenChange={setIsStateSelectOpen}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setIsStateSelectOpen(!isStateSelectOpen)}
                      isExpanded={isStateSelectOpen}
                    >
                      {selectedStateLabels}
                    </MenuToggle>
                  )}
                  onSelect={(_, value) => {
                    if (typeof value === 'string' && isVolumeStateFilterValue(value)) {
                      toggleStateFilter(value);
                    }
                  }}
                >
                  <SelectList>
                    {FILTERABLE_STATE_OPTIONS.map((option) => (
                      <SelectOption
                        key={option.value}
                        value={option.value}
                        hasCheckbox
                        isSelected={stateFilters.includes(option.value)}
                      >
                        {stateLabels[option.enumValue]}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>

        {volumes.length === 0 && !nameSearch && stateFilters.length === 0 ? (
          <SubtleContent
            title={t('No volumes found')}
            body={t('Volumes are created by tenants and will appear here once provisioned.')}
          />
        ) : volumes.length === 0 ? (
          <SubtleContent title={t('No results')} body={t('Try adjusting your filters or search.')} />
        ) : (
          <AdminVolumeTable volumes={volumes} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default AdminVolumesListPage;
