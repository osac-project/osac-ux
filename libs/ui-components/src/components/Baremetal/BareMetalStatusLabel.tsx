import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';

import { BareMetalInstanceState } from '@osac/types';

type LabelColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

interface LabelStyle {
  color: LabelColor;
  text: string;
}

const STATE_MAP: Record<BareMetalInstanceState, LabelStyle> = {
  [BareMetalInstanceState.UNSPECIFIED]: { color: 'grey', text: 'Unknown' },
  [BareMetalInstanceState.PROVISIONING]: { color: 'blue', text: 'Provisioning' },
  [BareMetalInstanceState.RUNNING]: { color: 'green', text: 'Running' },
  [BareMetalInstanceState.FAILED]: { color: 'red', text: 'Failed' },
  [BareMetalInstanceState.DELETING]: { color: 'red', text: 'Deleting' },
  [BareMetalInstanceState.STARTING]: { color: 'blue', text: 'Starting' },
  [BareMetalInstanceState.STOPPING]: { color: 'orange', text: 'Stopping' },
  [BareMetalInstanceState.STOPPED]: { color: 'orange', text: 'Stopped' },
};

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
  const fallback = STATE_MAP[BareMetalInstanceState.UNSPECIFIED];
  const style = state != null ? (STATE_MAP[state] ?? fallback) : fallback;
  const inTransition = state != null && TRANSITION_STATES.has(state);

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      {inTransition && (
        <FlexItem>
          <Spinner size="sm" aria-label={`${style.text} in progress`} />
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
