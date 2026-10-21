import { StorageProtocol, type StorageTier, StorageTierState, StorageTiers } from '@osac/types';

import { ResourceSelectField } from './ResourceSelectField';
import { cel } from '../../api/cel';
import { STORAGE_TIER_ACTIVE_LIST_FILTER } from '../../api/v1/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';

const STORAGE_TIER_ACTIVE_BLOCK_LIST_FILTER = cel<StorageTier>((filter) =>
  filter.and(
    filter.field('status.state').equals(StorageTierState.ACTIVE),
    filter.field('spec.protocol').equals(StorageProtocol.BLOCK),
  ),
);

interface StorageTierSelectFieldProps {
  name: string;
  label: string;
  fieldId: string;
  isRequired?: boolean;
  helperText?: string;
  protocol?: StorageProtocol;
  /** Renders the picker read-only when the catalog item does not allow editing this field. */
  isLocked?: boolean;
}

export const StorageTierSelectField = ({
  name,
  label,
  fieldId,
  isRequired = false,
  helperText,
  protocol,
  isLocked = false,
}: StorageTierSelectFieldProps) => {
  const { t } = useTranslation();

  return (
    <ResourceSelectField
      name={name}
      label={label}
      fieldId={fieldId}
      service={StorageTiers}
      request={{
        filter:
          protocol === StorageProtocol.BLOCK
            ? STORAGE_TIER_ACTIVE_BLOCK_LIST_FILTER
            : STORAGE_TIER_ACTIVE_LIST_FILTER,
      }}
      isRequired={isRequired}
      isDisabled={isLocked}
      helperText={helperText}
      isSearchable
      searchPlaceholder={t('Search storage tiers')}
      placeholder={t('Select a storage tier')}
      loadingPlaceholder={t('Loading...')}
      loadErrorTitle={t('Failed to load storage tiers')}
      emptyTitle={t('No storage tiers available')}
      emptyDescription={t('Contact your administrator.')}
    />
  );
};
