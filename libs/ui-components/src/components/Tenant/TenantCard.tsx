import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Tenant } from '@osac/types/private';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import TenantActionsMenu from './TenantActionsMenu';
import TenantStatusLabel from './TenantStatusLabel';

import './TenantCard.css';

interface TenantCardProps {
  tenant: Tenant;
}

const getTenantInitial = (tenant: Tenant) => {
  const name = tenant.metadata?.name ?? tenant.id;
  return name.charAt(0).toUpperCase();
};

const TenantCard = ({ tenant }: TenantCardProps) => {
  const { t } = useTranslation();

  return (
    <Card isFullHeight className="tenant-card">
      <CardHeader
        className="tenant-card__header"
        actions={{
          actions: (
            <div className="tenant-card__header-actions">
              <TenantStatusLabel state={tenant.status?.state} />
              <TenantActionsMenu tenant={tenant} />
            </div>
          ),
        }}
      >
        <span className="tenant-card__initial" aria-hidden>
          {getTenantInitial(tenant)}
        </span>
      </CardHeader>
      <CardBody>
        <div className="tenant-card__main">
          <Stack hasGutter>
            <StackItem>
              <ResourceNameField
                resource={tenant}
                detailsUrl={`/admin/tenants/${tenant.id}`}
                nameLinkClassName="tenant-card__title-link"
              />
            </StackItem>
            <Divider />
            <StackItem>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Primary domain')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {tenant.spec?.domains?.[0] ?? '—'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Registered')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp value={tenant.metadata?.creationTimestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          </Stack>
        </div>
        <div className="tenant-card__footer">
          <Link
            className="pf-v6-c-button pf-m-link pf-m-inline"
            to={`/admin/tenants/${tenant.id}/placement`}
          >
            {t('Placement')}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
};

export default TenantCard;
