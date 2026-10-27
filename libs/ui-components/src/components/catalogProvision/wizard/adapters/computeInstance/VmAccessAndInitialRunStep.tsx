import { Content, Divider, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { SecretType, Secrets } from '@osac/types';
import type { ComputeInstanceCatalogItem, Secret } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { ResourceSelectField } from '@osac/ui-components/components/Form/ResourceSelectField';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton';
import { getSecretType } from '@osac/ui-components/components/Secret/utils';

import type { ComputeInstanceWizardValues } from './fields';
import {
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
          <ResourceSelectField
            name="spec.sshKey"
            label={t('SSH public key')}
            fieldId="vm-ssh-public-key"
            service={Secrets}
            request={{
              filter: cel<Secret>((filter) =>
                filter.and(
                  filter.field('metadata.project').equals(values.metadata.project),
                  filter.field('type').equals(SecretType.SSH_PUBLIC_KEY),
                ),
              ),
            }}
            isDisabled={isSshKeyLocked}
            isSearchable
            searchPlaceholder={t('Search SSH public keys')}
            placeholder={t('Select an SSH public key')}
            loadingPlaceholder={t('Loading...')}
            loadErrorTitle={t('Failed to fetch secrets')}
            emptyTitle={t('No SSH public keys available')}
            emptyDescription={t('Create an SSH public key secret to use it for VM access.')}
            itemDescription={(item) => getSecretType(t)[item.type as SecretType]}
            menuFooter={
              <CreateButton variant="link" isInline to="/secrets/create">
                {t('Create secret')}
              </CreateButton>
            }
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
