import { Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { ComputeInstanceCatalogItem } from '@osac/types';

import {
  ComputeInstanceWizardValues,
  VM_USER_DATA_FORM_PATH,
  VM_USER_DATA_SECRET_FORM_PATH,
  VM_USER_DATA_SOURCE_FORM_PATH,
} from './fields';
import OsacForm from '../../../../Form/OsacForm';
import UserDataField from '../../fields/UserDataField';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <UserDataField
            sourceName={VM_USER_DATA_SOURCE_FORM_PATH}
            secretRefName={VM_USER_DATA_SECRET_FORM_PATH}
            currentSource={values.spec.userDataSource}
            inlineName={VM_USER_DATA_FORM_PATH}
            projectName={values.metadata.project}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
