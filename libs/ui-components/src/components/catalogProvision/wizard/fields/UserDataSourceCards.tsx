import type { KeyboardEvent } from 'react';
import { Card, CardBody, Label, Stack, StackItem } from '@patternfly/react-core';
import KeyIcon from '@patternfly/react-icons/dist/esm/icons/key-icon';
import KeyboardIcon from '@patternfly/react-icons/dist/esm/icons/keyboard-icon';
import { useField } from 'formik';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import './UserDataSourceCards.css';

interface UserDataSourceCardsProps {
  name: string;
  currentSource: 'secret' | 'inline';
  isDisabled?: boolean;
}

const UserDataSourceCards = ({
  name,
  currentSource,
  isDisabled = false,
}: UserDataSourceCardsProps) => {
  const { t } = useTranslation();
  const [, , helpers] = useField<'secret' | 'inline'>(name);

  const selectSource = (source: 'secret' | 'inline') => {
    if (!isDisabled) {
      void helpers.setValue(source);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, source: 'secret' | 'inline') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectSource(source);
    }
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <strong>{t('Cloud-init')}</strong>
        <div>{t('Optional user data applied when the virtual machine starts.')}</div>
      </StackItem>
      <StackItem>
        <div className="user-data-source-cards" role="radiogroup" aria-label={t('Cloud-init')}>
          <Card
            className={`user-data-source-card${currentSource === 'inline' ? ' user-data-source-card--selected' : ''}`}
            isSelected={currentSource === 'inline'}
            role="radio"
            aria-checked={currentSource === 'inline'}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => selectSource('inline')}
            onKeyDown={(event) => handleKeyDown(event, 'inline')}
          >
            <CardBody>
              <Stack>
                <StackItem className="user-data-source-card__icon">
                  <KeyboardIcon aria-hidden />
                </StackItem>
                <StackItem className="user-data-source-card__title">
                  {t('Enter value')}
                  {currentSource === 'inline' ? <Label color="grey">{t('Selected')}</Label> : null}
                </StackItem>
                <StackItem className="user-data-source-card__description">
                  {t('Paste cloud-init user data')}
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
          <Card
            className={`user-data-source-card${currentSource === 'secret' ? ' user-data-source-card--selected' : ''}`}
            isSelected={currentSource === 'secret'}
            role="radio"
            aria-checked={currentSource === 'secret'}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => selectSource('secret')}
            onKeyDown={(event) => handleKeyDown(event, 'secret')}
          >
            <CardBody>
              <Stack>
                <StackItem className="user-data-source-card__icon">
                  <KeyIcon aria-hidden />
                </StackItem>
                <StackItem className="user-data-source-card__title">
                  {t('Select secret')}
                  {currentSource === 'secret' ? <Label color="grey">{t('Selected')}</Label> : null}
                </StackItem>
                <StackItem className="user-data-source-card__description">
                  {t('Use a USER_DATA secret from this project')}
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </div>
      </StackItem>
    </Stack>
  );
};

export default UserDataSourceCards;
