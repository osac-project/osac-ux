/**
 * flow: cluster-provision-wizard
 * steps: catalog → general → configuration → networking → review
 * route: /clusters/create/:catalogItemId? (tenantUser, tenantAdmin)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  PageSectionTypes,
  Stack,
  StackItem,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';

import type { ClusterCatalogItem } from '@osac/types';

import { ClusterCatalogStep } from './wizard/cluster/ClusterCatalogStep';
import { ClusterConfigurationStep } from './wizard/cluster/ClusterConfigurationStep';
import { ClusterGeneralStep } from './wizard/cluster/ClusterGeneralStep';
import { ClusterNetworkingStep } from './wizard/cluster/ClusterNetworkingStep';
import { ClusterReviewStep } from './wizard/cluster/ClusterReviewStep';
import {
  type ClusterWizardValues,
  createEmptyClusterValues,
  isStepValid,
} from './wizard/cluster/fields';
import { useCreateCluster } from '../../api/v1/cluster';
import { useClusterCatalogItems } from '../../api/v1/cluster-catalog-item';
import { useClusterTemplate } from '../../api/v1/cluster-templates';

const CLUSTER_WIZARD_STEPS = [
  { id: 'catalog', name: 'Catalog' },
  { id: 'general', name: 'General' },
  { id: 'configuration', name: 'Configuration' },
  { id: 'networking', name: 'Networking' },
  { id: 'review', name: 'Review' },
] as const;

type ClusterWizardStepId = (typeof CLUSTER_WIZARD_STEPS)[number]['id'];

interface FooterProps {
  stepIndex: number;
  isLast: boolean;
  isPending: boolean;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const ClusterWizardFooter = ({
  isLast,
  isPending,
  canAdvance,
  onNext,
  onBack,
  onCancel,
}: FooterProps) => {
  const { activeStep, goToStepByIndex } = useWizardContext();
  const stepIndex = (activeStep?.index ?? 1) - 1;
  const isFirst = stepIndex === 0;

  return (
    <Flex
      justifyContent={{ default: 'justifyContentFlexStart' }}
      alignItems={{ default: 'alignItemsCenter' }}
      flexWrap={{ default: 'wrap' }}
      gap={{ default: 'gapMd' }}
    >
      {!isFirst && (
        <Button
          variant="secondary"
          onClick={() => {
            goToStepByIndex(stepIndex);
            onBack();
          }}
          isDisabled={isPending}
        >
          Back
        </Button>
      )}
      <Button
        variant="primary"
        onClick={() => {
          if (!isLast) {
            goToStepByIndex(stepIndex + 2);
          }
          onNext();
        }}
        isLoading={isLast && isPending}
        isDisabled={(isLast && isPending) || (!isLast && !canAdvance)}
      >
        {isLast ? 'Create cluster' : 'Next'}
      </Button>
      <Button variant="link" onClick={onCancel} isDisabled={isPending}>
        Cancel
      </Button>
    </Flex>
  );
};

interface Props {
  initialCatalogItemId?: string;
  onClosed?: () => void;
}

export const ClusterProvisionWizard = ({ initialCatalogItemId, onClosed }: Props) => {
  const [values, setValues] = useState<ClusterWizardValues>(
    createEmptyClusterValues(initialCatalogItemId),
  );
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ClusterCatalogItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [wizardResetKey, setWizardResetKey] = useState(0);

  const createCluster = useCreateCluster();
  const { data: catalogItems = [] } = useClusterCatalogItems();
  const templateId = selectedCatalogItem?.template ?? '';
  const { data: template, isPending: templateLoading } = useClusterTemplate(templateId);

  const deepLinkInitializedRef = useRef(false);

  const setValue = useCallback(
    <K extends keyof ClusterWizardValues>(field: K, value: ClusterWizardValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Apply template defaults when template loads
  useEffect(() => {
    if (!template) {
      return;
    }
    setValues((prev) => ({
      ...prev,
      releaseImage: prev.releaseImage || template.specDefaults?.releaseImage || '',
      podCidr: prev.podCidr || template.specDefaults?.network?.podCidr || '',
      serviceCidr: prev.serviceCidr || template.specDefaults?.network?.serviceCidr || '',
      // initialize empty parameter slots for all template parameters
      templateParameters: {
        ...Object.fromEntries(template.parameters.map((p) => [p.name, ''])),
        ...prev.templateParameters,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  // Deep-link: pre-select catalog item when arriving via /clusters/create/:catalogItemId
  useEffect(() => {
    if (deepLinkInitializedRef.current || !initialCatalogItemId || catalogItems.length === 0) {
      return;
    }
    const item = catalogItems.find((ci) => ci.id === initialCatalogItemId);
    if (!item) {
      return;
    }
    deepLinkInitializedRef.current = true;
    setSelectedCatalogItem(item);
    setValues((prev) => ({ ...prev, catalogItemId: item.id }));
  }, [catalogItems, initialCatalogItemId]);

  const handleCatalogItemSelected = useCallback((item: ClusterCatalogItem) => {
    setSelectedCatalogItem(item);
    setValues((prev) => ({
      ...createEmptyClusterValues(item.id),
      name: prev.name,
      pullSecret: prev.pullSecret,
      sshPublicKey: prev.sshPublicKey,
    }));
  }, []);

  const lastStepIndex = CLUSTER_WIZARD_STEPS.length - 1;
  const isLastStep = activeStepIndex === lastStepIndex;
  const canAdvance = isStepValid(activeStepIndex, values);

  const handleNext = useCallback(() => {
    if (!canAdvance && !isLastStep) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setProvisionError(undefined);

    if (!isLastStep) {
      setActiveStepIndex((prev) => prev + 1);
      return;
    }

    // Submit
    const templateParameters: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(values.templateParameters)) {
      if (val.trim()) {
        const paramDef = template?.parameters.find((p) => p.name === key);
        if (
          paramDef &&
          (paramDef.type.includes('Int') ||
            paramDef.type.includes('Float') ||
            paramDef.type.includes('Double'))
        ) {
          templateParameters[key] = Number(val);
        } else {
          templateParameters[key] = val;
        }
      }
    }

    const hasNetworkOverrides = values.podCidr.trim() || values.serviceCidr.trim();

    createCluster
      .mutateAsync({
        metadata: { name: values.name.trim() },
        spec: {
          catalogItem: values.catalogItemId,
          ...(values.pullSecret.trim() && { pullSecret: values.pullSecret.trim() }),
          ...(values.sshPublicKey.trim() && { sshPublicKey: values.sshPublicKey.trim() }),
          ...(values.releaseImage.trim() && { releaseImage: values.releaseImage.trim() }),
          ...(hasNetworkOverrides && {
            network: {
              ...(values.podCidr.trim() && { podCidr: values.podCidr.trim() }),
              ...(values.serviceCidr.trim() && { serviceCidr: values.serviceCidr.trim() }),
            },
          }),
          ...(Object.keys(templateParameters).length > 0 && { templateParameters }),
        },
      })
      .then(() => {
        onClosed?.();
      })
      .catch((err: unknown) => {
        setProvisionError(err instanceof Error ? err.message : 'Failed to create cluster.');
      });
  }, [canAdvance, createCluster, isLastStep, onClosed, template?.parameters, values]);

  const handleBack = useCallback(() => {
    setShowValidationErrors(false);
    setProvisionError(undefined);
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const requestCancel = useCallback(() => {
    if (createCluster.isPending) {
      return;
    }
    if (values.catalogItemId || values.name.trim()) {
      setShowCancelConfirm(true);
      return;
    }
    onClosed?.();
  }, [createCluster.isPending, onClosed, values.catalogItemId, values.name]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    setWizardResetKey((k) => k + 1);
    setValues(createEmptyClusterValues(initialCatalogItemId));
    setSelectedCatalogItem(null);
    setActiveStepIndex(0);
    setProvisionError(undefined);
    onClosed?.();
  }, [initialCatalogItemId, onClosed]);

  const renderStepContent = (stepId: ClusterWizardStepId) => {
    switch (stepId) {
      case 'catalog':
        return (
          <ClusterCatalogStep
            selectedCatalogItemId={values.catalogItemId}
            onSelect={handleCatalogItemSelected}
          />
        );
      case 'general':
        return (
          <ClusterGeneralStep
            values={values}
            onChange={setValue}
            showValidationErrors={showValidationErrors}
          />
        );
      case 'configuration':
        return (
          <ClusterConfigurationStep
            values={values}
            onChange={setValue}
            template={template}
            templateLoading={templateLoading && Boolean(templateId)}
          />
        );
      case 'networking':
        return <ClusterNetworkingStep values={values} onChange={setValue} template={template} />;
      case 'review':
        return (
          <ClusterReviewStep
            values={values}
            catalogItem={selectedCatalogItem}
            template={template}
            provisionError={provisionError}
          />
        );
    }
  };

  return (
    <>
      {showCancelConfirm && (
        <Modal
          variant="small"
          isOpen
          onClose={() => setShowCancelConfirm(false)}
          aria-labelledby="cluster-wizard-cancel-title"
        >
          <ModalHeader
            title="Discard progress?"
            titleIconVariant="warning"
            labelId="cluster-wizard-cancel-title"
          />
          <ModalBody>
            You have unsaved changes. Are you sure you want to cancel cluster creation?
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
              Keep editing
            </Button>
            <Button variant="primary" onClick={handleConfirmCancel}>
              Discard
            </Button>
          </ModalFooter>
        </Modal>
      )}

      <PageSection
        hasBodyWrapper={false}
        type={PageSectionTypes.wizard}
        aria-label="Create cluster wizard"
      >
        <Wizard
          key={wizardResetKey}
          navAriaLabel="Create cluster wizard navigation"
          isVisitRequired
          footer={
            <WizardFooterWrapper>
              <ClusterWizardFooter
                stepIndex={activeStepIndex}
                isLast={isLastStep}
                isPending={createCluster.isPending}
                canAdvance={canAdvance}
                onNext={handleNext}
                onBack={handleBack}
                onCancel={requestCancel}
              />
            </WizardFooterWrapper>
          }
        >
          {CLUSTER_WIZARD_STEPS.map((step, index) => (
            <WizardStep key={step.id} id={step.id} name={step.name}>
              <Stack hasGutter>
                {showValidationErrors && activeStepIndex === index && !canAdvance && (
                  <StackItem>
                    <Alert
                      variant="danger"
                      isInline
                      title="Complete all required fields before proceeding."
                    />
                  </StackItem>
                )}
                <StackItem>{renderStepContent(step.id)}</StackItem>
              </Stack>
            </WizardStep>
          ))}
        </Wizard>
      </PageSection>
    </>
  );
};
