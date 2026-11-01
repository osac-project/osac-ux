import { FormikErrors } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { IdentityProviderValues } from './values';

const urlSchema = (t: TFunction) =>
  Yup.string().url(t('Must be a valid URL (e.g. https://example.com)'));

export const getIdentityProviderSchema = (t: TFunction, isEdit: boolean) =>
  Yup.object({
    metadata: Yup.object({
      name: isEdit ? Yup.mixed() : Yup.string(),
    }),
    spec: Yup.object({
      title: Yup.string().required(t('Display name is required')),
      config: Yup.object({
        clientId: Yup.string().required(t('Client ID is required')),
        issuer: urlSchema(t).required(t('Issuer is required')),
      }),
    }),
    protocol: Yup.string().required(t('Protocol is required')),
  });

export const idpStepHasErrors = (
  stepId: string,
  errors: FormikErrors<IdentityProviderValues>,
): boolean => {
  switch (stepId) {
    case 'identity-provider':
      return Boolean(
        errors.metadata?.name ||
        errors.spec?.title ||
        errors.spec?.config?.clientId ||
        errors.spec?.config?.issuer ||
        errors.protocol,
      );
    default:
      return false;
  }
};
