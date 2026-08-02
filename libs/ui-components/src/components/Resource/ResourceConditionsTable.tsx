import { Content } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type {
  BareMetalInstanceCondition,
  ClusterCondition,
  ComputeInstanceCondition,
} from '@osac/types';

import { useTranslation } from '../../hooks/useTranslation';
import {
  type ConditionResourceKind,
  displayValue,
  formatConditionStatusForDisplay,
  humanizeConditionType,
} from '../../utils/detailFormatters';
import { Timestamp } from '../Primitives/Timestamp';

type AnyCondition = ClusterCondition | ComputeInstanceCondition | BareMetalInstanceCondition;

interface ResourceConditionsTableProps {
  conditions: AnyCondition[];
  ariaLabel: string;
  conditionResourceKind: ConditionResourceKind;
  emptyMessage?: string;
}

export const ResourceConditionsTable = ({
  conditions,
  ariaLabel,
  conditionResourceKind,
  emptyMessage,
}: ResourceConditionsTableProps) => {
  const { t } = useTranslation();

  if (conditions.length === 0) {
    return <Content component="p">{emptyMessage ?? t('No conditions reported.')}</Content>;
  }

  return (
    <Table aria-label={ariaLabel} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Type')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Reason')}</Th>
          <Th>{t('Message')}</Th>
          <Th>{t('Last transition')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {conditions.map((c, idx) => (
          <Tr key={`${c.type}-${idx}`}>
            <Td dataLabel={t('Type')}>{humanizeConditionType(c.type, conditionResourceKind)}</Td>
            <Td dataLabel={t('Status')}>{formatConditionStatusForDisplay(c.status)}</Td>
            <Td dataLabel={t('Reason')}>{displayValue(c.reason)}</Td>
            <Td dataLabel={t('Message')}>{displayValue(c.message)}</Td>
            <Td dataLabel={t('Last transition')}>
              <Timestamp value={c.lastTransitionTime} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
