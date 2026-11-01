import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  PageSectionTypes,
  Spinner,
  Stack,
  StackItem,
  Title,
  Wizard,
  WizardStep,
} from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';

import { RoleBinding, RoleBindings, Roles } from '@osac/types';

import { getRoleBindingSpec } from './payload';
import { roleBindingStepHasErrors, validationSchema } from './validation';
import { RoleBindingCreateFormValues, getInitialValues } from './values';
import {
  useCreateResource,
  useGetResource,
  useListResource,
  useUpdateResource,
} from '../../../api/use-resource';
import { useSession } from '../../../hooks/use-session';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import NameField from '../../catalogProvision/wizard/fields/NameField';
import { FieldValidationProvider } from '../../Form/FieldValidationContext';
import { InputField } from '../../Form/InputField';
import LeaveFormConfirmation from '../../Form/LeaveFormConfirmation';
import OsacForm from '../../Form/OsacForm';
import { SelectField } from '../../Form/SelectField';
import { OSACWizardFooter } from '../../Wizard/OSACWizardFooter';

// ---------------------------------------------------------------------------
// Tenant step
// ---------------------------------------------------------------------------

const TenantStep = ({ isEdit }: { isEdit: boolean }) => {
  const { t } = useTranslation();
  const { data: roles, isLoading: rolesLoading } = useListResource(Roles);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Tenant')}
        </Title>
      </StackItem>
      <StackItem>
        <OsacForm>
          <NameField isDisabled={isEdit} />
          <InputField
            name="email"
            label={t('Email')}
            fieldId="email-field"
            isRequired
            inputMode="email"
          />
          <SelectField
            fieldId="role"
            name="role"
            label={t('Role')}
            isRequired
            isLoading={rolesLoading}
            options={(roles?.items || []).map((role) => ({
              label: role.spec?.title || role.metadata?.name || role.id,
              value: role.metadata?.name || role.id,
            }))}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------

const ReviewContent = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<RoleBindingCreateFormValues>();

  return (
    <DescriptionList isHorizontal isCompact aria-label={t('Review')}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
        <DescriptionListDescription>{values.metadata.name}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Email')}</DescriptionListTerm>
        <DescriptionListDescription>{values.email}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Role')}</DescriptionListTerm>
        <DescriptionListDescription>{values.role}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const ReviewStep = () => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Review')}
        </Title>
      </StackItem>
      <StackItem>
        <ReviewContent />
      </StackItem>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

type RoleBindingWizardStep = 'tenant' | 'review';

interface RoleBindingCreatePageProps {
  roleBinding?: RoleBinding;
}

const RoleBindingCreatePageInner = ({ roleBinding }: RoleBindingCreatePageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const {
    mutateAsync: create,
    error: createErr,
    reset: resetCreate,
  } = useCreateResource(RoleBindings);
  const {
    mutateAsync: update,
    error: updateErr,
    reset: resetUpdate,
  } = useUpdateResource(RoleBindings);
  const [currentStep, setCurrentStep] = useState<RoleBindingWizardStep>('tenant');

  const initialValues = getInitialValues(roleBinding, tenantId);
  const navigateToList = useCallback(() => navigate('/tenant/role-binding'), [navigate]);

  const handleErrorReset = useCallback(() => {
    resetCreate();
    resetUpdate();
  }, [resetCreate, resetUpdate]);

  const onSubmit = async (values: RoleBindingCreateFormValues) => {
    try {
      if (roleBinding) {
        await update({
          object: {
            id: roleBinding.id,
            spec: getRoleBindingSpec(values),
          },
        });
      } else {
        await create({
          object: {
            metadata: values.metadata,
            spec: getRoleBindingSpec(values),
          },
        });
      }
      navigateToList();
    } catch {
      // tanstack handles the error
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={navigateToList}>
                {t('Role Bindings')}
              </Button>
            </BreadcrumbItem>
            {roleBinding && (
              <BreadcrumbItem>{roleBinding.metadata?.name || roleBinding.id}</BreadcrumbItem>
            )}
            <BreadcrumbItem isActive>{roleBinding ? t('Edit') : t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Stack hasGutter>
            <Title headingLevel="h1" size="3xl">
              {roleBinding ? t('Update role binding') : t('Add tenant')}
            </Title>
            <p className="pf-v6-u-color-200">
              {t(
                'Tenant administrators can manage catalog, networking, projects, and team access for this tenant.',
              )}
            </p>
          </Stack>
        </Stack>
      </PageSection>
      <Formik<RoleBindingCreateFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema(t)}
        onSubmit={onSubmit}
      >
        <>
          <FieldValidationProvider>
            <LeaveFormConfirmation />
            <PageSection
              hasBodyWrapper={false}
              type={PageSectionTypes.wizard}
              aria-label={t('Add tenant wizard')}
            >
              <Wizard
                navAriaLabel={t('Add tenant steps')}
                isVisitRequired
                footer={
                  <OSACWizardFooter
                    onCancel={navigateToList}
                    stepHasErrors={roleBindingStepHasErrors}
                    isEdit={!!roleBinding}
                    error={createErr || updateErr}
                    onErrorReset={handleErrorReset}
                    submitLabel={roleBinding ? t('Update') : t('Create')}
                    errorTitle={
                      roleBinding
                        ? t('Failed to update role binding')
                        : t('Failed to create role binding')
                    }
                  />
                }
                onStepChange={(_, step) => {
                  setCurrentStep(step.id as RoleBindingWizardStep);
                }}
              >
                <WizardStep id="tenant" name={t('Tenant')}>
                  {currentStep === 'tenant' && <TenantStep isEdit={!!roleBinding} />}
                </WizardStep>
                <WizardStep id="review" name={t('Review')}>
                  {currentStep === 'review' && <ReviewStep />}
                </WizardStep>
              </Wizard>
            </PageSection>
          </FieldValidationProvider>
        </>
      </Formik>
    </>
  );
};

// ---------------------------------------------------------------------------
// Page wrapper (handles loading / error state for edit mode)
// ---------------------------------------------------------------------------

const RoleBindingCreatePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useGetResource(RoleBindings, { id }, { enabled: !!id });

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Alert isInline variant="danger" title={t('Failed to fetch role binding')}>
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <RoleBindingCreatePageInner roleBinding={data?.object} />;
};

export default RoleBindingCreatePage;
