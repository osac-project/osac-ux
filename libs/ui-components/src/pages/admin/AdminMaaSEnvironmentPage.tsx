/**
 * flow: admin-maas-environment
 * route: /admin/ai-environment (tenantAdmin)
 *
 * Tenant Admin: Provision MaaS Inference Cluster.
 * Dedicated tenant cluster mode [0.2 scope] — each tenant provisions its own
 * AiEnvironment via CaaS + custom Ansible templates (Connectivity Link,
 * Authorino, Limiter). Shared inference cluster mode is deferred to AI Grid.
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  TextInput,
} from '@patternfly/react-core';

import { useAiEnvironments, useEnableAiEnvironment } from '../../api/v1/ai-environment';
import type { AiEnvironment, AiEnvironmentState } from '../../api/v1/maas-types';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const tenantEnvironmentName = (tenantId: string) => `maas-${tenantId}`;

const AiStateLabel = ({ state }: { state: AiEnvironmentState | undefined }) => {
  const { t } = useTranslation();
  switch (state) {
    case 'READY':
      return (
        <Label isCompact color="green">
          {t('Ready')}
        </Label>
      );
    case 'PROVISIONING':
      return (
        <>
          <Spinner size="sm" aria-label="provisioning" />{' '}
          <Label isCompact color="blue">
            {t('Provisioning')}
          </Label>
        </>
      );
    case 'FAILED':
      return (
        <Label isCompact color="red">
          {t('Failed')}
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          {t('Pending')}
        </Label>
      );
  }
};

interface ProvisionModalProps {
  tenantId: string;
  onClose: () => void;
}

const ProvisionMaaSClusterModal = ({ tenantId, onClose }: ProvisionModalProps) => {
  const { t } = useTranslation();
  const [clusterName, setClusterName] = useState(`${tenantId}-maas-cluster`);
  const { mutateAsync, isPending, error } = useEnableAiEnvironment();

  const isValid = clusterName.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }
    await mutateAsync({
      metadata: { name: tenantEnvironmentName(tenantId) },
      spec: {
        clusterId: clusterName.trim(),
        rhoaiVersion: '2.17',
        gatewayEndpoint: `https://maas.apps.${clusterName.trim()}.example.com`,
        registeredModels: [],
      },
      status: { state: 'PROVISIONING', clusterName: clusterName.trim() },
    } as unknown as Omit<AiEnvironment, 'id'>);
    onClose();
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="provision-maas-title"
    >
      <ModalHeader title={t('Provision MaaS inference cluster')} labelId="provision-maas-title" />
      <ModalBody>
        <p style={{ marginBottom: '1rem' }}>
          {t(
            'This provisions a dedicated cluster for your tenant via CaaS, with the MaaS gateway (Connectivity Link, Authorino, Limiter) and RHOAI console layered on via custom Ansible templates. Target provisioning time: under 10 minutes.',
          )}
        </p>
        <TextInput
          id="provision-cluster-name"
          aria-label={t('Cluster name')}
          value={clusterName}
          onChange={(_e, v) => setClusterName(v)}
          isRequired
        />
        {error && (
          <Alert
            variant="danger"
            isInline
            title={t('Failed to provision cluster')}
            style={{ marginTop: '1rem' }}
          >
            {getErrorMessage(error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isPending}
          isDisabled={isPending || !isValid}
        >
          {t('Provision MaaS Cluster')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const AdminMaaSEnvironmentPage = () => {
  const { t } = useTranslation();
  const { tenantId } = useSession();
  const { data: environments = [], isLoading, error } = useAiEnvironments();
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const environment = useMemo(
    () => environments.find((e) => e.metadata?.name === tenantEnvironmentName(tenantId)),
    [environments, tenantId],
  );

  return (
    <>
      {showProvisionModal && (
        <ProvisionMaaSClusterModal
          tenantId={tenantId}
          onClose={() => setShowProvisionModal(false)}
        />
      )}
      <ListPage
        title={t('AI Environment')}
        description={t(
          "Provision and manage your tenant's dedicated MaaS inference cluster. Configure model subscriptions once the environment is ready.",
        )}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          {!environment ? (
            <EmptyState titleText={t('No MaaS inference cluster yet')} headingLevel="h2">
              <EmptyStateBody>
                {t(
                  'Provision a dedicated inference cluster for your tenant to start deploying and subscribing to AI models.',
                )}
              </EmptyStateBody>
              <EmptyStateFooter>
                <Button variant="primary" onClick={() => setShowProvisionModal(true)}>
                  {t('Provision MaaS Cluster')}
                </Button>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Cluster')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {environment.status?.clusterName ?? environment.spec?.clusterId}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <AiStateLabel state={environment.status?.state} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('RHOAI version')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {environment.spec?.rhoaiVersion ?? '—'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Gateway endpoint')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <code style={{ fontSize: 'var(--pf-t--global--font--size--sm)' }}>
                    {environment.spec?.gatewayEndpoint ?? '—'}
                  </code>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Registered models')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {environment.spec?.registeredModels?.length ?? 0}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          )}
        </ListPageBody>
      </ListPage>
    </>
  );
};
