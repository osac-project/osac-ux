import { Alert, Bullseye, Button, Spinner, Stack, StackItem } from '@patternfly/react-core';
import { useField } from 'formik';

import type { ClusterCatalogItem } from '@osac/types';

import ClusterVersionCard from './ClusterVersionCard';
import { CLUSTER_VERSION_WIRE_PATH } from './fields';
import {
  CLUSTER_VERSION_ACTIVE_LIST_FILTER,
  useClusterVersions,
} from '../../../../../api/v1/cluster-versions';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { getErrorMessage } from '../../../../../utils/error';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

import './ClusterVersionStep.css';

interface ClusterVersionStepProps {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterVersionStep = ({ catalogItem }: ClusterVersionStepProps) => {
  const { t } = useTranslation();
  const [versionField, , versionHelpers] = useField<string>('spec.versionName');
  const {
    data: versions = [],
    isLoading,
    error,
    refetch,
  } = useClusterVersions({
    filter: CLUSTER_VERSION_ACTIVE_LIST_FILTER,
  });
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const versionOverlay = getCatalogFieldOverlay(
    CLUSTER_VERSION_WIRE_PATH,
    definitions,
    t('Cluster version'),
  );

  if (!catalogItem) {return null;}
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner aria-label={t('Loading cluster versions')} />
      </Bullseye>
    );
  }

  return (
    <Stack hasGutter className="cluster-version-step">
      <StackItem>
        <h2>{t('Cluster version')}</h2>
        <p className="cluster-version-step__description">
          {versionOverlay.editable
            ? t('Choose the OpenShift version for this cluster.')
            : t('Locked by the catalog item.')}
        </p>
      </StackItem>
      {error ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('Could not load cluster versions')}>
            {getErrorMessage(error)}{' '}
            <Button variant="link" isInline onClick={() => void refetch()}>
              {t('Retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      <StackItem>
        <Stack hasGutter role="radiogroup" aria-label={t('Cluster versions')}>
          {versions.map((version) => (
            <StackItem key={version.id}>
              <ClusterVersionCard
                version={version}
                isDisabled={!versionOverlay.editable}
                isSelected={versionField.value === (version.metadata?.name ?? version.id)}
                onSelect={(name) => void versionHelpers.setValue(name, true)}
              />
            </StackItem>
          ))}
        </Stack>
      </StackItem>
    </Stack>
  );
};

export default ClusterVersionStep;
