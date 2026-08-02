/**
 * flow: maas-list
 * route: /models (tenantUser, tenantAdmin)
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import BanIcon from '@patternfly/react-icons/dist/esm/icons/ban-icon';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useMaaSCatalogItems } from '@osac/ui-components/api/v1/maas-catalog-item';
import { useModelAccesses, useRevokeModelAccess } from '@osac/ui-components/api/v1/maas-instance';
import type { ModelAccessState } from '@osac/ui-components/api/v1/maas-types';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type StateFilter = 'all' | 'active' | 'revoked';

const ModelAccessStateLabel = ({ state }: { state: ModelAccessState | undefined }) => {
  const { t } = useTranslation();
  switch (state) {
    case 'ACTIVE':
      return (
        <Label isCompact color="green">
          {t('Active')}
        </Label>
      );
    case 'PROVISIONING':
      return (
        <Label isCompact color="blue">
          {t('Provisioning')}
        </Label>
      );
    case 'REVOKED':
      return (
        <Label isCompact color="grey">
          {t('Revoked')}
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          {t('Unknown')}
        </Label>
      );
  }
};

export const MaaSListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [search, setSearch] = useState('');

  const { data: accesses = [], isLoading, error } = useModelAccesses();
  const { data: catalogItems = [] } = useMaaSCatalogItems({}, tenantId);
  const { mutate: revoke, isPending: revoking } = useRevokeModelAccess();

  const catalogItemTitle = (catalogItemId: string | undefined) => {
    if (!catalogItemId) {
      return '—';
    }
    return catalogItems.find((ci) => ci.id === catalogItemId)?.title ?? catalogItemId;
  };

  const filtered = useMemo(() => {
    return accesses.filter((a) => {
      const name = (a.spec?.applicationName ?? a.metadata?.name ?? a.id).toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase());
      const matchesState =
        stateFilter === 'all' ||
        (stateFilter === 'active' &&
          (a.status?.state === 'ACTIVE' || a.status?.state === 'PROVISIONING')) ||
        (stateFilter === 'revoked' && a.status?.state === 'REVOKED');
      return matchesSearch && matchesState;
    });
  }, [accesses, search, stateFilter]);

  return (
    <ListPage
      title={t('AI Models')}
      description={t(
        'Model access credentials provisioned for your applications. Each access provides an OpenAI-compatible endpoint secured by an API key.',
      )}
      actions={
        <Button variant="primary" onClick={() => navigate('/catalog')}>
          {t('Browse catalog')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          style={{ marginBottom: '1rem' }}
        >
          <FlexItem>
            <SearchInput
              placeholder={t('Search by name…')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup aria-label={t('Filter by state')}>
              <ToggleGroupItem
                text={t('All')}
                buttonId="maas-filter-all"
                isSelected={stateFilter === 'all'}
                onChange={() => setStateFilter('all')}
              />
              <ToggleGroupItem
                text={t('Active')}
                buttonId="maas-filter-active"
                isSelected={stateFilter === 'active'}
                onChange={() => setStateFilter('active')}
              />
              <ToggleGroupItem
                text={t('Revoked')}
                buttonId="maas-filter-revoked"
                isSelected={stateFilter === 'revoked'}
                onChange={() => setStateFilter('revoked')}
              />
            </ToggleGroup>
          </FlexItem>
        </Flex>

        {filtered.length === 0 ? (
          search || stateFilter !== 'all' ? (
            <Alert variant="info" isInline title={t('No model accesses match your filters.')} />
          ) : (
            <EmptyState titleText={t('No model accesses yet')} headingLevel="h2">
              <EmptyStateBody>
                {t('Browse the catalog to request access to an AI model.')}
              </EmptyStateBody>
              <Button variant="primary" onClick={() => navigate('/catalog')}>
                {t('Browse catalog')}
              </Button>
            </EmptyState>
          )
        ) : (
          <Table aria-label={t('Model accesses')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Model')}</Th>
                <Th>{t('Endpoint')}</Th>
                <Th>{t('Monthly quota')}</Th>
                <Th>{t('Created')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((access) => {
                const name = access.spec?.applicationName ?? access.metadata?.name ?? access.id;
                const isRevoked = access.status?.state === 'REVOKED';
                return (
                  <Tr key={access.id}>
                    <Td dataLabel={t('Name')}>
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/models/${access.id}`)}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel={t('Status')}>
                      <ModelAccessStateLabel state={access.status?.state} />
                    </Td>
                    <Td dataLabel={t('Model')}>{catalogItemTitle(access.spec?.catalogItem)}</Td>
                    <Td dataLabel={t('Endpoint')}>
                      {access.status?.endpoint ? (
                        <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                          {access.status.endpoint}
                        </code>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel={t('Monthly quota')}>
                      {access.spec?.tokenQuotaMonthly
                        ? access.spec.tokenQuotaMonthly.toLocaleString()
                        : '—'}
                    </Td>
                    <Td dataLabel={t('Created')}>
                      <Timestamp value={access.metadata?.creationTimestamp} />
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('View details'),
                            onClick: () => navigate(`/models/${access.id}`),
                          },
                          { isSeparator: true },
                          {
                            title: (
                              <>
                                <BanIcon /> {t('Revoke')}
                              </>
                            ),
                            isDisabled: isRevoked || revoking,
                            onClick: (e) => {
                              e.stopPropagation();
                              revoke(access.id);
                            },
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
