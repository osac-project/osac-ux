import { Content, Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

import { type Tenant } from '@osac/types/private';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import TenantActionsMenu from '@osac/ui-components/components/Tenant/TenantActionsMenu';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import TenantStatusLabel from './TenantStatusLabel';

import './TenantTable.css';

interface TenantTableProps {
  tenants: Tenant[];
}

const TenantTable = ({ tenants }: TenantTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Tenants')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Domain')}</Th>
          <Th>{t('Billing account')}</Th>
          <Th>{t('Registered')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {tenants.map((tenant) => {
          const name = tenant.metadata?.name ?? tenant.id;
          const billingAccount = tenant.metadata?.annotations?.['osac.io/billing-account'];
          const billingAccountId = tenant.metadata?.annotations?.['osac.io/billing-account-id'];

          return (
            <Tr key={tenant.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      className="tenants-table__name-link"
                      to={`/admin/tenants/${encodeURIComponent(tenant.id)}`}
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Status')}>
                <TenantStatusLabel state={tenant.status?.state} />
              </Td>
              <Td dataLabel={t('Primary domain')}>{tenant.spec?.domains?.[0] ?? '—'}</Td>
              <Td dataLabel={t('Billing account')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>{billingAccount ?? '—'}</FlexItem>
                  {billingAccountId ? (
                    <FlexItem>
                      <Content component="small" className="tenants-table__meta">
                        {billingAccountId}
                      </Content>
                    </FlexItem>
                  ) : null}
                </Flex>
              </Td>
              <Td dataLabel={t('Registered')}>
                <Timestamp value={tenant.metadata?.creationTimestamp} format="Time" />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <TenantActionsMenu tenant={tenant} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default TenantTable;
