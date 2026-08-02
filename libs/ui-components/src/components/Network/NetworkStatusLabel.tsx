import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { NetworkClassState } from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

type LabelStyle = {
  color: LabelColor;
  text: string;
};

const PENDING_STATES = new Set<number>([NetworkClassState.PENDING]);

interface NetworkStatusLabelProps {
  state?: number;
}

export const NetworkStatusLabel = ({ state }: NetworkStatusLabelProps) => {
  const { t } = useTranslation();

  const stateMap: Record<number, LabelStyle> = {
    [NetworkClassState.UNSPECIFIED]: { color: 'grey', text: t('Unknown') },
    [NetworkClassState.PENDING]: { color: 'blue', text: t('Pending') },
    [NetworkClassState.READY]: { color: 'green', text: t('Ready') },
    [NetworkClassState.FAILED]: { color: 'red', text: t('Failed') },
  };

  const style =
    state != null
      ? (stateMap[state] ?? stateMap[NetworkClassState.UNSPECIFIED])
      : stateMap[NetworkClassState.UNSPECIFIED];
  const { color, text } = style;
  const inTransition = state != null && PENDING_STATES.has(state);

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {inTransition && (
        <FlexItem>
          <Spinner size="sm" aria-label={t('{{text}} in progress', { text })} />
        </FlexItem>
      )}
      <FlexItem>
        <Label color={color} isCompact>
          {text}
        </Label>
      </FlexItem>
    </Flex>
  );
};
