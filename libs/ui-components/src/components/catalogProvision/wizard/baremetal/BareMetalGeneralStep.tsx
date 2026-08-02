import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import {
  BM_RUN_STRATEGY_ALWAYS,
  BM_RUN_STRATEGY_HALTED,
  type BareMetalWizardValues,
} from './fields';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: BareMetalWizardValues;
  onChange: <K extends keyof BareMetalWizardValues>(
    field: K,
    value: BareMetalWizardValues[K],
  ) => void;
  showValidationErrors: boolean;
}

export const BareMetalGeneralStep = ({ values, onChange, showValidationErrors }: Props) => {
  const { t } = useTranslation();
  const nameEmpty = showValidationErrors && values.name.trim().length === 0;

  return (
    <OsacForm>
      <FormGroup label={t('catalogProvision.baremetal.fields.name')} isRequired fieldId="bm-name">
        <TextInput
          id="bm-name"
          value={values.name}
          onChange={(_e, v) => onChange('name', v)}
          placeholder="my-bare-metal-01"
          isRequired
          validated={nameEmpty ? 'error' : 'default'}
          aria-describedby="bm-name-helper"
        />
        <FormHelperText>
          <HelperText id="bm-name-helper">
            <HelperTextItem variant={nameEmpty ? 'error' : 'default'}>
              {nameEmpty
                ? t('catalogProvision.baremetal.validation.nameRequired')
                : t('catalogProvision.baremetal.fields.nameHelper')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup
        label={t('catalogProvision.baremetal.fields.runStrategy')}
        fieldId="bm-run-strategy"
      >
        <ToggleGroup aria-label={t('catalogProvision.baremetal.fields.runStrategy')}>
          <ToggleGroupItem
            text={t('catalogProvision.baremetal.runStrategy.always')}
            buttonId="bm-run-strategy-always"
            isSelected={values.runStrategy === BM_RUN_STRATEGY_ALWAYS}
            onChange={() => onChange('runStrategy', BM_RUN_STRATEGY_ALWAYS)}
          />
          <ToggleGroupItem
            text={t('catalogProvision.baremetal.runStrategy.halted')}
            buttonId="bm-run-strategy-halted"
            isSelected={values.runStrategy === BM_RUN_STRATEGY_HALTED}
            onChange={() => onChange('runStrategy', BM_RUN_STRATEGY_HALTED)}
          />
        </ToggleGroup>
        <FormHelperText>
          <HelperText id="bm-run-strategy-helper">
            <HelperTextItem>
              {t('catalogProvision.baremetal.fields.runStrategyHelper')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </OsacForm>
  );
};
