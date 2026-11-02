import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';

import { DISK_IMAGES_LIST_ROUTE } from './DiskImageForm';
import DiskImageWizard from './DiskImageWizard';
import { useTranslation } from '../../hooks/useTranslation';

const DiskImageCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(DISK_IMAGES_LIST_ROUTE)}>
                {t('Disk images')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create disk image')}
          </Title>
        </Stack>
      </PageSection>
      <DiskImageWizard />
    </>
  );
};

export default DiskImageCreatePage;
