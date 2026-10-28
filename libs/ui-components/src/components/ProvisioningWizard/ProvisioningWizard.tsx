/**
 * ProvisioningWizard — shared orchestration shell for all resource-creation wizards.
 *
 * Extracted from CatalogProvisionWizard so that each resource (VM, Cluster, BareMetalInstance)
 * can own its own thin wizard component and pass its specific adapter here, rather than every
 * resource adapter being instantiated inside a single generic CatalogProvisionWizard.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { type FormikProps, FormikProvider, useFormik } from 'formik';

import type {
  CatalogProvisionPayload,
  CatalogProvisionWizardValues,
} from '../catalogProvision/catalogProvisionTypes';
import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogItem } from '../catalog/catalogItemDisplay';
import { FieldValidationProvider } from '../Form/FieldValidationContext';
import type { CatalogProvisionAdapter } from '../catalogProvision/wizard/adapters/types';
import {
  STEP_LABEL_KEYS,
  WIZARD_STEP_IDS,
  type WizardStepId,
  getWizardOrderedSteps,
} from '../catalogProvision/wizard/stepIds';
import { CatalogStep } from '../catalogProvision/wizard/steps/WizardSteps';
import { WizardValidationProvider } from '../catalogProvision/wizard/WizardValidationContext';

import '../catalogProvision/CatalogProvisionWizard.css';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type ProvisioningWizardCloseHandler = {
  requestClose: () => void;
  pending: boolean;
};

/** Erased adapter type used throughout the wizard shell (no resource-specific generics). */
export type ErasedCatalogAdapter = CatalogProvisionAdapter<
  CatalogItem,
  CatalogProvisionWizardValues,
  CatalogProvisionPayload
>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const hasWizardUnsavedProgress = (values: { catalogItemId?: string }): boolean =>
  Boolean(values.catalogItemId?.trim());

const isWizardStepId = (stepId: string | number | undefined): stepId is WizardStepId =>
  typeof stepId === 'string' && WIZARD_STEP_IDS.includes(stepId);

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

interface FooterProps {
  formik: FormikProps<CatalogProvisionWizardValues>;
  catalogItem: CatalogItem | null;
  setActiveStepId: (stepId: WizardStepId) => void;
  setProvisionError: (message: string | undefined) => void;
  setValidationAlert: (visible: boolean) => void;
  pending: boolean;
  setPending: (pending: boolean) => void;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  buildCreatePayload: ErasedCatalogAdapter['buildCreatePayload'];
  close: (options?: { notifyClosed?: boolean }) => void;
  requestClose: () => void;
}

const ProvisioningWizardFooter = ({
  formik,
  catalogItem,
  setActiveStepId,
  setProvisionError,
  setValidationAlert,
  pending,
  setPending,
  onProvision,
  buildCreatePayload,
  close,
  requestClose,
}: FooterProps) => {
  const { t } = useTranslation();
  const { activeStep, goToStepByIndex } = useWizardContext();
  const activeStepId = isWizardStepId(activeStep?.id) ? activeStep.id : 'catalog';

  useLayoutEffect(() => {
    setActiveStepId(activeStepId);
  }, [activeStepId, setActiveStepId]);

  const stepIndex = activeStep?.index ?? 1;
  const isFirst = stepIndex <= 1;
  const isReview = activeStepId === 'review';

  const handleBack = useCallback(() => {
    if (isFirst || pending) return;
    setProvisionError(undefined);
    setValidationAlert(false);
    goToStepByIndex(stepIndex - 1);
  }, [goToStepByIndex, isFirst, pending, setProvisionError, setValidationAlert, stepIndex]);

  const { values } = formik;

  const validateCurrentStep = useCallback(async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationAlert(true);
      return false;
    }
    setValidationAlert(false);
    return true;
  }, [formik, setValidationAlert]);

  const handleNextOrCreate = useCallback(() => {
    if (pending) return;

    if (isReview) {
      if (!catalogItem) {
        setProvisionError(t('catalogProvision.validation.catalogItemRequired'));
        return;
      }
      setPending(true);
      setProvisionError(undefined);
      const payload = buildCreatePayload(values, catalogItem);
      void Promise.resolve(onProvision(payload))
        .then(() => {
          close({ notifyClosed: false });
        })
        .catch((error) => {
          setProvisionError(
            error instanceof Error ? error.message : t('catalogProvision.errors.provisionFailed'),
          );
        })
        .finally(() => {
          setPending(false);
        });
      return;
    }

    void validateCurrentStep().then((isValid) => {
      if (!isValid) return;
      setProvisionError(undefined);
      goToStepByIndex(stepIndex + 1);
    });
  }, [
    buildCreatePayload,
    catalogItem,
    close,
    goToStepByIndex,
    isReview,
    onProvision,
    pending,
    setPending,
    setProvisionError,
    stepIndex,
    t,
    validateCurrentStep,
    values,
  ]);

  return (
    <Flex
      justifyContent={{ default: 'justifyContentFlexStart' }}
      alignItems={{ default: 'alignItemsCenter' }}
      flexWrap={{ default: 'wrap' }}
      gap={{ default: 'gapMd' }}
    >
      <Button
        variant="secondary"
        onClick={handleBack}
        isDisabled={isFirst || pending}
        isAriaDisabled={isFirst || pending}
      >
        {t('catalogProvision.actions.back')}
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleNextOrCreate}
        isDisabled={pending}
        isLoading={pending}
      >
        {isReview ? t('catalogProvision.actions.create') : t('catalogProvision.actions.next')}
      </Button>
      <Button variant="link" onClick={requestClose} isDisabled={pending}>
        {t('catalogProvision.actions.cancel')}
      </Button>
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Step body — renders the right step component based on stepId
// ---------------------------------------------------------------------------

interface StepBodyProps {
  adapter: ErasedCatalogAdapter;
  stepId: WizardStepId;
  catalogItem: CatalogItem | null;
  provisionError?: string;
  validationAlert: boolean;
}

const ProvisioningWizardStepBody = ({
  adapter,
  stepId,
  catalogItem,
  provisionError,
  validationAlert,
}: StepBodyProps) => {
  const { t } = useTranslation();
  const ConfigurationStep = adapter.ConfigurationStep;
  const StorageStep = adapter.StorageStep;
  const InstanceTypeStep = adapter.InstanceTypeStep;
  const NetworkingStep = adapter.NetworkingStep;
  const AccessAndInitialRunStep = adapter.AccessAndInitialRunStep;
  const GeneralStepComponent = adapter.GeneralStep;
  const ReviewStepComponent = adapter.ReviewStep;

  return (
    <FieldValidationProvider showErrors={validationAlert}>
      <Stack hasGutter className="catalog-provision__wizard-step-body">
        {validationAlert ? (
          <StackItem>
            <Alert variant="danger" isInline title={t('catalogProvision.validation.stepInvalid')} />
          </StackItem>
        ) : null}
        {provisionError ? (
          <StackItem>
            <Alert variant="danger" isInline title={t('catalogProvision.errors.provisionTitle')}>
              {provisionError}
            </Alert>
          </StackItem>
        ) : null}
        {stepId === 'catalog' ? <CatalogStep adapter={adapter} /> : null}
        {stepId === 'general' ? <GeneralStepComponent catalogItem={catalogItem} /> : null}
        {stepId === 'instance-type' && InstanceTypeStep ? (
          <InstanceTypeStep catalogItem={catalogItem} />
        ) : null}
        {stepId === 'configuration' ? <ConfigurationStep catalogItem={catalogItem} /> : null}
        {stepId === 'storage' && StorageStep ? <StorageStep catalogItem={catalogItem} /> : null}
        {stepId === 'networking' ? <NetworkingStep catalogItem={catalogItem} /> : null}
        {stepId === 'access-and-initial-run' && AccessAndInitialRunStep ? (
          <AccessAndInitialRunStep catalogItem={catalogItem} />
        ) : null}
        {stepId === 'review' ? <ReviewStepComponent catalogItem={catalogItem} /> : null}
      </Stack>
    </FieldValidationProvider>
  );
};

// ---------------------------------------------------------------------------
// Wizard form — PatternFly Wizard shell + cancel modal
// ---------------------------------------------------------------------------

interface WizardFormProps {
  adapter: ErasedCatalogAdapter;
  formik: FormikProps<CatalogProvisionWizardValues>;
  initialCatalogItemId?: string;
  orderedSteps: readonly WizardStepId[];
  wizardResetKey: number;
  setActiveStepId: (stepId: WizardStepId) => void;
  provisionError?: string;
  setProvisionError: (message: string | undefined) => void;
  validationAlert: boolean;
  setValidationAlert: (visible: boolean) => void;
  pending: boolean;
  setPending: (pending: boolean) => void;
  showCancelConfirm: boolean;
  setShowCancelConfirm: (visible: boolean) => void;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  close: (options?: { notifyClosed?: boolean }) => void;
  onCloseHandlerChange?: (handler: ProvisioningWizardCloseHandler) => void;
  t: ReturnType<typeof useTranslation>['t'];
}

const ProvisioningWizardForm = ({
  adapter,
  formik,
  initialCatalogItemId,
  orderedSteps,
  wizardResetKey,
  setActiveStepId,
  provisionError,
  setProvisionError,
  validationAlert,
  setValidationAlert,
  pending,
  setPending,
  showCancelConfirm,
  setShowCancelConfirm,
  onProvision,
  close,
  onCloseHandlerChange,
  t,
}: WizardFormProps) => {
  const { data: catalogItems = [] } = adapter.useCatalogItems();
  const selectedCatalogItem: CatalogItem | null = formik.values.catalogItemId
    ? (catalogItems.find((item) => item.id === formik.values.catalogItemId) ?? null)
    : null;

  const requestClose = useCallback(() => {
    if (pending) return;
    if (hasWizardUnsavedProgress(formik.values)) {
      setShowCancelConfirm(true);
      return;
    }
    close();
  }, [close, formik.values, pending, setShowCancelConfirm]);

  useEffect(() => {
    onCloseHandlerChange?.({ requestClose, pending });
  }, [onCloseHandlerChange, pending, requestClose]);

  const handleStepChange = useCallback(() => {
    setProvisionError(undefined);
    setValidationAlert(false);
  }, [setProvisionError, setValidationAlert]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending && !showCancelConfirm) {
        requestClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pending, requestClose, showCancelConfirm]);

  const deepLinkInitializedRef = useRef(false);

  useEffect(() => {
    if (deepLinkInitializedRef.current || !initialCatalogItemId) return;
    const item = catalogItems.find((entry) => entry.id === initialCatalogItemId);
    if (!item) return;
    deepLinkInitializedRef.current = true;
    void adapter.onCatalogItemSelected?.(item, formik);
  }, [adapter, catalogItems, formik, initialCatalogItemId]);

  const clearValidationAlert = useCallback(() => {
    setValidationAlert(false);
  }, [setValidationAlert]);

  return (
    <>
      {showCancelConfirm ? (
        <Modal
          variant="small"
          isOpen
          onClose={() => setShowCancelConfirm(false)}
          aria-labelledby="provisioning-wizard-cancel-title"
        >
          <ModalHeader
            title={t('catalogProvision.cancel.title')}
            titleIconVariant="warning"
            labelId="provisioning-wizard-cancel-title"
          />
          <ModalBody>{t('catalogProvision.cancel.body')}</ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
              {t('catalogProvision.cancel.keepEditing')}
            </Button>
            <Button variant="primary" onClick={() => close()}>
              {t('catalogProvision.cancel.discard')}
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
      <WizardValidationProvider clearValidationAlert={clearValidationAlert}>
        <PageSection
          hasBodyWrapper={false}
          type={PageSectionTypes.wizard}
          aria-label={t(adapter.ariaLabelKey)}
        >
          <Wizard
            key={wizardResetKey}
            navAriaLabel={t('catalogProvision.wizard.navAria', {
              title: t(adapter.wizardTitleKey),
            })}
            isVisitRequired
            onStepChange={handleStepChange}
            footer={
              <WizardFooterWrapper>
                <ProvisioningWizardFooter
                  formik={formik}
                  catalogItem={selectedCatalogItem}
                  setActiveStepId={setActiveStepId}
                  setProvisionError={setProvisionError}
                  setValidationAlert={setValidationAlert}
                  pending={pending}
                  setPending={setPending}
                  onProvision={onProvision}
                  buildCreatePayload={adapter.buildCreatePayload}
                  close={close}
                  requestClose={requestClose}
                />
              </WizardFooterWrapper>
            }
          >
            {orderedSteps.map((stepId) => (
              <WizardStep key={stepId} id={stepId} name={STEP_LABEL_KEYS(t, adapter.kind)[stepId]}>
                <ProvisioningWizardStepBody
                  adapter={adapter}
                  stepId={stepId}
                  catalogItem={selectedCatalogItem}
                  provisionError={provisionError}
                  validationAlert={validationAlert}
                />
              </WizardStep>
            ))}
          </Wizard>
        </PageSection>
      </WizardValidationProvider>
    </>
  );
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export interface ProvisioningWizardProps {
  adapter: ErasedCatalogAdapter;
  initialCatalogItemId?: string;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
  onCloseHandlerChange?: (handler: ProvisioningWizardCloseHandler) => void;
}

export const ProvisioningWizard = ({
  adapter,
  initialCatalogItemId,
  onProvision,
  onClosed,
  onCloseHandlerChange,
}: ProvisioningWizardProps) => {
  const { t } = useTranslation();
  const orderedSteps = useMemo(() => getWizardOrderedSteps(adapter.kind), [adapter.kind]);
  const [wizardResetKey, setWizardResetKey] = useState(0);
  const [activeStepId, setActiveStepId] = useState<WizardStepId>('catalog');
  const [schemaCatalogItemId, setSchemaCatalogItemId] = useState(initialCatalogItemId ?? '');
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [validationAlert, setValidationAlert] = useState(false);
  const [pending, setPending] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { data: catalogItems = [] } = adapter.useCatalogItems();

  useEffect(() => {
    setActiveStepId('catalog');
  }, [wizardResetKey]);

  const selectedCatalogItem: CatalogItem | null = schemaCatalogItemId
    ? (catalogItems.find((item) => item.id === schemaCatalogItemId) ?? null)
    : null;

  const initialValues = useMemo(() => {
    const values = adapter.getInitialValues(null);
    if (initialCatalogItemId) {
      values.catalogItemId = initialCatalogItemId;
    }
    return values;
  }, [adapter, initialCatalogItemId]);

  const validationSchema = useMemo(
    () => adapter.getStepValidationSchema(selectedCatalogItem, activeStepId),
    [adapter, activeStepId, selectedCatalogItem],
  );

  const formik = useFormik<CatalogProvisionWizardValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: () => undefined,
  });

  useEffect(() => {
    setSchemaCatalogItemId(formik.values.catalogItemId ?? '');
  }, [formik.values.catalogItemId]);

  const resetLocal = useCallback(() => {
    setProvisionError(undefined);
    setValidationAlert(false);
    setShowCancelConfirm(false);
    setWizardResetKey((key) => key + 1);
  }, []);

  const close = useCallback(
    (options?: { notifyClosed?: boolean }) => {
      resetLocal();
      if (options?.notifyClosed !== false) {
        onClosed?.();
      }
    },
    [onClosed, resetLocal],
  );

  return (
    <FormikProvider value={formik}>
      <ProvisioningWizardForm
        adapter={adapter}
        formik={formik}
        initialCatalogItemId={initialCatalogItemId}
        orderedSteps={orderedSteps}
        wizardResetKey={wizardResetKey}
        setActiveStepId={setActiveStepId}
        provisionError={provisionError}
        setProvisionError={setProvisionError}
        validationAlert={validationAlert}
        setValidationAlert={setValidationAlert}
        pending={pending}
        setPending={setPending}
        showCancelConfirm={showCancelConfirm}
        setShowCancelConfirm={setShowCancelConfirm}
        onProvision={onProvision}
        close={close}
        onCloseHandlerChange={onCloseHandlerChange}
        t={t}
      />
    </FormikProvider>
  );
};
