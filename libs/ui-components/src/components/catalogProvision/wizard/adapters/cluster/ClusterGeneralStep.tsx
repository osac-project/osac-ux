import { FormGroup } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { type ClusterCatalogItem, type Secret, Secrets, SecretType } from '@osac/types';
import { getSecretType } from '@osac/ui-components/components/Secret/utils';
import { cel } from '@osac/ui-components/api/cel';
import { ResourceSelectField } from '@osac/ui-components/components/Form/ResourceSelectField';
import SecretSelectionField from '@osac/ui-components/components/Form/SecretSelectionField';
import { ProjectSelect } from '@osac/ui-components/components/Page/ProjectFilter';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton';

import ClusterCatalogSummary from './ClusterCatalogSummary';
import {
  CLUSTER_SSH_KEY_FORM_PATH,
  CLUSTER_SSH_KEY_WIRE_PATH,
  ClusterWizardValues,
} from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import NameField from '../../fields/NameField';
import {
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

interface ClusterGeneralStepProps {
  catalogItem: ClusterCatalogItem | null;
}

const generateClusterName = (): string => {
  const n = String(Math.floor(Math.random() * 90) + 10);
  return `cluster-${n}`;
};


const ClusterGeneralStep = ({ catalogItem }: ClusterGeneralStepProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ClusterWizardValues>();

  const sshKeyOverlay = getCatalogFieldOverlay(
    CLUSTER_SSH_KEY_WIRE_PATH,
    readCatalogFieldDefinitions(catalogItem),
    t('SSH public key'),
  );

  return (
    <>
      {catalogItem ? <ClusterCatalogSummary catalogItem={catalogItem} /> : null}
      <OsacForm>
        <FormGroup label={t('Project')} fieldId="metadata-project" isRequired>
          <ProjectSelect
            value={values.metadata.project}
            onChange={(project) => {
              void setFieldValue('metadata.project', project);
              void setFieldValue('spec.pullSecretSecret.name', '');
            }}
            aria-label={t('Select project')}
          />
        </FormGroup>
        <NameField generateName={generateClusterName} />
        <InputField
          name="metadata.description"
          label={t('Description')}
          fieldId="metadata-description"
          multiline
          rows={3}
        />
        <ResourceSelectField
          name={CLUSTER_SSH_KEY_FORM_PATH}
          label={t('SSH public key')}
          fieldId="cluster-ssh-public-key"
          service={Secrets}
          request={{
            filter: cel<Secret>((filter) =>
              filter.and(
                filter.field('metadata.project').equals(values.metadata.project),
                filter.field('type').equals(SecretType.SSH_PUBLIC_KEY),
              ),
            ),
          }}
          isDisabled={!sshKeyOverlay.editable}
          isSearchable
          searchPlaceholder={t('Search SSH public keys')}
          placeholder={t('Select an SSH public key')}
          loadingPlaceholder={t('Loading...')}
          loadErrorTitle={t('Failed to fetch secrets')}
          emptyTitle={t('No SSH public keys available')}
          emptyDescription={t('Create an SSH public key secret to use it for cluster access.')}
          itemDescription={(item) => getSecretType(t)[item.type as SecretType]}
          menuFooter={
            <CreateButton variant="link" isInline to="/secrets/create">
              {t('Create secret')}
            </CreateButton>
          }
        />
        <SecretSelectionField
          filter={cel<Secret>((filter) =>
            filter.and(
              filter.field('metadata.project').equals(values.metadata.project),
              filter.field('type').equals(SecretType.PULL_SECRET),
            ),
          )}
          label={t('Pull secret')}
          name="spec.pullSecretSecret.name"
          isRequired
        />
      </OsacForm>
    </>
  );
};

export default ClusterGeneralStep;
