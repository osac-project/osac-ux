import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import RhUiZoneIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-zone-icon';

import type { NATGateway, VirtualNetwork } from '@osac/types';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { VirtualNetworkStatusLabel } from '../../components/networking/VirtualNetworkStatusLabel';
import { Timestamp } from '../../components/Primitives/Timestamp';

import './VirtualNetworkCard.css';

interface VirtualNetworkCardProps {
  virtualNetwork: VirtualNetwork;
  subnetCount: number;
  securityGroupCount: number;
  natGateway?: NATGateway;
  natGatewayAddress?: string;
}

const VirtualNetworkCard = ({
  virtualNetwork,
  subnetCount,
  securityGroupCount,
  natGateway,
  natGatewayAddress,
}: VirtualNetworkCardProps) => {
  const { t } = useTranslation();

  return (
    <Card isFullHeight className="virtual-network-card">
      <CardHeader
        className="virtual-network-card__header"
        actions={{
          actions: <VirtualNetworkStatusLabel state={virtualNetwork.status?.state} />,
        }}
      >
        <span className="virtual-network-card__icon" aria-hidden>
          <RhUiZoneIcon />
        </span>
      </CardHeader>
      <CardBody>
        <div className="virtual-network-card__main">
          <Stack hasGutter>
            <StackItem>
              <ResourceNameField
                resource={virtualNetwork}
                detailsUrl={`/networking/virtual-networks/${virtualNetwork.id}`}
                nameLinkClassName="virtual-network-card__title-link"
              />
            </StackItem>
            <Divider />
            <StackItem>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('IPv4 CIDR')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{virtualNetwork.spec?.ipv4Cidr ?? '—'}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('IPv6 CIDR')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{virtualNetwork.spec?.ipv6Cidr ?? '—'}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Subnets')}</DescriptionListTerm>
                  <DescriptionListDescription>{subnetCount}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Security groups')}</DescriptionListTerm>
                  <DescriptionListDescription>{securityGroupCount}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          </Stack>
        </div>
        <div className="virtual-network-card__footer">
          <div className="virtual-network-card__footer-row">
            <Content component="small" className="virtual-network-card__footer-label">
              {t('Project')}
            </Content>
            {virtualNetwork.metadata?.project ? (
              <Link to={`/projects/${encodeURIComponent(virtualNetwork.metadata.project)}`}>
                {virtualNetwork.metadata.project}
              </Link>
            ) : (
              <span>{t('Default')}</span>
            )}
          </div>
          <div className="virtual-network-card__footer-row">
            <Content component="small" className="virtual-network-card__footer-label">
              {t('Created')}
            </Content>
            <Timestamp value={virtualNetwork.metadata?.creationTimestamp} />
          </div>
          <div className="virtual-network-card__footer-row">
            <Content component="small" className="virtual-network-card__footer-label">
              {t('NAT')}
            </Content>
            {natGateway ? (
              <span>
                {natGateway.metadata?.name ?? natGateway.id} ·{' '}
                <code>{natGatewayAddress ?? '—'}</code>
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default VirtualNetworkCard;
