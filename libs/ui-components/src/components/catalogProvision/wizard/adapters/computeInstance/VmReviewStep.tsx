import type { ReactNode } from 'react';
import {
  Alert,
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { useInstanceType } from '@osac/ui-components/api/v1/instance-types';
import { useProjects } from '@osac/ui-components/api/v1/project';
import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  fullProjectPathToQueryFilter,
  getProjectName,
} from '@osac/ui-components/components/Project/utils';
import { formatInstanceTypeReviewLabelFromType } from '@osac/ui-components/components/vm/utils';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { formatReviewScalar } from '../../catalogOverlay';
import { getVmStorageRows } from '../../storageRows';
import { NetworkAttachmentReviewFields } from '../NetworkAttachmentReviewFields';

import './VmReviewStep.css';

interface Props {
  catalogItem: CatalogItem | null;
}

export const VmReviewStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  const {
    data: instanceType,
    isLoading: instanceLoading,
    error: instanceErr,
  } = useInstanceType(values.spec.instanceType);

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects({ filter: fullProjectPathToQueryFilter(values.metadata.project) });

  if (instanceLoading || projectsLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const storageRows = getVmStorageRows(t, values.spec.bootDisk, values.spec.additionalDisks);

  // Read networking names directly from formik values (ResourceSelectValue stores name).
  const networking = values.spec.networking;
  const isCustomNetwork = !networking.useDefaultNetwork;

  const descriptionList = (ariaLabel: string, children: ReactNode) => (
    <DescriptionList className="catalog-provision__vm-review-list" aria-label={ariaLabel}>
      {children}
    </DescriptionList>
  );

  return (
    <Stack hasGutter className="catalog-provision__vm-review pf-m-limit-width">
      <StackItem>
        <Stack hasGutter className="catalog-provision__vm-review-intro">
          <StackItem>
            <Title headingLevel="h1" size="3xl">
              {t('Review and create')}
            </Title>
          </StackItem>
          <StackItem>
            <div className="catalog-provision__vm-review-description">
              {t('Confirm your settings before creating the virtual machine.')}
            </div>
          </StackItem>
        </Stack>
      </StackItem>
      {!!instanceErr && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch instance type')}>
            {getErrorMessage(instanceErr)}
          </Alert>
        </StackItem>
      )}

      {!!projectsError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch project')}>
            {getErrorMessage(projectsError)}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <Title headingLevel="h2" className="catalog-provision__vm-review-section-title">
          {t('Details')}
        </Title>
      </StackItem>
      <StackItem>
        {descriptionList(
          t('Details'),
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Template')}</DescriptionListTerm>
              <DescriptionListDescription>
                {catalogItem?.title || catalogItem?.metadata?.name || '—'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatReviewScalar(values.metadata.name)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatReviewScalar(values.metadata.description)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Project')}</DescriptionListTerm>
              <DescriptionListDescription>
                {projects?.length === 1 ? getProjectName(projects[0], t) : values.metadata.project}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </>,
        )}
      </StackItem>
      <StackItem>
        <Title headingLevel="h2" className="catalog-provision__vm-review-section-title">
          {t('Compute configuration')}
        </Title>
      </StackItem>
      <StackItem>
        {descriptionList(
          t('Compute configuration'),
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Disk image')}</DescriptionListTerm>
              <DescriptionListDescription>
                {values.spec.diskImage?.name || values.spec.diskImage?.id || '—'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Instance type')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatInstanceTypeReviewLabelFromType(
                  instanceType,
                  undefined,
                  values.spec.instanceType,
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </>,
        )}
      </StackItem>
      <StackItem>
        <Title headingLevel="h2" className="catalog-provision__vm-review-section-title">
          {t('Storage')}
        </Title>
      </StackItem>
      <StackItem>
        {descriptionList(
          t('Storage'),
          storageRows.map((row) => (
            <DescriptionListGroup key={row.name}>
              <DescriptionListTerm>{row.name}</DescriptionListTerm>
              <DescriptionListDescription>
                {row.size}, {row.storageTier}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )),
        )}
      </StackItem>
      <StackItem>
        <Title headingLevel="h2" className="catalog-provision__vm-review-section-title">
          {t('Networking')}
        </Title>
      </StackItem>
      <StackItem>
        {descriptionList(
          t('Networking'),
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Network')}</DescriptionListTerm>
              <DescriptionListDescription>
                {isCustomNetwork ? t('Custom') : t('Tenant default')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {isCustomNetwork && (
              <NetworkAttachmentReviewFields
                virtualNetwork={networking.virtualNetwork}
                subnet={networking.subnet}
                securityGroups={networking.securityGroups}
              />
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Auto attach external IP')}</DescriptionListTerm>
              <DescriptionListDescription>
                {networking.autoExternalIpAttachment ? t('Yes') : t('No')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </>,
        )}
      </StackItem>
      <StackItem>
        <Title headingLevel="h2" className="catalog-provision__vm-review-section-title">
          {t('Access & Initial Run')}
        </Title>
      </StackItem>
      <StackItem>
        {descriptionList(
          t('Access & Initial Run'),
          <>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatReviewScalar(values.spec.sshKey.name)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('User Data')}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatReviewScalar(
                  values.spec.userDataSource === 'secret'
                    ? values.spec.userDataSecret.name
                    : values.spec.userData,
                  values.spec.userDataSource === 'inline',
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </>,
        )}
      </StackItem>
    </Stack>
  );
};
