import { useMemo, useState } from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { useMaaSCatalogItems } from '../../../../api/v1/maas-catalog-item';
import type { ModelCatalogItem } from '../../../../api/v1/maas-types';
import { useSession } from '../../../../hooks/use-session';
import { useTranslation } from '../../../../hooks/useTranslation';
import CatalogItemCard from '../../../catalog/CatalogItemCard';
import { filterCatalogItemsBySearch } from '../../../catalog/catalogItemDisplay';
import { toCatalogProvisionCatalogItem } from '../../catalogProvisionItem';

interface Props {
  selectedCatalogItemId: string;
  onSelect: (item: ModelCatalogItem) => void;
}

export const MaaSCatalogStep = ({ selectedCatalogItemId, onSelect }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { tenantId } = useSession();

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch,
  } = useMaaSCatalogItems({}, tenantId);

  const filtered = useMemo(
    () =>
      filterCatalogItemsBySearch(
        catalogItems.map((item) =>
          toCatalogProvisionCatalogItem({
            id: item.id,
            title: item.title,
            description: item.description,
            published: item.published,
            metadata: item.metadata,
            fieldDefinitions: item.field_definitions,
          }),
        ),
        search,
      ),
    [catalogItems, search],
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex
          direction={{ default: 'column', md: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem flex={{ default: 'flex_1' }}>
            <SearchInput
              placeholder={t('catalogProvision.maas.catalog.searchPlaceholder')}
              value={search}
              onChange={(_event, value) => setSearch(value)}
              onClear={() => setSearch('')}
              aria-label={t('catalogProvision.maas.catalog.searchAria')}
            />
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <Content component="p">
          {catalogLoading
            ? t('catalogProvision.catalog.loading')
            : t('catalogProvision.maas.catalog.count', { count: filtered.length })}
        </Content>
      </StackItem>

      {catalogError && (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" title={t('catalogProvision.catalog.loadError')}>
                {t('catalogProvision.catalog.loadErrorDetail')}
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="primary" onClick={() => void refetch()}>
                {t('catalogProvision.actions.retry')}
              </Button>
            </StackItem>
          </Stack>
        </StackItem>
      )}

      <StackItem>
        <Gallery
          hasGutter
          minWidths={{ default: '200px' }}
          role="radiogroup"
          aria-label={t('catalogProvision.maas.catalog.selectAria')}
        >
          {catalogLoading && (
            <GalleryItem>
              <Bullseye>
                <Spinner aria-label={t('catalogProvision.catalog.loading')} />
              </Bullseye>
            </GalleryItem>
          )}

          {!catalogLoading && !catalogError && filtered.length === 0 && (
            <GalleryItem>
              <Content component="p">{t('catalogProvision.maas.catalog.empty')}</Content>
            </GalleryItem>
          )}

          {!catalogLoading &&
            !catalogError &&
            filtered.map((provisionItem) => {
              const rawItem = catalogItems.find((ci) => ci.id === provisionItem.id);
              if (!rawItem) {
                return null;
              }
              return (
                <GalleryItem key={provisionItem.id}>
                  <CatalogItemCard
                    item={provisionItem}
                    kind="maas"
                    id={`maas-catalog-item-card-${provisionItem.id}`}
                    ouiaId={`maas-catalog-item-option-${provisionItem.id}`}
                    selection={{
                      selected: selectedCatalogItemId === provisionItem.id,
                      radioName: 'selectedMaaSCatalogItem',
                      onSelect: () => onSelect(rawItem),
                    }}
                  />
                </GalleryItem>
              );
            })}
        </Gallery>
      </StackItem>
    </Stack>
  );
};
