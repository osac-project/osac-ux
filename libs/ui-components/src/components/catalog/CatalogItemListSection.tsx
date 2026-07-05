import { useState } from 'react';
import {
  Alert,
  Bullseye,
  ExpandableSection,
  Gallery,
  GalleryItem,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import CatalogItemCard from './CatalogItemCard';
import type { CatalogItemForDisplay, CatalogItemKind } from './catalogItemDisplay';
import { getErrorMessage } from '../../utils/error';

interface CatalogItemListSectionProps {
  title: string;
  kind: CatalogItemKind;
  items: CatalogItemForDisplay[];
  selectedItemId?: string | null;
  onSelectItem: (item: CatalogItemForDisplay) => void;
  isLoading?: boolean;
  error?: unknown;
}

export const CatalogItemListSection = ({
  title,
  kind,
  items,
  selectedItemId = null,
  onSelectItem,
  isLoading = false,
  error = null,
}: CatalogItemListSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isLoading && !error && items.length === 0) {
    return null;
  }

  return (
    <StackItem>
      <Stack hasGutter>
        <ExpandableSection
          toggleText={title}
          isExpanded={isExpanded}
          onToggle={(_e, expanded) => setIsExpanded(expanded)}
          isIndented={false}
          displaySize="lg"
        >
          {isLoading && (
            <Bullseye>
              <Spinner aria-label={`Loading ${title}`} />
            </Bullseye>
          )}
          {error && (
            <Alert variant="danger" title={title} isInline>
              {getErrorMessage(error)}
            </Alert>
          )}
          {items.length > 0 && (
            <Gallery
              hasGutter
              minWidths={{ default: '200px', md: '240px', lg: '260px', xl: '280px' }}
              maxWidths={{ md: '280px', lg: '320px', xl: '360px' }}
            >
              {items.map((item) => (
                <GalleryItem key={item.id}>
                  <CatalogItemCard
                    item={item}
                    kind={kind}
                    isBrowseSelected={selectedItemId === item.id}
                    onOpenDetails={() => onSelectItem(item)}
                  />
                </GalleryItem>
              ))}
            </Gallery>
          )}
        </ExpandableSection>
      </Stack>
    </StackItem>
  );
};
