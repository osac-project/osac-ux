import { Spinner } from '@patternfly/react-core';

import { useComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';
import { useTranslation } from '../../../hooks/useTranslation';

interface VmDetailsCatalogValueProps {
  catalogItemId?: string;
}

export const VmDetailsCatalogValue = ({ catalogItemId }: VmDetailsCatalogValueProps) => {
  const { t } = useTranslation();
  const { data, isLoading } = useComputeInstanceCatalogItem(catalogItemId);

  if (!catalogItemId) {
    return '—';
  }

  if (isLoading) {
    return <Spinner size="sm" aria-label={t('Loading catalog item')} />;
  }

  const displayName = data?.title || data?.metadata?.name;
  return displayName ?? catalogItemId;
};
