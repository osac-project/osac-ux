import { TFunction } from 'i18next';
import * as Yup from 'yup';

import { resourceNameSchema } from '@osac/ui-components/validation/resource-name';

export const getDiskImageCreateSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({
      name: resourceNameSchema(t),
      tenant: Yup.string(),
    }),
    spec: Yup.object({
      sourceRef: Yup.string().required(t('Source reference is required')),
      guestOsFamily: Yup.number().required(),
      architecture: Yup.array()
        .of(Yup.number().required())
        .min(1, t('Select at least one architecture'))
        .required(t('Select at least one architecture')),
    }),
    scope: Yup.mixed<'global' | 'tenant'>().oneOf(['global', 'tenant']).required(),
  }).test('tenant-required-for-tenant-scope', t('A tenant is required'), function (values) {
    if (values.scope === 'tenant' && !values.metadata?.tenant) {
      return this.createError({ path: 'metadata.tenant' });
    }
    return true;
  });
