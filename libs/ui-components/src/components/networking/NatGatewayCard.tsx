import { useState } from 'react';
import {
  Bullseye,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import { type NATGateway, NATGatewayState } from '@osac/types';
import DeleteResourceButton from '@osac/ui-components/components/Resource/DeleteResourceButton';

import { NatGatewayStatusLabel } from './NatGatewayStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { Timestamp } from '../Primitives/Timestamp';
import QueryErrorState from '../Resource/QueryErrorState';

import '../shared/details-page.css';

export interface NatGatewayCardProps {
  natAddress?: string;
  natGateway?: NATGateway;
  isLoading?: boolean;
  error?: unknown;
  onAttach: () => void;
  onDetach: (natGateway: NATGateway) => void;
}

const NatGatewayCard = ({
  natAddress,
  natGateway,
  isLoading = false,
  error,
  onAttach,
  onDetach,
}: NatGatewayCardProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDeleting = natGateway?.status?.state === NATGatewayState.NAT_GATEWAY_STATE_DELETING;

  return (
    <div className="details-page__sidebar">
      <Flex
        className="details-page__sidebar-header"
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <FlexItem>
          <Title headingLevel="h2" size="md" className="details-page__sidebar-title">
            {t('NAT gateway attachment')}
          </Title>
        </FlexItem>
        <FlexItem>
          {natGateway ? (
            <Dropdown
              isOpen={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  variant="plain"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  isExpanded={isMenuOpen}
                  aria-label={t('Actions for NAT gateway attachment')}
                >
                  <EllipsisVIcon />
                </MenuToggle>
              )}
              popperProps={{ position: 'right' }}
            >
              <DropdownList>
                <DeleteResourceButton
                  isDropdown
                  canDelete={!isDeleting}
                  onClick={() => {
                    onDetach(natGateway);
                    setIsMenuOpen(false);
                  }}
                />
              </DropdownList>
            </Dropdown>
          ) : !isLoading && !error ? (
            <Button
              variant="link"
              isInline
              icon={<PlusCircleIcon />}
              className="details-page__sidebar-action"
              onClick={onAttach}
            >
              {t('Create')}
            </Button>
          ) : null}
        </FlexItem>
      </Flex>

      {isLoading ? (
        <Bullseye>
          <Spinner aria-label={t('Loading NAT gateway')} />
        </Bullseye>
      ) : error ? (
        <QueryErrorState error={error} title={t('Failed to load NAT gateway')} />
      ) : natGateway ? (
        <DescriptionList isCompact aria-label={t('Attached NAT gateway')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              <NatGatewayStatusLabel state={natGateway.status?.state} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(natGateway.metadata?.name ?? natGateway.id)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('External IP')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{displayValue(natAddress)}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Attached')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={natGateway.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      ) : (
        <Content component="p" className="details-page__sidebar-description">
          {t('No NAT gateway associated with this virtual network.')}
        </Content>
      )}
    </div>
  );
};

export default NatGatewayCard;
