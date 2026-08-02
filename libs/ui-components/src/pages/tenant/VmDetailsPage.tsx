/**
 * flow: manage-virtual-machines
 * step: mvm_detail_view
 */
import { useParams } from 'react-router-dom';

import { useComputeInstance } from '../../api/v1/compute-instance';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { VmDetails } from '../../components/vm/DetailsPage/VmDetails';
import { useTranslation } from '../../hooks/useTranslation';

export const VmDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const { data: vm, isLoading, isError, refetch } = useComputeInstance(id);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/vms"
        parentLabel={t('Virtual machines')}
        tabLabels={[t('Overview'), t('Networking')]}
        tabsId="vm-detail-tabs"
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel={t('Virtual machines')}
        resourceLabel={t('virtual machine')}
        variant="load-error"
        onRetry={() => void refetch()}
      />
    );
  }

  if (!vm) {
    return (
      <ResourceDetailsPageError
        parentTo="/vms"
        parentLabel={t('Virtual machines')}
        resourceLabel={t('virtual machine')}
        variant="not-found"
      />
    );
  }

  return <VmDetails vm={vm} />;
};
