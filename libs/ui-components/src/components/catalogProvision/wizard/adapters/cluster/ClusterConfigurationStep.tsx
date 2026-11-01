import { FormSection, Stack, StackItem } from '@patternfly/react-core';

import { type ClusterCatalogItem } from '@osac/types';

import ClusterNodeSetsArrayField from './ClusterNodeSetsArrayField';
import { useTranslation } from '../../../../../hooks/useTranslation';
import OsacForm from '../../../../Form/OsacForm';

interface Props {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  if (!catalogItem) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          <FormSection title={t('Node Sets')} titleElement="h2">
            <ClusterNodeSetsArrayField />
          </FormSection>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default ClusterConfigurationStep;
