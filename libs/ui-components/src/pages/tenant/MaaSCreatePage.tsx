/**
 * flow: maas-create
 * route: /models/create/:catalogItemId? (tenantUser, tenantAdmin)
 */
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb } from '@patternfly/react-core';

import { MaaSProvisionWizard } from '../../components/catalogProvision/MaaSProvisionWizard';
import { useTranslation } from '../../hooks/useTranslation';

export const MaaSCreatePage = () => {
  const { t } = useTranslation();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const fromCatalog =
    (location.state as { from?: string } | null)?.from === '/catalog' || Boolean(catalogItemId);

  const parentPath = fromCatalog ? '/catalog' : '/models';
  const parentLabel = fromCatalog ? t('Catalog') : t('AI Models');

  return (
    <>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate(parentPath)} style={{ cursor: 'pointer' }}>
            {parentLabel}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t('Request model access')}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <MaaSProvisionWizard
        initialCatalogItemId={catalogItemId}
        onClosed={() => navigate('/models')}
      />
    </>
  );
};
