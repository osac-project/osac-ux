import {
  Content,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
  TextArea,
} from '@patternfly/react-core';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import type { BareMetalWizardValues } from './fields';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { readCatalogFieldDefinitions } from '../catalogOverlay';
import { DynamicFieldsFormSection } from '../DynamicFieldsFormSection';

interface Props {
  values: BareMetalWizardValues;
  onChange: <K extends keyof BareMetalWizardValues>(
    field: K,
    value: BareMetalWizardValues[K],
  ) => void;
  catalogItem: BareMetalInstanceCatalogItem | null;
}

export const BareMetalConfigurationStep = ({ values, onChange, catalogItem }: Props) => {
  const { t } = useTranslation();
  const definitions = readCatalogFieldDefinitions(catalogItem);

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <Content component="p" className="pf-v6-u-color-text-subtle">
            {t('catalogProvision.baremetal.configuration.optionalNotice')}
          </Content>

          <FormGroup label={t('catalogProvision.baremetal.fields.sshKey')} fieldId="bm-ssh-key">
            <TextArea
              id="bm-ssh-key"
              value={values.sshPublicKey}
              onChange={(_e, v) => onChange('sshPublicKey', v)}
              placeholder="ssh-rsa AAAA…"
              rows={3}
              resizeOrientation="vertical"
              aria-describedby="bm-ssh-key-helper"
            />
            <FormHelperText>
              <HelperText id="bm-ssh-key-helper">
                <HelperTextItem>{t('catalogProvision.baremetal.fields.sshKeyHelper')}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('catalogProvision.baremetal.fields.userData')} fieldId="bm-user-data">
            <TextArea
              id="bm-user-data"
              value={values.userData}
              onChange={(_e, v) => onChange('userData', v)}
              placeholder="#cloud-config&#10;runcmd:&#10;  - echo hello"
              rows={6}
              resizeOrientation="vertical"
              aria-describedby="bm-user-data-helper"
            />
            <FormHelperText>
              <HelperText id="bm-user-data-helper">
                <HelperTextItem>
                  {t('catalogProvision.baremetal.fields.userDataHelper')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </OsacForm>
      </StackItem>

      <StackItem>
        <DynamicFieldsFormSection
          definitions={definitions}
          values={values.dynamicParameters}
          onChange={(path, v) => onChange('dynamicParameters', { ...values.dynamicParameters, [path]: v })}
        />
      </StackItem>
    </Stack>
  );
};
