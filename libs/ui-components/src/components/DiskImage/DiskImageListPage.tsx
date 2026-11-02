import { Checkbox, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

import { Tenants } from '@osac/types/private';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';

import DiskImageTable from './DiskImageTable';
import { useListResource } from '../../api/use-resource';
import { buildDiskImageListFilter, useDiskImages } from '../../api/v1/disk-image';
import { usePageFilter } from '../../hooks/use-page-filter';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const SHOW_OBSOLETE_PARAM = 'showObsolete';

const DiskImageListPage = () => {
  const { t } = useTranslation();

  const [showObsoleteParam, setShowObsoleteParam] = usePageFilter(SHOW_OBSOLETE_PARAM);

  const showObsolete = showObsoleteParam === 'true';

  const filter = buildDiskImageListFilter({
    search: '',
    guestOsFamily: undefined,
    architecture: [],
    lifecycle: [],
    showObsolete,
    scope: undefined,
  });

  const { data: diskImages = [], isLoading, error } = useDiskImages({ filter });
  const { data: tenantsResponse } = useListResource(Tenants);
  const tenants = tenantsResponse?.items ?? [];

  return (
    <ListPage
      title={t('Disk images')}
      description={t('Manage disk images available for provisioning virtual machines.')}
      error={error}
      actions={
        <CreateButton to="/admin/infrastructure/disk-images/create">
          {t('Create disk image')}
        </CreateButton>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Checkbox
                id="disk-image-show-obsolete"
                label={t('Show obsolete')}
                isChecked={showObsolete}
                onChange={(_event, checked) => setShowObsoleteParam(checked ? 'true' : '')}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        {diskImages.length === 0 ? (
          <SubtleContent component="p">
            {t('No disk images yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <DiskImageTable diskImages={diskImages} tenants={tenants} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default DiskImageListPage;
