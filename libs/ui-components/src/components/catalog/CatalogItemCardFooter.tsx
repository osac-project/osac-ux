import { FC } from 'react';
import { CardFooter, Content, Flex, FlexItem } from '@patternfly/react-core';
import { RhUiLockFillIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-lock-fill-icon';
import { TFunction } from 'i18next';

import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import CatalogItemLaunchButton from '@osac/ui-components/components/catalog/CatalogItemLaunchButton';
import CatalogItemTenant from '@osac/ui-components/components/catalog/CatalogItemTenant';
import FieldSeparator from '@osac/ui-components/components/Primitives/FieldSeparator';
import { Timestamp } from '@osac/ui-components/components/Primitives/Timestamp';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { UserRole } from '@osac/ui-components/shellTypes';

type CatalogItemCardFooterProps = {
  catalogItem: CatalogItem;
  role: UserRole;
  isWizardMode: boolean;
};

interface RateValues {
  hourly: number;
  monthly: number;
}

const RATE_HOURLY_ANNOTATION = 'osac.io/rate-hourly';
const RATE_MONTHLY_ANNOTATION = 'osac.io/rate-monthly';

const getRateValues = (catalogItem: CatalogItem): RateValues | undefined => {
  const annotations = catalogItem.metadata?.annotations;
  const hourlyRate = Number(annotations?.[RATE_HOURLY_ANNOTATION]);
  const monthlyRate = Number(annotations?.[RATE_MONTHLY_ANNOTATION]);

  if (!Number.isFinite(hourlyRate) || !Number.isFinite(monthlyRate)) {
    return undefined;
  }

  return { hourly: hourlyRate, monthly: monthlyRate };
};

const formatRate = (rateValues: RateValues | undefined): string | undefined => {
  if (!rateValues) {
    return undefined;
  }

  return `$${rateValues.hourly.toFixed(2)}/hr · $${rateValues.monthly.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}/mo per instance`;
};

const getConfiguredString = (catalogItem: CatalogItem, t: TFunction) => {
  switch (catalogItem.$typeName) {
    case 'osac.public.v1.ComputeInstanceCatalogItem':
      return t('Virtual machine pre-configured');
    case 'osac.public.v1.BareMetalInstanceCatalogItem':
      return t('Hardware pre-configured');
    case 'osac.public.v1.ClusterCatalogItem':
      return t('Cluster pre-configured');
    default:
      return undefined;
  }
};

const CatalogItemCardFooter: FC<CatalogItemCardFooterProps> = ({
  catalogItem,
  role,
  isWizardMode,
}) => {
  const { t } = useTranslation();
  const rateValues = getRateValues(catalogItem);
  const rate = formatRate(rateValues);

  const renderFooterText = () => {
    if (role === 'tenant-user') {
      const configured = getConfiguredString(catalogItem, t);
      return (
        <Flex flexWrap={{ default: 'nowrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
          <FlexItem>
            <RhUiLockFillIcon />
          </FlexItem>
          {configured ? (
            <>
              <FlexItem>{configured}</FlexItem>
              <FlexItem>
                <FieldSeparator />
              </FlexItem>
            </>
          ) : null}
          <FlexItem>{t('Admin-managed')}</FlexItem>
        </Flex>
      );
    }

    if (role === 'tenant-admin') {
      return (
        <Flex flexWrap={{ default: 'nowrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
          <FlexItem>{catalogItem.metadata?.creator || '-'}</FlexItem>
          <FlexItem>
            <FieldSeparator />
          </FlexItem>
          <FlexItem>
            <Timestamp value={catalogItem.metadata?.creationTimestamp} format="Date" />
          </FlexItem>
        </Flex>
      );
    }

    return catalogItem.metadata?.tenant?.length ? (
      <CatalogItemTenant catalogItem={catalogItem} />
    ) : (
      '-'
    );
  };

  return (
    <CardFooter className="catalog-item-card__footer">
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        {isWizardMode && rateValues ? (
          <FlexItem className="catalog-item-card__estimate">
            <Content component="small">{t('Estimate cost')}</Content>
            <Flex
              className="catalog-item-card__estimate-values"
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsLg' }}
            >
              <FlexItem>
                <strong>
                  ${rateValues.hourly.toFixed(2)}/{t('hour')}
                </strong>
              </FlexItem>
              <FlexItem>
                <strong>
                  ${rateValues.monthly.toFixed(2)}/{t('month')}
                </strong>
              </FlexItem>
            </Flex>
          </FlexItem>
        ) : rate && !isWizardMode ? (
          <FlexItem>
            <Content component="small" className="catalog-item-card__rate">
              <strong>{t('Rate')}</strong> {rate}
            </Content>
          </FlexItem>
        ) : null}
        {!isWizardMode ? (
          <FlexItem>
            <Content component="small" className="pf-v6-u-color-text-subtle">
              {renderFooterText()}
            </Content>
          </FlexItem>
        ) : null}
        {!isWizardMode && role !== 'admin' ? (
          <FlexItem>
            <CatalogItemLaunchButton
              isDisabled={!catalogItem.published}
              className="pf-v6-u-w-100"
              catalogItem={catalogItem}
            />
          </FlexItem>
        ) : null}
      </Flex>
    </CardFooter>
  );
};

export default CatalogItemCardFooter;
