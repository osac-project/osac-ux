import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { NetworkTopologyPage } from '@osac/ui-components/NetworkTopologyPage';

export const ProviderInfraTopologyPage = () => {
  const { t } = useTranslation();
  const { data = [], isLoading, error } = useComputeInstances();

  return (
    <ListPage
      title={t('Infrastructure')}
      description={t('Platform-wide network topology across all tenant organizations.')}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <NetworkTopologyPage vms={data} />
      </ListPageBody>
    </ListPage>
  );
};
