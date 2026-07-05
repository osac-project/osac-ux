import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import type { ClusterWizardValues } from './fields';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: ClusterWizardValues;
  onChange: <K extends keyof ClusterWizardValues>(field: K, value: ClusterWizardValues[K]) => void;
  showValidationErrors: boolean;
}

export const ClusterGeneralStep = ({ values, onChange, showValidationErrors }: Props) => {
  const nameEmpty = showValidationErrors && values.name.trim().length === 0;
  const pullSecretEmpty = showValidationErrors && values.pullSecret.trim().length === 0;

  return (
    <OsacForm>
      <FormGroup label="Cluster name" isRequired fieldId="cluster-name">
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
                ? 'Cluster name is required.'
                : 'Lowercase letters, numbers, and hyphens. Must start with a letter.'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="Pull secret" isRequired fieldId="cluster-pull-secret">
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
                'Pull secret is required.'
              ) : (
                <>
                  Required for OCP image pulls. Obtain from{' '}
                  <a
                    href="https://console.redhat.com/openshift/downloads"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Red Hat console
                  </a>
                  .
                </>
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="SSH public key" fieldId="cluster-ssh-key">
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
            <HelperTextItem>
              Optional. Public key installed on worker nodes for SSH access.
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </OsacForm>
  );
};
