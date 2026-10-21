import type { KeyboardEvent } from 'react';
import { Card, CardBody, Label, Stack, StackItem } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

import './NetworkSelectionCards.css';

interface NetworkSelectionCardsProps {
  selected: boolean;
  onSelect: (useDefaultNetwork: boolean) => void;
}

const NetworkSelectionCards = ({ selected, onSelect }: NetworkSelectionCardsProps) => {
  const { t } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, value: boolean) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(value);
    }
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <strong>
          {t('Network')} <span className="pf-v6-c-form__label-required">*</span>
        </strong>
        <div
          className="network-selection-cards"
          role="radiogroup"
          aria-label={t('Network')}
          aria-required="true"
        >
          <Card
            className={`network-selection-card${selected ? ' network-selection-card--selected' : ''}`}
            isSelected={selected}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={() => onSelect(true)}
            onKeyDown={(event) => handleKeyDown(event, true)}
          >
            <CardBody>
              <Stack>
                <StackItem className="network-selection-card__title">
                  <span>{t('Tenant default')}</span>
                  {selected ? <Label color="grey">{t('Selected')}</Label> : null}
                </StackItem>
                <StackItem className="network-selection-card__description">
                  {t('Network created with your tenant.')}
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
          <Card
            className={`network-selection-card${!selected ? ' network-selection-card--selected' : ''}`}
            isSelected={!selected}
            role="radio"
            aria-checked={!selected}
            tabIndex={0}
            onClick={() => onSelect(false)}
            onKeyDown={(event) => handleKeyDown(event, false)}
          >
            <CardBody>
              <Stack>
                <StackItem className="network-selection-card__title">
                  <span>{t('Custom network')}</span>
                  {!selected ? <Label color="grey">{t('Selected')}</Label> : null}
                </StackItem>
                <StackItem className="network-selection-card__description">
                  {t('Choose a virtual network, subnet, and security group.')}
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </div>
      </StackItem>
    </Stack>
  );
};

export default NetworkSelectionCards;
