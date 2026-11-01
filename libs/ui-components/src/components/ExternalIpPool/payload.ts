import type { ExternalIpPoolFormValues } from './values';

export const toCreateRequest = (values: ExternalIpPoolFormValues) => ({
  object: {
    metadata: {
      name: values.metadata.name,
      description: values.metadata.description,
      tenant: values.metadata.tenant.id,
    },
    spec: {
      ipFamily: values.ipFamily,
      cidrs: values.cidrs,
    },
  },
});
