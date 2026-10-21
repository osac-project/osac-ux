import { Content, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { AdditionalNetworksArrayField } from './AdditionalNetworksArrayField';
import type { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { NetworkAttachmentPickers } from '../../../../Form/NetworkAttachmentPickers';
import OsacForm from '../../../../Form/OsacForm';

import './VmNetworkingStep.css';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmNetworkingStep = (_props: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="3xl" className="vm-networking-step__title">
          {t('Networking')}
        </Title>
        <Content component="p" className="vm-networking-step__description">
          {t('Choose a network and whether to auto-attach an external IP.')}
        </Content>
        <OsacForm>
          <NetworkAttachmentPickers
            fieldPrefix="spec.networking"
            fieldIdPrefix="vm"
            useDefaultNetworkName="spec.networking.useDefaultNetwork"
            autoExternalIpName="spec.networking.autoExternalIpAttachment"
            useNetworkSelectionCards
            autoExternalIpHelperText={t(
              'Automatically provision an external IP for this virtual machine.',
            )}
          >
            {!values.spec.networking.useDefaultNetwork ? <AdditionalNetworksArrayField /> : null}
          </NetworkAttachmentPickers>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
