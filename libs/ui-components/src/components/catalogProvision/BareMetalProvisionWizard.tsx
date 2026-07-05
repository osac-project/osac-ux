/**
 * flow: baremetal-provision-wizard
 * steps: catalog → general → configuration → review
 * route: /bare-metal/create/:catalogItemId? (tenantUser, tenantAdmin)
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

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { BareMetalCatalogStep } from './wizard/baremetal/BareMetalCatalogStep';
import { BareMetalConfigurationStep } from './wizard/baremetal/BareMetalConfigurationStep';
import { BareMetalGeneralStep } from './wizard/baremetal/BareMetalGeneralStep';
import { BareMetalReviewStep } from './wizard/baremetal/BareMetalReviewStep';
import {
  BM_RUN_STRATEGY_ALWAYS,
  type BareMetalWizardValues,
  createEmptyBareMetalValues,
  isBmStepValid,
} from './wizard/baremetal/fields';
import {
  useBareMetalInstanceCatalogItems,
  useCreateBareMetalInstance,
} from '../../api/v1/baremetal-instance';
import { useBareMetalInstanceTemplate } from '../../api/v1/baremetal-instance-templates';

const BM_WIZARD_STEPS = [
  { id: 'catalog', name: 'Catalog' },
  { id: 'general', name: 'General' },
  { id: 'configuration', name: 'Configuration' },
  { id: 'review', name: 'Review' },
] as const;

type BmWizardStepId = (typeof BM_WIZARD_STEPS)[number]['id'];

interface FooterProps {
  isLast: boolean;
  isPending: boolean;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const BareMetalWizardFooter = ({
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
        {isLast ? 'Create bare metal' : 'Next'}
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

export const BareMetalProvisionWizard = ({ initialCatalogItemId, onClosed }: Props) => {
  const [values, setValues] = useState<BareMetalWizardValues>(
    createEmptyBareMetalValues(initialCatalogItemId),
  );
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<BareMetalInstanceCatalogItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [wizardResetKey, setWizardResetKey] = useState(0);

  const createBareMetalInstance = useCreateBareMetalInstance();
  const { data: catalogItems = [] } = useBareMetalInstanceCatalogItems();
  const templateId = selectedCatalogItem?.template ?? '';
  const { data: template } = useBareMetalInstanceTemplate(templateId);

  const deepLinkInitializedRef = useRef(false);

  const setValue = useCallback(
    <K extends keyof BareMetalWizardValues>(field: K, value: BareMetalWizardValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // @predicted: BareMetalInstanceTemplateSpecDefaults.sshPublicKey / runStrategy
  // Today specDefaults is empty ({}); this effect becomes live when the proto adds these fields.
  useEffect(() => {
    if (!template) {
      return;
    }
    const defaults = template.specDefaults as Record<string, unknown> | undefined;
    if (!defaults) {
      return;
    }
    setValues((prev) => ({
      ...prev,
      sshPublicKey:
        prev.sshPublicKey ||
        (typeof defaults['sshPublicKey'] === 'string' ? defaults['sshPublicKey'] : ''),
      runStrategy:
        prev.runStrategy !== BM_RUN_STRATEGY_ALWAYS
          ? prev.runStrategy
          : typeof defaults['runStrategy'] === 'number'
            ? defaults['runStrategy']
            : BM_RUN_STRATEGY_ALWAYS,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  // Deep-link: pre-select catalog item when arriving via /bare-metal/create/:catalogItemId
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

  const handleCatalogItemSelected = useCallback((item: BareMetalInstanceCatalogItem) => {
    setSelectedCatalogItem(item);
    setValues((prev) => ({
      ...createEmptyBareMetalValues(item.id),
      // preserve general fields the user may have typed before changing catalog item
      name: prev.name,
    }));
  }, []);

  const lastStepIndex = BM_WIZARD_STEPS.length - 1;
  const isLastStep = activeStepIndex === lastStepIndex;
  const canAdvance = isBmStepValid(activeStepIndex, values);

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

    createBareMetalInstance
      .mutateAsync({
        metadata: { name: values.name.trim() },
        spec: {
          catalogItem: values.catalogItemId,
          runStrategy: values.runStrategy,
          ...(values.sshPublicKey.trim() && { sshPublicKey: values.sshPublicKey.trim() }),
          ...(values.userData.trim() && { userData: values.userData.trim() }),
        },
      })
      .then(() => {
        onClosed?.();
      })
      .catch((err: unknown) => {
        setProvisionError(
          err instanceof Error ? err.message : 'Failed to create bare metal instance.',
        );
      });
  }, [canAdvance, createBareMetalInstance, isLastStep, onClosed, values]);

  const handleBack = useCallback(() => {
    setShowValidationErrors(false);
    setProvisionError(undefined);
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const requestCancel = useCallback(() => {
    if (createBareMetalInstance.isPending) {
      return;
    }
    if (values.catalogItemId || values.name.trim()) {
      setShowCancelConfirm(true);
      return;
    }
    onClosed?.();
  }, [createBareMetalInstance.isPending, onClosed, values.catalogItemId, values.name]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    setWizardResetKey((k) => k + 1);
    setValues(createEmptyBareMetalValues(initialCatalogItemId));
    setSelectedCatalogItem(null);
    setActiveStepIndex(0);
    setProvisionError(undefined);
    onClosed?.();
  }, [initialCatalogItemId, onClosed]);

  const renderStepContent = (stepId: BmWizardStepId, index: number) => {
    const content = (() => {
      switch (stepId) {
        case 'catalog':
          return (
            <BareMetalCatalogStep
              selectedCatalogItemId={values.catalogItemId}
              onSelect={handleCatalogItemSelected}
            />
          );
        case 'general':
          return (
            <BareMetalGeneralStep
              values={values}
              onChange={setValue}
              showValidationErrors={showValidationErrors}
            />
          );
        case 'configuration':
          return <BareMetalConfigurationStep values={values} onChange={setValue} />;
        case 'review':
          return (
            <BareMetalReviewStep
              values={values}
              catalogItem={selectedCatalogItem}
              provisionError={provisionError}
            />
          );
      }
    })();

    return (
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
        <StackItem>{content}</StackItem>
      </Stack>
    );
  };

  return (
    <>
      {showCancelConfirm && (
        <Modal
          variant="small"
          isOpen
          onClose={() => setShowCancelConfirm(false)}
          aria-labelledby="bm-wizard-cancel-title"
        >
          <ModalHeader
            title="Discard progress?"
            titleIconVariant="warning"
            labelId="bm-wizard-cancel-title"
          />
          <ModalBody>
            You have unsaved changes. Are you sure you want to cancel bare metal instance creation?
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
        aria-label="Create bare metal instance wizard"
      >
        <Wizard
          key={wizardResetKey}
          navAriaLabel="Create bare metal instance wizard navigation"
          isVisitRequired
          footer={
            <WizardFooterWrapper>
              <BareMetalWizardFooter
                isLast={isLastStep}
                isPending={createBareMetalInstance.isPending}
                canAdvance={canAdvance}
                onNext={handleNext}
                onBack={handleBack}
                onCancel={requestCancel}
              />
            </WizardFooterWrapper>
          }
        >
          {BM_WIZARD_STEPS.map((step, index) => (
            <WizardStep key={step.id} id={step.id} name={step.name}>
              {renderStepContent(step.id, index)}
            </WizardStep>
          ))}
        </Wizard>
      </PageSection>
    </>
  );
};
