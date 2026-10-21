import { Label } from '@patternfly/react-core';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { type CatalogFieldPolicyBehavior } from './catalogFieldPolicyDisplay';

interface CatalogFieldEditabilityLabelProps {
  behavior: CatalogFieldPolicyBehavior | undefined;
  showLocked?: boolean;
  showEditable?: boolean;
}

const CatalogFieldEditabilityLabel = ({
  behavior,
  showLocked = true,
  showEditable = true,
}: CatalogFieldEditabilityLabelProps) => {
  const { t } = useTranslation();

  if (!behavior) {
    return null;
  }

  if (behavior === 'editable') {
    if (!showEditable) {
      return null;
    }
    return (
      <Label color="purple" isCompact>
        {t('Editable')}
      </Label>
    );
  }

  return showLocked ? <Label isCompact>{t('Locked')}</Label> : null;
};

export default CatalogFieldEditabilityLabel;
