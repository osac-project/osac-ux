import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { type StorageTier, StorageProtocol } from '@osac/types';
import { useStorageTiers } from '@osac/ui-components/api/v1/storage-tiers';
import { cel } from '@osac/ui-components/api/cel';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { StorageTierStatusLabel } from '@osac/ui-components/components/Storage/StorageTierStatusLabel';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

const PROTOCOL_LABELS: Record<StorageProtocol, string> = {
  [StorageProtocol.UNSPECIFIED]: 'Unspecified',
  [StorageProtocol.BLOCK]: 'Block',
  [StorageProtocol.NFS]: 'NFS',
};

const buildStorageTierCelFilter = (nameSearch: string) =>
  nameSearch
    ? cel<StorageTier>((b) => b.field('metadata.name').contains(nameSearch))
    : undefined;

export const StorageTiersPage = () => {
  const { t } = useTranslation();
  const [nameSearch, setNameSearch] = usePageFilter(SEARCH_PARAM);

  const celFilter = buildStorageTierCelFilter(nameSearch);
  const { data: tiers = [], isLoading, error } = useStorageTiers({ filter: celFilter });

  return (
    <ListPage
      title={t('Storage tiers')}
      label={t('Storage')}
      description={t(
        'Browse available storage tiers. Each tier defines a protocol and quality-of-service characteristics for volumes.',
      )}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                placeholder={t('Search by name')}
                value={nameSearch}
                onChange={(_event, value) => setNameSearch(value)}
                onClear={() => setNameSearch('')}
                aria-label={t('Search storage tiers')}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {tiers.length === 0 && !nameSearch ? (
          <SubtleContent
            title={t('No storage tiers found')}
            body={t('Contact your administrator to configure storage tiers.')}
          />
        ) : tiers.length === 0 && nameSearch ? (
          <SubtleContent title={t('No results')} body={t('Try adjusting your search.')} />
        ) : (
          <Table aria-label={t('Storage tiers')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Description')}</Th>
                <Th>{t('Protocol')}</Th>
                <Th>{t('Status')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tiers.map((tier) => (
                <Tr key={tier.id}>
                  <Td dataLabel={t('Name')}>
                    <Link to={`/storage/tiers/${tier.id}`}>{tier.metadata?.name}</Link>
                  </Td>
                  <Td dataLabel={t('Description')}>{tier.spec?.description || '—'}</Td>
                  <Td dataLabel={t('Protocol')}>
                    {tier.spec?.protocol ? PROTOCOL_LABELS[tier.spec.protocol] : '—'}
                  </Td>
                  <Td dataLabel={t('Status')}>
                    <StorageTierStatusLabel state={tier.status?.state} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default StorageTiersPage;
