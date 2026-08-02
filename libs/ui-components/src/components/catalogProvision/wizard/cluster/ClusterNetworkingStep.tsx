import {
  Content,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';

import type { ClusterTemplate } from '@osac/types';

import { type ClusterWizardValues, DEFAULT_POD_CIDR, DEFAULT_SERVICE_CIDR } from './fields';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';

interface Props {
  values: ClusterWizardValues;
  onChange: <K extends keyof ClusterWizardValues>(field: K, value: ClusterWizardValues[K]) => void;
  template: ClusterTemplate | undefined;
}

export const ClusterNetworkingStep = ({ values, onChange, template }: Props) => {
  const { t } = useTranslation();
  const podCidrDefault = template?.specDefaults?.network?.podCidr || DEFAULT_POD_CIDR;
  const serviceCidrDefault = template?.specDefaults?.network?.serviceCidr || DEFAULT_SERVICE_CIDR;

  return (
    <OsacForm>
      <Content component="p" className="pf-v6-u-color-text-subtle">
        {t('catalogProvision.cluster.networking.description')}
      </Content>

      <FormGroup label={t('catalogProvision.cluster.fields.podCidr')} fieldId="cluster-pod-cidr">
        <TextInput
          id="cluster-pod-cidr"
          value={values.podCidr}
          onChange={(_e, v) => onChange('podCidr', v)}
          placeholder={podCidrDefault}
          aria-describedby="cluster-pod-cidr-helper"
        />
        <FormHelperText>
          <HelperText id="cluster-pod-cidr-helper">
            <HelperTextItem>
              {t('catalogProvision.cluster.fields.podCidrHelper')} <code>{podCidrDefault}</code>
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup
        label={t('catalogProvision.cluster.fields.serviceCidr')}
        fieldId="cluster-service-cidr"
      >
        <TextInput
          id="cluster-service-cidr"
          value={values.serviceCidr}
          onChange={(_e, v) => onChange('serviceCidr', v)}
          placeholder={serviceCidrDefault}
          aria-describedby="cluster-service-cidr-helper"
        />
        <FormHelperText>
          <HelperText id="cluster-service-cidr-helper">
            <HelperTextItem>
              {t('catalogProvision.cluster.fields.serviceCidrHelper')}{' '}
              <code>{serviceCidrDefault}</code>
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </OsacForm>
  );
};
