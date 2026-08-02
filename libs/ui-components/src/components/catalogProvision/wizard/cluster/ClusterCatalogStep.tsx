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

import type { ClusterCatalogItem } from '@osac/types';

import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';
import { useTranslation } from '../../../../hooks/useTranslation';
import CatalogItemCard from '../../../catalog/CatalogItemCard';
import { filterCatalogItemsBySearch } from '../../../catalog/catalogItemDisplay';
import { clusterCatalogItemToProvisionItem } from '../../catalogProvisionItem';

interface Props {
  selectedCatalogItemId: string;
  onSelect: (item: ClusterCatalogItem) => void;
}

export const ClusterCatalogStep = ({ selectedCatalogItemId, onSelect }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch,
  } = useClusterCatalogItems();

  const filtered = useMemo(
    () => filterCatalogItemsBySearch(catalogItems.map(clusterCatalogItemToProvisionItem), search),
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
              placeholder={t('catalogProvision.catalog.searchPlaceholder')}
              value={search}
              onChange={(_event, value) => setSearch(value)}
              onClear={() => setSearch('')}
              aria-label={t('catalogProvision.cluster.catalog.searchAria')}
            />
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <Content component="p">
          {catalogLoading
            ? t('catalogProvision.catalog.loading')
            : t('catalogProvision.cluster.catalog.count', { count: filtered.length })}
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
          aria-label={t('catalogProvision.cluster.catalog.selectAria')}
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
              <Content component="p">{t('catalogProvision.cluster.catalog.empty')}</Content>
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
                    kind="cluster"
                    id={`catalog-item-card-${provisionItem.id}`}
                    ouiaId={`catalog-item-option-${provisionItem.id}`}
                    selection={{
                      selected: selectedCatalogItemId === provisionItem.id,
                      radioName: 'selectedClusterCatalogItem',
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
