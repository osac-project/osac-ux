import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  PageSection,
  Spinner,
  Stack,
  Title,
} from '@patternfly/react-core';

import { apiQueryKey } from '@osac/ui-components/api/types';
import { useApiQueryClient } from '@osac/ui-components/api/use-api-query';
import { useProvisionComputeInstance } from '@osac/ui-components/api/v1/compute-instance';
import type { BuildComputeInstanceCreateBodyInput } from '@osac/ui-components/api/v1/compute-instance-wire';
import {
  useCreatePublicIP,
  useCreatePublicIPAttachment,
} from '@osac/ui-components/api/v1/ip-management';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardCloseHandler,
} from '@osac/ui-components/components/catalogProvision/CatalogProvisionWizard';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const VmCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const provisionVm = useProvisionComputeInstance();
  const qc = useApiQueryClient();
  const [closeHandler, setCloseHandler] = useState<CatalogProvisionWizardCloseHandler | null>(null);
  const [assigningIP, setAssigningIP] = useState(false);
  const { mutateAsync: createPublicIP } = useCreatePublicIP();
  const { mutateAsync: createPublicIPAttachment } = useCreatePublicIPAttachment();

  const handleCloseHandlerChange = useCallback((handler: CatalogProvisionWizardCloseHandler) => {
    setCloseHandler(handler);
  }, []);

  const handleWizardClosed = useCallback(() => {
    navigate('/vms');
  }, [navigate]);

  const handleWizardProvision = useCallback(
    async (vm: BuildComputeInstanceCreateBodyInput) => {
      const { instance, warnings } = await provisionVm.mutateAsync({
        vm,
        specCatalogItemOnly: true,
      });
      if (!instance.id) {
        throw new Error('Create response missing id');
      }
      qc.setQueryData(apiQueryKey('v1/compute_instances', [instance.id]), instance);

      const publicIPPoolId = vm._postProvision?.publicIPPoolId;
      if (publicIPPoolId) {
        setAssigningIP(true);
        try {
          const pip = await createPublicIP({ spec: { pool: publicIPPoolId } });
          if (pip.id) {
            await createPublicIPAttachment({
              spec: {
                publicIp: pip.id,
                target: { case: 'computeInstance', value: instance.id },
              },
            });
          }
        } finally {
          setAssigningIP(false);
        }
      }

      navigate(
        `/vms/${instance.id}`,
        warnings.length
          ? { replace: true, state: { provisionWarnings: warnings } }
          : { replace: true },
      );
    },
    [navigate, provisionVm, qc, createPublicIP, createPublicIPAttachment],
  );

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button
                variant="link"
                isInline
                onClick={() => closeHandler?.requestClose()}
                isDisabled={closeHandler?.pending}
              >
                {t('Virtual Machines')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('catalogProvision.vm.breadcrumbCreate')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('catalogProvision.vm.wizardTitle')}
          </Title>
          <Content component="p">{t('catalogProvision.vm.wizardDescription')}</Content>
          {assigningIP && (
            <Stack hasGutter>
              <Spinner size="sm" /> Assigning public IP…
            </Stack>
          )}
        </Stack>
      </PageSection>
      <CatalogProvisionWizard
        initialCatalogItemId={catalogItemId}
        onProvision={handleWizardProvision}
        onClosed={handleWizardClosed}
        onCloseHandlerChange={handleCloseHandlerChange}
      />
    </>
  );
};
