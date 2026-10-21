import {
  Button,
  FormFieldGroup,
  FormFieldGroupHeader,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useFormikContext } from 'formik';

import type { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { NetworkAttachmentPickers } from '../../../../Form/NetworkAttachmentPickers';
import { emptyResourceSelectValue } from '../../../../Form/resourceSelectValue';

export const AdditionalNetworksArrayField = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const networks = values.spec.networking.additionalNetworks ?? [];

  const addNetwork = () => {
    void setFieldValue('spec.networking.additionalNetworks', [
      ...networks,
      {
        useDefaultNetwork: false,
        virtualNetwork: emptyResourceSelectValue(),
        subnet: emptyResourceSelectValue(),
        securityGroups: [],
        autoExternalIpAttachment: false,
      },
    ]);
  };

  const removeNetwork = (index: number) => {
    void setFieldValue(
      'spec.networking.additionalNetworks',
      networks.filter((_, networkIndex) => networkIndex !== index),
    );
  };

  return (
    <Stack hasGutter className="network-additional-networks">
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Additional networks')}
        </Title>
      </StackItem>
      {networks.map((_, index) => (
        <StackItem key={index}>
          <FormFieldGroup
            header={
              <FormFieldGroupHeader
                titleText={{
                  text: t('Network {{number}}', { number: index + 2 }),
                  id: `vm-additional-network-group-${index}`,
                }}
                actions={
                  <Button
                    variant="plain"
                    aria-label={t('Remove network')}
                    onClick={() => removeNetwork(index)}
                    icon={<MinusCircleIcon />}
                  />
                }
              />
            }
          >
            <NetworkAttachmentPickers
              fieldPrefix={`spec.networking.additionalNetworks.${index}`}
              fieldIdPrefix={`vm-additional-network-${index}`}
              useDefaultNetworkName={`spec.networking.additionalNetworks.${index}.useDefaultNetwork`}
              autoExternalIpName={`spec.networking.additionalNetworks.${index}.autoExternalIpAttachment`}
              showDefaultNetworkToggle={false}
              showExternalIp={false}
            />
          </FormFieldGroup>
        </StackItem>
      ))}
      <StackItem>
        <Button variant="link" icon={<PlusCircleIcon />} onClick={addNetwork}>
          {t('Add network')}
        </Button>
      </StackItem>
    </Stack>
  );
};
