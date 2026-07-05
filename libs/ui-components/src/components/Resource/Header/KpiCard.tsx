import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Card, CardBody, CardTitle, Flex, FlexItem, Icon } from '@patternfly/react-core';

export interface KpiCardProps {
  title: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}

export const KpiCard = ({ title, icon: IconComponent, children }: KpiCardProps) => (
  <Card isFullHeight>
    <CardTitle>
      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
        {IconComponent && (
          <FlexItem>
            <Icon size="md">
              <IconComponent aria-hidden />
            </Icon>
          </FlexItem>
        )}
        <FlexItem>{title}</FlexItem>
      </Flex>
    </CardTitle>
    <CardBody>{children}</CardBody>
  </Card>
);
