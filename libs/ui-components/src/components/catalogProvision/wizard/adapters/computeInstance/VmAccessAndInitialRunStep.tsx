import { Content, Divider, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { type ComputeInstanceCatalogItem, Secret, SecretType } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import SecretSelectionField from '@osac/ui-components/components/Form/SecretSelectionField';

import type { ComputeInstanceWizardValues } from './fields';
import {
  VM_SSH_KEY_FORM_PATH,
  VM_USER_DATA_FORM_PATH,
  VM_USER_DATA_SECRET_FORM_PATH,
  VM_USER_DATA_SOURCE_FORM_PATH,
} from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import OsacForm from '../../../../Form/OsacForm';
import UserDataField from '../../fields/UserDataField';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmAccessAndInitialRunStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();
  const isSshKeyLocked = catalogItem?.fields?.sshKey?.behavior.case === 'locked';

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="3xl">
          {t('Access & Initial Run')}
        </Title>
        <Content component="p">
          {t('Configure SSH access and commands to run when the virtual machine starts.')}
        </Content>
      </StackItem>
      <StackItem>
        <OsacForm>
          <SecretSelectionField
            filter={cel<Secret>((filter) =>
              filter.and(
                filter.field('metadata.project').equals(values.metadata.project),
                filter.field('type').equals(SecretType.SSH_PUBLIC_KEY),
              ),
            )}
            label={t('SSH public key')}
            name={VM_SSH_KEY_FORM_PATH}
            isDisabled={isSshKeyLocked}
          />
          <Divider />
          <UserDataField
            sourceName={VM_USER_DATA_SOURCE_FORM_PATH}
            secretRefName={VM_USER_DATA_SECRET_FORM_PATH}
            currentSource={values.spec.userDataSource}
            inlineName={VM_USER_DATA_FORM_PATH}
            projectName={values.metadata.project}
            useCards
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
