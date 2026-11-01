import { useMemo } from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { TFunction } from 'i18next';

import { IdentityProviders } from '@osac/types';
import { useListResource } from '@osac/ui-components/api/use-resource';
import IdentityProviderActionsMenu from '@osac/ui-components/components/IdentityProvider/IdentityProviderActionsMenu';
import IdentityProviderStatusLabel from '@osac/ui-components/components/IdentityProvider/IdentityProviderStatusLabel';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter.ts';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { getIdpName } from './utils';

const resolveIdpProtocol = (t: TFunction, configCase: string | undefined): string => {
  switch (configCase) {
    case 'oidc':
      return t('OpenID Connect (OIDC)');
    default:
      return '-';
  }
};

const IdentityProviderListPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);

  const { data, isLoading, error } = useListResource(IdentityProviders);

  const filteredProviders = useMemo(() => {
    if (!search || !data?.items) {
      return data?.items || [];
    }
    const lowerSearch = search.toLowerCase();
    return data.items.filter((idp) => {
      const title = getIdpName(idp);
      return title.toLowerCase().includes(lowerSearch);
    });
  }, [search, data?.items]);

  return (
    <ListPage
      title={t('Identity providers')}
      description={t('Manage identity providers for your tenant.')}
      error={error}
      actions={
        <CreateButton to="/tenant/identity-provider/create">
          {t('Create identity provider')}
        </CreateButton>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search identity providers by name…')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search identity providers')}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredProviders.length === 0 ? (
          <SubtleContent component="p">
            {search
              ? t('No identity providers match your search.')
              : t('No identity providers yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Identity providers')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Display name')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Protocol')}</Th>
                <Th>{t('Issuer URL')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filteredProviders.map((idp) => (
                <Tr key={idp.id}>
                  <Td dataLabel={t('Display name')}>
                    <ResourceNameField
                      resource={idp}
                      title={getIdpName(idp)}
                      subTitle={idp.metadata?.name}
                    />
                  </Td>
                  <Td dataLabel={t('Status')}>
                    <IdentityProviderStatusLabel idp={idp} />
                  </Td>
                  <Td dataLabel={t('Protocol')}>{resolveIdpProtocol(t, idp.spec?.config.case)}</Td>
                  <Td dataLabel={t('Issuer URL')}>
                    {idp.spec?.config.case === 'oidc' ? idp.spec.config.value.issuer : '-'}
                  </Td>
                  <Td dataLabel={t('Actions')} isActionCell>
                    <IdentityProviderActionsMenu idp={idp} />
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

export default IdentityProviderListPage;
