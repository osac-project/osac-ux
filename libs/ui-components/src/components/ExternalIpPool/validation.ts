import type { FormikErrors } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { IPFamily } from '@osac/types/private';
import { buildCidrSchema } from '@osac/ui-components/validation/cidr-validation';
import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

import type { ExternalIpPoolFormValues } from './values';

export const getExternalIpPoolSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
      description: Yup.string(),
      tenant: Yup.object({
        id: Yup.string().required(t('Tenant is required')),
        name: Yup.string(),
      }),
    }),
    ipFamily: Yup.mixed<IPFamily>()
      .oneOf([IPFamily.IP_FAMILY_IPV4, IPFamily.IP_FAMILY_IPV6])
      .required(t('IP family is required')),
    cidrs: Yup.array()
      .when('ipFamily', {
        is: IPFamily.IP_FAMILY_IPV6,
        then: (schema) => schema.of(buildCidrSchema(t, 'ipv6').required(t('CIDR is required'))),
        otherwise: (schema) =>
          schema.of(buildCidrSchema(t, 'ipv4').required(t('CIDR is required'))),
      })
      .min(1, t('At least one CIDR is required')),
  });

export const externalIpPoolStepHasErrors = (
  stepId: string,
  errors: FormikErrors<unknown>,
): boolean => {
  const poolErrors = errors as FormikErrors<ExternalIpPoolFormValues>;
  switch (stepId) {
    case 'general':
      return Boolean(poolErrors.metadata?.name || poolErrors.metadata?.tenant);
    case 'addressing':
      return Boolean(poolErrors.cidrs);
    default:
      return false;
  }
};
