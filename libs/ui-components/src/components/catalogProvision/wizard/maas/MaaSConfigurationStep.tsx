import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  NumberInput,
  TextInput,
} from '@patternfly/react-core';

import { MAX_TOKEN_QUOTA, MIN_TOKEN_QUOTA, type MaaSWizardValues } from './fields';
import type { ModelCatalogItem } from '../../../../api/v1/maas-types';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: MaaSWizardValues;
  onChange: <K extends keyof MaaSWizardValues>(field: K, value: MaaSWizardValues[K]) => void;
  catalogItem: ModelCatalogItem | null;
  showValidationErrors: boolean;
}

export const MaaSConfigurationStep = ({
  values,
  onChange,
  catalogItem,
  showValidationErrors,
}: Props) => {
  const { t } = useTranslation();
  const nameEmpty = showValidationErrors && values.applicationName.trim().length === 0;
  const quotaFieldDef = catalogItem?.field_definitions?.find(
    (f) => f.path === 'token_quota_monthly',
  );
  const showQuota = quotaFieldDef?.editable !== false;

  return (
    <OsacForm>
      <FormGroup
        label={t('catalogProvision.maas.fields.applicationName')}
        isRequired
        fieldId="maas-app-name"
      >
        <TextInput
          id="maas-app-name"
          value={values.applicationName}
          onChange={(_e, v) => onChange('applicationName', v)}
          placeholder="my-rag-pipeline"
          isRequired
          validated={nameEmpty ? 'error' : 'default'}
          aria-describedby="maas-app-name-helper"
        />
        <FormHelperText>
          <HelperText id="maas-app-name-helper">
            <HelperTextItem variant={nameEmpty ? 'error' : 'default'}>
              {nameEmpty
                ? t('catalogProvision.maas.validation.applicationNameRequired')
                : t('catalogProvision.maas.fields.applicationNameHelper')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      {showQuota && (
        <FormGroup label={t('catalogProvision.maas.fields.tokenQuota')} fieldId="maas-quota">
          <NumberInput
            id="maas-quota"
            value={values.tokenQuotaMonthly}
            onMinus={() =>
              onChange(
                'tokenQuotaMonthly',
                Math.max(MIN_TOKEN_QUOTA, values.tokenQuotaMonthly - 100_000),
              )
            }
            onPlus={() =>
              onChange(
                'tokenQuotaMonthly',
                Math.min(MAX_TOKEN_QUOTA, values.tokenQuotaMonthly + 100_000),
              )
            }
            onChange={(e) => {
              const v = parseInt((e.target as HTMLInputElement).value, 10);
              if (!isNaN(v)) {
                onChange(
                  'tokenQuotaMonthly',
                  Math.min(MAX_TOKEN_QUOTA, Math.max(MIN_TOKEN_QUOTA, v)),
                );
              }
            }}
            min={MIN_TOKEN_QUOTA}
            max={MAX_TOKEN_QUOTA}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t('catalogProvision.maas.fields.tokenQuotaHelper', {
                  min: MIN_TOKEN_QUOTA.toLocaleString(),
                  max: MAX_TOKEN_QUOTA.toLocaleString(),
                })}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      )}
    </OsacForm>
  );
};
