import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import type { ClusterWizardValues } from './fields';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: ClusterWizardValues;
  onChange: <K extends keyof ClusterWizardValues>(field: K, value: ClusterWizardValues[K]) => void;
  showValidationErrors: boolean;
}

export const ClusterGeneralStep = ({ values, onChange, showValidationErrors }: Props) => {
  const { t } = useTranslation();
  const nameEmpty = showValidationErrors && values.name.trim().length === 0;
  const pullSecretEmpty = showValidationErrors && values.pullSecret.trim().length === 0;

  return (
    <OsacForm>
      <FormGroup
        label={t('catalogProvision.cluster.fields.name')}
        isRequired
        fieldId="cluster-name"
      >
        <TextInput
          id="cluster-name"
          value={values.name}
          onChange={(_e, v) => onChange('name', v)}
          placeholder="my-ocp-cluster-01"
          isRequired
          validated={nameEmpty ? 'error' : 'default'}
          aria-describedby="cluster-name-helper"
        />
        <FormHelperText>
          <HelperText id="cluster-name-helper">
            <HelperTextItem variant={nameEmpty ? 'error' : 'default'}>
              {nameEmpty
                ? t('catalogProvision.cluster.validation.nameRequired')
                : t('catalogProvision.cluster.fields.nameHelper')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup
        label={t('catalogProvision.cluster.fields.pullSecret')}
        isRequired
        fieldId="cluster-pull-secret"
      >
        <TextArea
          id="cluster-pull-secret"
          value={values.pullSecret}
          onChange={(_e, v) => onChange('pullSecret', v)}
          placeholder='{"auths":{"cloud.openshift.com":{"auth":"..."}}}'
          rows={5}
          resizeOrientation="vertical"
          validated={pullSecretEmpty ? 'error' : 'default'}
          aria-describedby="cluster-pull-secret-helper"
        />
        <FormHelperText>
          <HelperText id="cluster-pull-secret-helper">
            <HelperTextItem variant={pullSecretEmpty ? 'error' : 'default'}>
              {pullSecretEmpty ? (
                t('catalogProvision.cluster.validation.pullSecretRequired')
              ) : (
                <>
                  {t('catalogProvision.cluster.fields.pullSecretHelper')}{' '}
                  <a
                    href="https://console.redhat.com/openshift/downloads"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('catalogProvision.cluster.fields.pullSecretHelperLink')}
                  </a>
                  .
                </>
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label={t('catalogProvision.cluster.fields.sshKey')} fieldId="cluster-ssh-key">
        <TextArea
          id="cluster-ssh-key"
          value={values.sshPublicKey}
          onChange={(_e, v) => onChange('sshPublicKey', v)}
          placeholder="ssh-rsa AAAA…"
          rows={3}
          resizeOrientation="vertical"
          aria-describedby="cluster-ssh-key-helper"
        />
        <FormHelperText>
          <HelperText id="cluster-ssh-key-helper">
            <HelperTextItem>{t('catalogProvision.cluster.fields.sshKeyHelper')}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </OsacForm>
  );
};
