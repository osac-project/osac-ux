/**
 * flow: bare-metal-create
 * route: /bare-metal/create/:catalogItemId? (tenantUser, tenantAdmin)
 */
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb } from '@patternfly/react-core';

import { BareMetalProvisionWizard } from '../../components/catalogProvision/BareMetalProvisionWizard';

export const BareMetalCreatePage = () => {
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Context-aware breadcrumb:
  // - Arriving via /catalog (explicit state or catalogItemId present) → back to Catalog
  // - Arriving from bare-metal list → back to Bare Metal
  const fromCatalog =
    (location.state as { from?: string } | null)?.from === '/catalog' || Boolean(catalogItemId);

  const parentPath = fromCatalog ? '/catalog' : '/bare-metal';
  const parentLabel = fromCatalog ? 'Catalog' : 'Bare Metal';

  return (
    <>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate(parentPath)} style={{ cursor: 'pointer' }}>
            {parentLabel}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Create bare metal</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <BareMetalProvisionWizard
        initialCatalogItemId={catalogItemId}
        onClosed={() => navigate('/bare-metal')}
      />
    </>
  );
};
