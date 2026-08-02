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

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { useBareMetalInstanceCatalogItems } from '../../../../api/v1/baremetal-instance';
import { useTranslation } from '../../../../hooks/useTranslation';
import CatalogItemCard from '../../../catalog/CatalogItemCard';
import { filterCatalogItemsBySearch } from '../../../catalog/catalogItemDisplay';
import { toCatalogProvisionCatalogItem } from '../../catalogProvisionItem';

interface Props {
  selectedCatalogItemId: string;
  onSelect: (item: BareMetalInstanceCatalogItem) => void;
}

export const BareMetalCatalogStep = ({ selectedCatalogItemId, onSelect }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch,
  } = useBareMetalInstanceCatalogItems();

  const filtered = useMemo(
    () =>
      filterCatalogItemsBySearch(
        catalogItems.map((item) =>
          toCatalogProvisionCatalogItem({
            id: item.id,
            title: item.title,
            description: item.description,
            template: item.template,
            published: item.published,
            metadata: item.metadata,
            fieldDefinitions: item.fieldDefinitions,
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
              placeholder={t('catalogProvision.catalog.searchPlaceholder')}
              value={search}
              onChange={(_event, value) => setSearch(value)}
              onClear={() => setSearch('')}
              aria-label={t('catalogProvision.baremetal.catalog.searchAria')}
            />
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <Content component="p">
          {catalogLoading
            ? t('catalogProvision.catalog.loading')
            : t('catalogProvision.baremetal.catalog.count', { count: filtered.length })}
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
          aria-label={t('catalogProvision.baremetal.catalog.selectAria')}
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
              <Content component="p">{t('catalogProvision.baremetal.catalog.empty')}</Content>
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
                    kind="baremetal"
                    id={`bm-catalog-item-card-${provisionItem.id}`}
                    ouiaId={`bm-catalog-item-option-${provisionItem.id}`}
                    selection={{
                      selected: selectedCatalogItemId === provisionItem.id,
                      radioName: 'selectedBareMetalCatalogItem',
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
