/**
 * flow: maas-provision-wizard
 * steps: catalog → configuration → review
 * route: /models/create/:catalogItemId? (tenantUser, tenantAdmin)
 *
 * Upgrades the former single-form MaaSCreatePage to a wizard, matching the
 * VM/Cluster/BM provisioning pattern for consistency (Gap area 3).
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

import {
  type MaaSWizardValues,
  createEmptyMaaSValues,
  isMaaSStepValid,
} from './wizard/maas/fields';
import { MaaSCatalogStep } from './wizard/maas/MaaSCatalogStep';
import { MaaSConfigurationStep } from './wizard/maas/MaaSConfigurationStep';
import { MaaSReviewStep } from './wizard/maas/MaaSReviewStep';
import { useMaaSCatalogItems } from '../../api/v1/maas-catalog-item';
import { useProvisionModelAccess } from '../../api/v1/maas-instance';
import type { ModelCatalogItem } from '../../api/v1/maas-types';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';

const MAAS_WIZARD_STEPS = [
  { id: 'catalog', name: 'catalogProvision.steps.catalog.title' },
  { id: 'configuration', name: 'catalogProvision.steps.configuration.title' },
  { id: 'review', name: 'catalogProvision.steps.review.title' },
] as const;

type MaaSWizardStepId = (typeof MAAS_WIZARD_STEPS)[number]['id'];

interface FooterProps {
  isLast: boolean;
  isPending: boolean;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const MaaSWizardFooter = ({
  isLast,
  isPending,
  canAdvance,
  onNext,
  onBack,
  onCancel,
}: FooterProps) => {
  const { t } = useTranslation();
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
          {t('catalogProvision.actions.back')}
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
        {isLast
          ? t('catalogProvision.maas.actions.requestAccess')
          : t('catalogProvision.actions.next')}
      </Button>
      <Button variant="link" onClick={onCancel} isDisabled={isPending}>
        {t('catalogProvision.actions.cancel')}
      </Button>
    </Flex>
  );
};

interface Props {
  initialCatalogItemId?: string;
  onClosed?: () => void;
}

export const MaaSProvisionWizard = ({ initialCatalogItemId, onClosed }: Props) => {
  const { t } = useTranslation();
  const { tenantId } = useSession();
  const [values, setValues] = useState<MaaSWizardValues>(
    createEmptyMaaSValues(initialCatalogItemId),
  );
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ModelCatalogItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [wizardResetKey, setWizardResetKey] = useState(0);

  const provisionModelAccess = useProvisionModelAccess();
  const { data: catalogItems = [] } = useMaaSCatalogItems({}, tenantId);

  const deepLinkInitializedRef = useRef(false);

  const setValue = useCallback(
    <K extends keyof MaaSWizardValues>(field: K, value: MaaSWizardValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Deep-link: pre-select catalog item when arriving via /models/create/:catalogItemId
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

  const handleCatalogItemSelected = useCallback((item: ModelCatalogItem) => {
    setSelectedCatalogItem(item);
    setValues((prev) => ({
      ...createEmptyMaaSValues(item.id),
      applicationName: prev.applicationName,
    }));
  }, []);

  const lastStepIndex = MAAS_WIZARD_STEPS.length - 1;
  const isLastStep = activeStepIndex === lastStepIndex;
  const canAdvance = isMaaSStepValid(activeStepIndex, values);

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

    const quotaFieldDef = selectedCatalogItem?.field_definitions?.find(
      (f) => f.path === 'token_quota_monthly',
    );
    const showQuota = quotaFieldDef?.editable !== false;

    provisionModelAccess
      .mutateAsync({
        spec: {
          catalogItem: values.catalogItemId,
          applicationName: values.applicationName.trim(),
          tokenQuotaMonthly: showQuota ? values.tokenQuotaMonthly : undefined,
        },
      })
      .then(() => {
        onClosed?.();
      })
      .catch((err: unknown) => {
        setProvisionError(
          err instanceof Error ? err.message : t('catalogProvision.maas.errors.provisionFailed'),
        );
      });
  }, [canAdvance, isLastStep, onClosed, provisionModelAccess, selectedCatalogItem, t, values]);

  const handleBack = useCallback(() => {
    setShowValidationErrors(false);
    setProvisionError(undefined);
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const requestCancel = useCallback(() => {
    if (provisionModelAccess.isPending) {
      return;
    }
    if (values.catalogItemId || values.applicationName.trim()) {
      setShowCancelConfirm(true);
      return;
    }
    onClosed?.();
  }, [onClosed, provisionModelAccess.isPending, values.applicationName, values.catalogItemId]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    setWizardResetKey((k) => k + 1);
    setValues(createEmptyMaaSValues(initialCatalogItemId));
    setSelectedCatalogItem(null);
    setActiveStepIndex(0);
    setProvisionError(undefined);
    onClosed?.();
  }, [initialCatalogItemId, onClosed]);

  const renderStepContent = (stepId: MaaSWizardStepId, index: number) => {
    const content = (() => {
      switch (stepId) {
        case 'catalog':
          return (
            <MaaSCatalogStep
              selectedCatalogItemId={values.catalogItemId}
              onSelect={handleCatalogItemSelected}
            />
          );
        case 'configuration':
          return (
            <MaaSConfigurationStep
              values={values}
              onChange={setValue}
              catalogItem={selectedCatalogItem}
              showValidationErrors={showValidationErrors}
            />
          );
        case 'review':
          return (
            <MaaSReviewStep
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
            <Alert variant="danger" isInline title={t('catalogProvision.validation.stepInvalid')} />
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
          aria-labelledby="maas-wizard-cancel-title"
        >
          <ModalHeader
            title={t('catalogProvision.cancel.title')}
            titleIconVariant="warning"
            labelId="maas-wizard-cancel-title"
          />
          <ModalBody>{t('catalogProvision.maas.cancel.body')}</ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
              {t('catalogProvision.cancel.keepEditing')}
            </Button>
            <Button variant="primary" onClick={handleConfirmCancel}>
              {t('catalogProvision.cancel.discard')}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      <PageSection
        hasBodyWrapper={false}
        type={PageSectionTypes.wizard}
        aria-label={t('catalogProvision.maas.wizard.ariaLabel')}
      >
        <Wizard
          key={wizardResetKey}
          navAriaLabel={t('catalogProvision.maas.wizard.navAriaLabel')}
          isVisitRequired
          footer={
            <WizardFooterWrapper>
              <MaaSWizardFooter
                isLast={isLastStep}
                isPending={provisionModelAccess.isPending}
                canAdvance={canAdvance}
                onNext={handleNext}
                onBack={handleBack}
                onCancel={requestCancel}
              />
            </WizardFooterWrapper>
          }
        >
          {MAAS_WIZARD_STEPS.map((step, index) => (
            <WizardStep key={step.id} id={step.id} name={t(step.name)}>
              {renderStepContent(step.id, index)}
            </WizardStep>
          ))}
        </Wizard>
      </PageSection>
    </>
  );
};
