import {
  Content,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
} from '@patternfly/react-core';

import type { BareMetalWizardValues } from './fields';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: BareMetalWizardValues;
  onChange: <K extends keyof BareMetalWizardValues>(
    field: K,
    value: BareMetalWizardValues[K],
  ) => void;
}

export const BareMetalConfigurationStep = ({ values, onChange }: Props) => (
  <OsacForm>
    <Content component="p" className="pf-v6-u-color-text-subtle">
      Both fields are optional. Values are immutable after the instance is created.
    </Content>

    <FormGroup label="SSH public key" fieldId="bm-ssh-key">
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
          <HelperTextItem>
            OpenSSH format. Installed on the bare metal node for SSH access.
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>

    <FormGroup label="User data (cloud-init)" fieldId="bm-user-data">
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
            Optional cloud-init configuration. Maximum 64 KB. Applied on first boot.
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  </OsacForm>
);
