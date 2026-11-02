import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, ConnectError } from '@connectrpc/connect';
import { PageSection, PageSectionTypes, Wizard, WizardStep } from '@patternfly/react-core';
import { Formik, type FormikErrors } from 'formik';

import { SourceType } from '@osac/types';

import DiskImageConfigurationStep from './DiskImageConfigurationStep';
import { DISK_IMAGES_LIST_ROUTE } from './DiskImageForm';
import DiskImageGeneralStep from './DiskImageGeneralStep';
import DiskImageReviewStep from './DiskImageReviewStep';
import { getDiskImageCreateSchema } from './validation';
import { type DiskImageFormValues, diskImageCreateValues } from './values';
import { useCreateDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import { FieldValidationProvider } from '../Form/FieldValidationContext';
import LeaveFormConfirmation from '../Form/LeaveFormConfirmation';
import { OSACWizardFooter } from '../Wizard/OSACWizardFooter';

type DiskImageWizardStep = 'general' | 'configuration' | 'review';

const diskImageStepHasErrors = (stepId: string, errors: FormikErrors<unknown>): boolean => {
  const formErrors = errors as FormikErrors<DiskImageFormValues>;
  if (stepId === 'general') {
    return Boolean(formErrors.metadata?.name);
  }
  if (stepId === 'configuration') {
    return Boolean(
      formErrors.spec?.sourceRef || formErrors.spec?.guestOsFamily || formErrors.spec?.architecture,
    );
  }
  return false;
};

const DiskImageWizard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<DiskImageWizardStep>('general');
  const { mutateAsync: create, error, reset } = useCreateDiskImage();

  const onSubmit = async (values: DiskImageFormValues) => {
    try {
      const created = await create({
        metadata: {
          name: values.metadata.name,
          ...(values.scope === 'tenant' && values.metadata.tenant
            ? { tenant: values.metadata.tenant }
            : {}),
          ...(values.metadata.description ? { description: values.metadata.description } : {}),
          ...(values.metadata.labels.length > 0
            ? {
                labels: Object.fromEntries(
                  values.metadata.labels
                    .filter(({ key, value }) => key.trim() && value.trim())
                    .map(({ key, value }) => [key, value]),
                ),
              }
            : {}),
        },
        spec: {
          sourceType: SourceType.REGISTRY,
          sourceRef: values.spec.sourceRef,
          guestOsFamily: values.spec.guestOsFamily,
          architecture: values.spec.architecture,
        },
      });
      navigate(`${DISK_IMAGES_LIST_ROUTE}/${created.id}`);
    } catch (submissionError) {
      if (
        submissionError instanceof ConnectError &&
        submissionError.code === Code.InvalidArgument
      ) {
        // The shared wizard footer presents the API error and keeps the user on Review.
      }
    }
  };

  return (
    <Formik<DiskImageFormValues>
      initialValues={diskImageCreateValues}
      validationSchema={getDiskImageCreateSchema(t)}
      onSubmit={onSubmit}
    >
      <FieldValidationProvider>
        <LeaveFormConfirmation />
        <PageSection
          hasBodyWrapper={false}
          isFilled
          type={PageSectionTypes.wizard}
          aria-label={t('Disk image wizard')}
        >
          <Wizard
            navAriaLabel={t('Disk image wizard steps')}
            isVisitRequired
            footer={
              <OSACWizardFooter
                onCancel={() => navigate(DISK_IMAGES_LIST_ROUTE)}
                stepHasErrors={diskImageStepHasErrors}
                error={error}
                onErrorReset={reset}
                submitLabel={t('Create disk image')}
                errorTitle={t('Failed to save disk image')}
              />
            }
            onStepChange={(_, step) => setCurrentStep(step.id as DiskImageWizardStep)}
          >
            <WizardStep id="general" name={t('General')}>
              {currentStep === 'general' && <DiskImageGeneralStep />}
            </WizardStep>
            <WizardStep id="configuration" name={t('Configuration')}>
              {currentStep === 'configuration' && <DiskImageConfigurationStep />}
            </WizardStep>
            <WizardStep id="review" name={t('Review')}>
              {currentStep === 'review' && <DiskImageReviewStep />}
            </WizardStep>
          </Wizard>
        </PageSection>
      </FieldValidationProvider>
    </Formik>
  );
};

export default DiskImageWizard;
