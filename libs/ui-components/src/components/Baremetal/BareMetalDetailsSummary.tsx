import CalendarAltIcon from '@patternfly/react-icons/dist/esm/icons/calendar-alt-icon';
import DollarSignIcon from '@patternfly/react-icons/dist/esm/icons/dollar-sign-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';
import TagIcon from '@patternfly/react-icons/dist/esm/icons/tag-icon';

import type { BareMetalInstance, BareMetalInstanceCatalogItem } from '@osac/types';
import { BareMetalInstanceState } from '@osac/types';

import { BareMetalStatusLabel } from './BareMetalStatusLabel';
import { ResourceKpiHeader } from '../Resource/Header';

interface BareMetalDetailsSummaryProps {
  instance: BareMetalInstance;
  catalogItem?: BareMetalInstanceCatalogItem;
}

export const BareMetalDetailsSummary = ({
  instance,
  catalogItem,
}: BareMetalDetailsSummaryProps) => {
  const state = instance.status?.state ?? BareMetalInstanceState.UNSPECIFIED;

  const rawPrice = catalogItem?.metadata?.labels?.['price_per_hour'];
  const priceValue = rawPrice ? `$${parseFloat(rawPrice).toFixed(2)}/hr` : '—';

  const createdAt = instance.metadata?.creationTimestamp
    ? new Date(instance.metadata.creationTimestamp).toLocaleDateString()
    : '—';

  return (
    <ResourceKpiHeader
      ariaLabel="Bare metal instance summary"
      items={[
        {
          title: 'Status',
          icon: ServerIcon,
          value: <BareMetalStatusLabel state={state} />,
        },
        {
          title: 'Catalog item',
          icon: TagIcon,
          value: catalogItem?.title ?? instance.spec?.catalogItem ?? '—',
        },
        {
          title: 'Price',
          icon: DollarSignIcon,
          value: priceValue,
        },
        {
          title: 'Created',
          icon: CalendarAltIcon,
          value: createdAt,
        },
      ]}
    />
  );
};
