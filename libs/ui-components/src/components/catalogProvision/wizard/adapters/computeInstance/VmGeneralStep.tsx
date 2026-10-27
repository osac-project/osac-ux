import {
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import InfoAltIcon from '@patternfly/react-icons/dist/esm/icons/info-alt-icon';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import NameField from '../../fields/NameField';

import './VmGeneralStep.css';

interface VmGeneralStepProps {
  catalogItem: ComputeInstanceCatalogItem | null;
}

const generateVmName = (templateName?: string): string => {
  const prefix = (templateName || 'virtual-machine')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${prefix || 'virtual-machine'}-${crypto.randomUUID().slice(0, 8)}`;
};

const VmGeneralStep = ({ catalogItem }: VmGeneralStepProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  return (
    <OsacForm className="catalog-provision__vm-general-form pf-m-limit-width">
      <Stack hasGutter className="catalog-provision__vm-general-intro">
        <StackItem>
          <Title headingLevel="h2">{t('Details')}</Title>
        </StackItem>
        <StackItem>
          <Content component="p">
            {t('Name your virtual machine and add an optional description.')}
          </Content>
        </StackItem>
        <StackItem>
          <Card className="catalog-provision__project-alert">
            <CardBody>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <InfoAltIcon className="catalog-provision__project-alert-icon" aria-hidden />
                </FlexItem>
                <FlexItem>
                  {t('Your virtual machine will be created in project:')}{' '}
                  <strong>{values.metadata.project || t('Default project')}</strong>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
      <NameField
        generateName={() => generateVmName(catalogItem?.title || catalogItem?.metadata?.name)}
      />
      <InputField
        name="metadata.description"
        label={t('Description')}
        fieldId="metadata-description"
        multiline
        rows={4}
      />
    </OsacForm>
  );
};

export default VmGeneralStep;
