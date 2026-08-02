/**
 * flow: cluster-create
 * route: /clusters/create/:catalogItemId? (tenantUser, tenantAdmin)
 */
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb } from '@patternfly/react-core';

import { ClusterProvisionWizard } from '../../components/catalogProvision/ClusterProvisionWizard';
import { useTranslation } from '../../hooks/useTranslation';

export const ClusterCreatePage = () => {
  const { t } = useTranslation();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where the "back" crumb should go.
  // If the user arrived from /catalog (state or no catalogItemId context) → back to /catalog
  // Otherwise (e.g. from /clusters) → back to /clusters
  const fromCatalog =
    (location.state as { from?: string } | null)?.from === '/catalog' || Boolean(catalogItemId);

  const parentPath = fromCatalog ? '/catalog' : '/clusters';
  const parentLabel = fromCatalog ? t('Catalog') : t('Clusters');

  return (
    <>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate(parentPath)} style={{ cursor: 'pointer' }}>
            {parentLabel}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t('Create cluster')}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <ClusterProvisionWizard
        initialCatalogItemId={catalogItemId}
        onClosed={() => navigate('/clusters')}
      />
    </>
  );
};
