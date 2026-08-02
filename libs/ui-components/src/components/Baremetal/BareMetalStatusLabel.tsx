import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { BareMetalInstanceState } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

interface LabelStyle {
  color: LabelColor;
  text: string;
}

const TRANSITION_STATES = new Set<BareMetalInstanceState>([
  BareMetalInstanceState.PROVISIONING,
  BareMetalInstanceState.STARTING,
  BareMetalInstanceState.STOPPING,
  BareMetalInstanceState.DELETING,
]);

interface BareMetalStatusLabelProps {
  state?: BareMetalInstanceState;
}

export const BareMetalStatusLabel = ({ state }: BareMetalStatusLabelProps) => {
  const { t } = useTranslation();

  const stateMap: Record<BareMetalInstanceState, LabelStyle> = {
    [BareMetalInstanceState.UNSPECIFIED]: { color: 'grey', text: t('Unknown') },
    [BareMetalInstanceState.PROVISIONING]: { color: 'blue', text: t('Provisioning') },
    [BareMetalInstanceState.RUNNING]: { color: 'green', text: t('Running') },
    [BareMetalInstanceState.FAILED]: { color: 'red', text: t('Failed') },
    [BareMetalInstanceState.DELETING]: { color: 'red', text: t('Deleting') },
    [BareMetalInstanceState.STARTING]: { color: 'blue', text: t('Starting') },
    [BareMetalInstanceState.STOPPING]: { color: 'orange', text: t('Stopping') },
    [BareMetalInstanceState.STOPPED]: { color: 'orange', text: t('Stopped') },
  };

  const fallback = stateMap[BareMetalInstanceState.UNSPECIFIED];
  const style = state != null ? (stateMap[state] ?? fallback) : fallback;
  const inTransition = state != null && TRANSITION_STATES.has(state);

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {inTransition && (
        <FlexItem>
          <Spinner size="sm" aria-label={t('{{text}} in progress', { text: style.text })} />
        </FlexItem>
      )}
      <FlexItem>
        <Label color={style.color} isCompact>
          {style.text}
        </Label>
      </FlexItem>
    </Flex>
  );
};
