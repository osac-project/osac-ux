/**
 * flow: provider-admin
 * route: /provider/audit-log
 */
import { useMemo, useState } from 'react';
import { Label, SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useAuditEvents } from '../../api/v1/compliance';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const ACTION_COLOR = (action: string): 'red' | 'blue' | 'grey' => {
  if (action.endsWith('.delete')) {
    return 'red';
  }
  if (action.endsWith('.create')) {
    return 'blue';
  }
  return 'grey';
};

export const ProviderAuditLogPage = () => {
  const { t } = useTranslation();
  const { data: events = [], isLoading, error } = useAuditEvents();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return events;
    }
    return events.filter(
      (e) =>
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resourceName.toLowerCase().includes(q) ||
        (e.tenant ?? '').toLowerCase().includes(q),
    );
  }, [events, search]);

  return (
    <ListPage
      title={t('Audit log')}
      description={t(
        'Platform-wide activity trail across tenants — who did what, when, and to which resource (OSAC-63).',
      )}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                aria-label={t('Search audit events')}
                placeholder={t('Search by actor, action, resource, or tenant')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table aria-label={t('Audit events')} variant="compact">
          <Thead>
            <Tr>
              <Th>{t('Timestamp')}</Th>
              <Th>{t('Actor')}</Th>
              <Th>{t('Action')}</Th>
              <Th>{t('Resource')}</Th>
              <Th>{t('Tenant')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5}>{t('No audit events match the current search.')}</Td>
              </Tr>
            ) : (
              filtered.map((e) => (
                <Tr key={e.id}>
                  <Td dataLabel={t('Timestamp')}>{new Date(e.timestamp).toLocaleString()}</Td>
                  <Td dataLabel={t('Actor')}>{e.actor}</Td>
                  <Td dataLabel={t('Action')}>
                    <Label isCompact color={ACTION_COLOR(e.action)}>
                      {e.action}
                    </Label>
                  </Td>
                  <Td dataLabel={t('Resource')}>
                    {e.resourceKind} / {e.resourceName}
                  </Td>
                  <Td dataLabel={t('Tenant')}>{e.tenant ?? '—'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </ListPageBody>
    </ListPage>
  );
};
