import type { FormikErrors } from 'formik';
import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

import { RoleBindingCreateFormValues } from './values';

export const validationSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
      tenant: Yup.string().required(t('Tenant is required')),
    }),
    email: Yup.string()
      .email(t('Enter a valid email address'))
      .required(t('Email is required')),
    role: Yup.string().required(t('Role is required')),
  });

export const roleBindingStepHasErrors = (
  stepId: string,
  errors: FormikErrors<RoleBindingCreateFormValues>,
): boolean => {
  if (stepId === 'tenant') {
    return !!(errors.metadata?.name || errors.email || errors.role);
  }
  return false;
};
