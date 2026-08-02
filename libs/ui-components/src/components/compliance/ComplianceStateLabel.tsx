import { Label, List, ListItem, Popover } from '@patternfly/react-core';

import type { ComplianceResult } from '../../api/v1/compliance';
import { useTranslation } from '../../hooks/useTranslation';

const STATE_CONFIG: Record<
  ComplianceResult['state'],
  { label: string; color: 'green' | 'orange' | 'red' | 'grey' }
> = {
  compliant: { label: 'Compliant', color: 'green' },
  partial: { label: 'Partial', color: 'orange' },
  noncompliant: { label: 'Non-compliant', color: 'red' },
  'not-scanned': { label: 'Not scanned', color: 'grey' },
};

interface ComplianceStateLabelProps {
  result: ComplianceResult;
}

/** Compact state label for live compliance-scan results (ACM/OpenSCAP STIG/CIS). Click to see failing rules. */
export const ComplianceStateLabel = ({ result }: ComplianceStateLabelProps) => {
  const { t } = useTranslation();
  const cfg = STATE_CONFIG[result.state];
  const badge = (
    <Label
      isCompact
      color={cfg.color}
      style={{ cursor: result.failingRules.length ? 'pointer' : 'default' }}
    >
      {t(cfg.label)}
    </Label>
  );

  if (result.failingRules.length === 0) {
    return badge;
  }

  return (
    <Popover
      headerContent={t('{{profile}} — failing controls', { profile: result.profile })}
      bodyContent={
        <List>
          {result.failingRules.map((rule) => (
            <ListItem key={rule}>{rule}</ListItem>
          ))}
        </List>
      }
    >
      <span>{badge}</span>
    </Popover>
  );
};
