import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';

import { KpiCard } from './KpiCard';

export interface KpiItem {
  title: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  value: ReactNode;
}

interface ResourceKpiHeaderProps {
  items: KpiItem[];
  ariaLabel?: string;
}

export const ResourceKpiHeader = ({ items, ariaLabel }: ResourceKpiHeaderProps) => (
  <Flex
    role="group"
    aria-label={ariaLabel}
    spaceItems={{ default: 'spaceItemsMd' }}
    flexWrap={{ default: 'wrap' }}
  >
    {items.map((item) => (
      <FlexItem key={item.title} flex={{ default: 'flex_1' }} style={{ minWidth: '140px' }}>
        <KpiCard title={item.title} icon={item.icon}>
          {item.value}
        </KpiCard>
      </FlexItem>
    ))}
  </Flex>
);
