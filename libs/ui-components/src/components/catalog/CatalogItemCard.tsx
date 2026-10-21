import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import CatalogItemCardFooter from '@osac/ui-components/components/catalog/CatalogItemCardFooter';
import type { CatalogItemResourceLookups } from '@osac/ui-components/components/catalog/catalogItemResourceLookups';
import CatalogItemResources from '@osac/ui-components/components/catalog/CatalogItemResources';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField';
import { useSession } from '@osac/ui-components/hooks/use-session';

import CatalogItemActionsMenu from './CatalogItemActionsMenu';
import { CatalogItem, catalogItemDetailsPath } from './catalogItemDisplay';
import { catalogItemTypeBadgeLabel } from './catalogItemDisplay';
import { useTranslation } from '../../hooks/useTranslation';
import { CatalogItemIcon } from '../../icons';

import './CatalogItemCard.css';

export interface CatalogItemCardSelection {
  selected: boolean;
  onSelect: () => void;
}

interface CatalogItemCardProps {
  item: CatalogItem;
  selection?: CatalogItemCardSelection;
  resourceLookups: CatalogItemResourceLookups;
}

const CatalogItemCard = ({ item, selection, resourceLookups }: CatalogItemCardProps) => {
  const { t } = useTranslation();
  const { role } = useSession();
  const isWizardMode = Boolean(selection);
  const isSizeLocked =
    isWizardMode &&
    item.$typeName === 'osac.public.v1.ComputeInstanceCatalogItem' &&
    item.fields?.bootDisk?.sizeGib?.behavior.case === 'locked';
  const cardId = `catalog-item-card-${item.id}`;
  const titleId = `${cardId}-title`;
  const handleSelectionKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isWizardMode || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }
    event.preventDefault();
    selection?.onSelect();
  };

  return (
    <Card
      id={cardId}
      ouiaId={`catalog-item-option-${item.id}`}
      className={`catalog-item-card${isWizardMode ? ' catalog-item-card--wizard' : ''}`}
      isSelectable={false}
      isSelected={selection?.selected}
      isDisabled={!item.published}
      onClick={isWizardMode ? selection?.onSelect : undefined}
      onKeyDown={handleSelectionKeyDown}
      role={isWizardMode ? 'radio' : undefined}
      aria-checked={isWizardMode ? selection?.selected : undefined}
      tabIndex={isWizardMode ? 0 : undefined}
    >
      <CardHeader
        className="catalog-item-card__header"
        actions={{
          actions: !isWizardMode ? (
            <Flex
              className="catalog-item-card__header-actions"
              flexWrap={{ default: 'nowrap' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              <FlexItem>
                <Label color="blue">{catalogItemTypeBadgeLabel(item, t)}</Label>
              </FlexItem>
              <FlexItem>
                {item.published ? (
                  <Label color="green">{t('Live')}</Label>
                ) : (
                  <Label>{t('Unpublished')}</Label>
                )}
              </FlexItem>
              {!isWizardMode ? (
                <FlexItem>
                  <CatalogItemActionsMenu item={item} role={role} />
                </FlexItem>
              ) : null}
            </Flex>
          ) : null,
        }}
      >
        <span className="catalog-item-card__icon" aria-hidden>
          <CatalogItemIcon kind={item.$typeName} />
        </span>
      </CardHeader>
      <CardTitle id={titleId} className="catalog-item-card__title">
        <ResourceNameField
          resource={item}
          subTitle={isWizardMode ? item.description || item.id : undefined}
          titleAdornment={
            isSizeLocked ? (
              <Label color="grey" isCompact>
                {t('Size locked')}
              </Label>
            ) : undefined
          }
          detailsUrl={isWizardMode ? undefined : catalogItemDetailsPath(item)}
          nameLinkClassName="catalog-item-card__title-link"
        />
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem className="catalog-item-card__resources">
            <CatalogItemResources
              catalogItem={item}
              resourceLookups={resourceLookups}
              hideLockedBadges={isWizardMode}
            />
          </StackItem>
        </Stack>
      </CardBody>
      <Divider />
      <CatalogItemCardFooter catalogItem={item} role={role} isWizardMode={isWizardMode} />
    </Card>
  );
};

export default CatalogItemCard;
