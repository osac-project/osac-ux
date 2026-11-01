import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  List,
  ListItem,
} from '@patternfly/react-core';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import AngleRightIcon from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';

import { type ClusterVersion, ClusterVersionState } from '@osac/types';

import { versionDisplayName } from './versionUtils';
import { useTranslation } from '../../../../../hooks/useTranslation';

interface ClusterVersionCardProps {
  version: ClusterVersion;
  isDisabled: boolean;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

const stateLabel = (
  state: ClusterVersionState,
  t: ReturnType<typeof useTranslation>['t'],
): string => {
  switch (state) {
    case ClusterVersionState.DEPRECATED:
      return t('Deprecated');
    case ClusterVersionState.OBSOLETE:
      return t('Obsolete');
    case ClusterVersionState.ACTIVE:
      return t('Active');
    default:
      return t('Unknown');
  }
};

const ClusterVersionCard = ({
  version,
  isDisabled,
  isSelected,
  onSelect,
}: ClusterVersionCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const name = version.metadata?.name ?? version.id;
  const title = versionDisplayName(version, name);
  const description = version.metadata?.description || t('Description not available (mock)');
  const state = version.spec?.state ?? ClusterVersionState.UNSPECIFIED;
  const isEnabled = version.spec?.enabled !== false;

  return (
    <Card
      className={`cluster-version-card${isSelected ? ' cluster-version-card--selected' : ''}`}
      isSelectable={!isDisabled}
      isSelected={isSelected}
      isDisabled={isDisabled}
      role="radio"
      aria-checked={isSelected}
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => {
        if (!isDisabled) {onSelect(name);}
      }}
      onKeyDown={(event) => {
        if (!isDisabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect(name);
        }
      }}
    >
      <CardHeader>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            <Button
              variant="plain"
              className="cluster-version-card__expand"
              aria-label={isExpanded ? t('Collapse version details') : t('Expand version details')}
              onClick={(event) => {
                event.stopPropagation();
                setIsExpanded((expanded) => !expanded);
              }}
              icon={isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
            />
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <CardTitle>{title}</CardTitle>
            <div className="cluster-version-card__subtitle">{description}</div>
          </FlexItem>
          <FlexItem>
            <Label color={state === ClusterVersionState.DEPRECATED ? 'orange' : 'green'}>
              {stateLabel(state, t)}
            </Label>
          </FlexItem>
          {isSelected ? (
            <FlexItem>
              <Label color="grey">{t('Selected')}</Label>
            </FlexItem>
          ) : null}
        </Flex>
      </CardHeader>
      {isExpanded ? (
        <CardBody>
          <List>
            <ListItem>{t('Lifecycle state: {{state}}', { state: stateLabel(state, t) })}</ListItem>
            <ListItem>
              {isEnabled ? t('Enabled for new clusters') : t('Disabled for new clusters')}
            </ListItem>
            <ListItem>
              {t('Release image and capacity statistics are not exposed by the API (mock)')}
            </ListItem>
          </List>
        </CardBody>
      ) : null}
    </Card>
  );
};

export default ClusterVersionCard;
