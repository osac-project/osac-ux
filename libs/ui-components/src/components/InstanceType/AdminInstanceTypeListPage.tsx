import { InstanceTypes } from '@osac/types/private';
import { useListResource } from '@osac/ui-components/api/use-resource';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';

import AdminInstanceTypeTable from './AdminInstanceTypeTable';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const AdminInstanceTypeListPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useListResource(InstanceTypes);
  const instanceTypes = data?.items || [];

  return (
    <ListPage
      title={t('Instance types')}
      description={t('Manage provider-defined instance types for this cloud platform.')}
      error={error}
      actions={
        <CreateButton to="/admin/infrastructure/instance-types/create" icon={null}>
          {t('Create instance type')}
        </CreateButton>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {instanceTypes.length === 0 ? (
          <SubtleContent component="p">
            {t('No instance types yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <AdminInstanceTypeTable instanceTypes={instanceTypes} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default AdminInstanceTypeListPage;
