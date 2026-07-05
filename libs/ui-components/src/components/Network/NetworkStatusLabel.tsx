import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { NetworkClassState } from '@osac/types';

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

type LabelStyle = {
  color: LabelColor;
  text: string;
};

const STATE_MAP: Record<number, LabelStyle> = {
  [NetworkClassState.UNSPECIFIED]: { color: 'grey', text: 'Unknown' },
  [NetworkClassState.PENDING]: { color: 'blue', text: 'Pending' },
  [NetworkClassState.READY]: { color: 'green', text: 'Ready' },
  [NetworkClassState.FAILED]: { color: 'red', text: 'Failed' },
};

const PENDING_STATES = new Set<number>([NetworkClassState.PENDING]);

interface NetworkStatusLabelProps {
  state?: number;
}

export const NetworkStatusLabel = ({ state }: NetworkStatusLabelProps) => {
  const style =
    state != null
      ? (STATE_MAP[state] ?? STATE_MAP[NetworkClassState.UNSPECIFIED])
      : STATE_MAP[NetworkClassState.UNSPECIFIED];
  const { color, text } = style;
  const inTransition = state != null && PENDING_STATES.has(state);

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {inTransition && (
        <FlexItem>
          <Spinner size="sm" aria-label={`${text} in progress`} />
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
